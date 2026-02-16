import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { Listing } from '../models/Listing';

export class ReviewController {
  static async createReview(req: Request, res: Response) {
    try {
      const { listingId, revieweeId, orderId, rating, comment, aspects } = req.body;
      const reviewerId = req.user?.id;

      if (!reviewerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!listingId || !revieweeId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid input' });
      }

      const reviewRepo = AppDataSource.getRepository(Review);
      const existingReview = await reviewRepo.findOne({
        where: { listingId, reviewerId, orderId },
      });

      if (existingReview) {
        return res.status(409).json({ message: 'You have already reviewed this item' });
      }

      const review = reviewRepo.create({
        listingId,
        reviewerId,
        revieweeId,
        orderId,
        rating,
        comment,
        aspects: aspects || [],
      });

      await reviewRepo.save(review);

      // Update reviewer and listing ratings
      await this.updateRatings(revieweeId, listingId);

      res.status(201).json({
        message: 'Review created successfully',
        review,
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ message: 'Failed to create review' });
    }
  }

  static async getListingReviews(req: Request, res: Response) {
    try {
      const { listingId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const reviewRepo = AppDataSource.getRepository(Review);
      const [reviews, total] = await reviewRepo.findAndCount({
        where: { listingId },
        relations: ['reviewer'],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        order: { createdAt: 'DESC' },
      });

      res.json({
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  }

  static async getUserReviews(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const reviewRepo = AppDataSource.getRepository(Review);
      const reviews = await reviewRepo.find({
        where: { revieweeId: userId },
        relations: ['reviewer', 'listing'],
        order: { createdAt: 'DESC' },
      });

      res.json({ reviews });
    } catch (error) {
      console.error('Get user reviews error:', error);
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  }

  private static async updateRatings(userId: string, listingId: string) {
    try {
      const reviewRepo = AppDataSource.getRepository(Review);
      const userRepo = AppDataSource.getRepository(User);
      const listingRepo = AppDataSource.getRepository(Listing);

      const userReviews = await reviewRepo.find({ where: { revieweeId: userId } });
      const listingReviews = await reviewRepo.find({ where: { listingId } });

      if (userReviews.length > 0) {
        const avgUserRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
        const user = await userRepo.findOne({ where: { id: userId } });
        if (user) {
          user.rating = avgUserRating;
          user.reviewCount = userReviews.length;
          await userRepo.save(user);
        }
      }

      if (listingReviews.length > 0) {
        const avgListingRating = listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length;
        const listing = await listingRepo.findOne({ where: { id: listingId } });
        if (listing) {
          listing.rating = avgListingRating;
          listing.reviewCount = listingReviews.length;
          await listingRepo.save(listing);
        }
      }
    } catch (error) {
      console.error('Update ratings error:', error);
    }
  }
}
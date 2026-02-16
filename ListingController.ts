import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Listing } from '../models/Listing';
import { User } from '../models/User';
import { Like, In } from 'typeorm';

export class ListingController {
  static async createListing(req: Request, res: Response) {
    try {
      const { title, description, price, category, location, images } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!title || !description || !price || !category) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const listingRepo = AppDataSource.getRepository(Listing);

      const listing = listingRepo.create({
        title,
        description,
        price: parseFloat(price),
        category,
        location,
        images: images || [],
        sellerId: userId,
      });

      await listingRepo.save(listing);

      res.status(201).json({
        message: 'Listing created successfully',
        listing,
      });
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ message: 'Failed to create listing' });
    }
  }

  static async getAllListings(req: Request, res: Response) {
    try {
      const { category, minPrice, maxPrice, search, page = 1, limit = 20, city, status = 'active' } = req.query;

      const listingRepo = AppDataSource.getRepository(Listing);
      const queryBuilder = listingRepo.createQueryBuilder('listing')
        .where('listing.status = :status', { status })
        .leftJoinAndSelect('listing.seller', 'seller');

      if (category && category !== '') {
        queryBuilder.andWhere('listing.category = :category', { category });
      }

      if (search) {
        queryBuilder.andWhere(
          '(listing.title ILIKE :search OR listing.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (minPrice) {
        queryBuilder.andWhere('listing.price >= :minPrice', { minPrice: parseFloat(minPrice as string) });
      }

      if (maxPrice) {
        queryBuilder.andWhere('listing.price <= :maxPrice', { maxPrice: parseFloat(maxPrice as string) });
      }

      if (city) {
        queryBuilder.andWhere('listing.city ILIKE :city', { city: `%${city}%` });
      }

      const total = await queryBuilder.getCount();

      const listings = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy('listing.createdAt', 'DESC')
        .getMany();

      res.json({
        listings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get listings error:', error);
      res.status(500).json({ message: 'Failed to fetch listings' });
    }
  }

  static async getListingById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const listingRepo = AppDataSource.getRepository(Listing);
      const listing = await listingRepo.findOne({
        where: { id },
        relations: ['seller', 'reviews'],
      });

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Increment views
      listing.views += 1;
      await listingRepo.save(listing);

      res.json({ listing });
    } catch (error) {
      console.error('Get listing error:', error);
      res.status(500).json({ message: 'Failed to fetch listing' });
    }
  }

  static async updateListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const listingRepo = AppDataSource.getRepository(Listing);
      const listing = await listingRepo.findOne({ where: { id } });

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      if (listing.sellerId !== userId) {
        return res.status(403).json({ message: 'You can only edit your own listings' });
      }

      Object.assign(listing, updates);
      await listingRepo.save(listing);

      res.json({
        message: 'Listing updated successfully',
        listing,
      });
    } catch (error) {
      console.error('Update listing error:', error);
      res.status(500).json({ message: 'Failed to update listing' });
    }
  }

  static async deleteListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const listingRepo = AppDataSource.getRepository(Listing);
      const listing = await listingRepo.findOne({ where: { id } });

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      if (listing.sellerId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own listings' });
      }

      await listingRepo.remove(listing);

      res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ message: 'Failed to delete listing' });
    }
  }
}
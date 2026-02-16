import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Order } from '../models/Order';
import { Listing } from '../models/Listing';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export class OrderController {
  static async createOrder(req: Request, res: Response) {
    try {
      const { listingId, quantity = 1, shippingAddress } = req.body;
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const listingRepo = AppDataSource.getRepository(Listing);
      const listing = await listingRepo.findOne({ where: { id: listingId } });

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const totalAmount = parseFloat(listing.price.toString()) * quantity;
      const platformFee = totalAmount * 0.05; // 5% platform fee
      const sellerAmount = totalAmount - platformFee;

      const orderRepo = AppDataSource.getRepository(Order);
      const order = orderRepo.create({
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        totalAmount,
        platformFee,
        sellerAmount,
        status: 'pending',
        shippingAddress,
      });

      await orderRepo.save(order);

      res.status(201).json({
        message: 'Order created successfully',
        order,
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  }

  static async initiatePayment(req: Request, res: Response) {
    try {
      const { orderId } = req.body;
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const orderRepo = AppDataSource.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id: orderId } });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.buyerId !== buyerId) {
        return res.status(403).json({ message: 'Unauthorized to pay for this order' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(order.totalAmount.toString()) * 100),
        currency: 'usd',
        metadata: {
          orderId: order.id,
          buyerId,
        },
      });

      order.stripePaymentIntentId = paymentIntent.id;
      order.status = 'paid';
      await orderRepo.save(order);

      res.json({
        message: 'Payment initiated',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ message: 'Failed to initiate payment' });
    }
  }

  static async getOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { type = 'all' } = req.query;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const orderRepo = AppDataSource.getRepository(Order);
      let query = orderRepo.createQueryBuilder('order')
        .leftJoinAndSelect('order.listing', 'listing')
        .leftJoinAndSelect('order.buyer', 'buyer')
        .leftJoinAndSelect('order.seller', 'seller');

      if (type === 'purchases') {
        query = query.where('order.buyerId = :userId', { userId });
      } else if (type === 'sales') {
        query = query.where('order.sellerId = :userId', { userId });
      } else {
        query = query.where('order.buyerId = :userId OR order.sellerId = :userId', { userId });
      }

      const orders = await query.orderBy('order.createdAt', 'DESC').getMany();

      res.json({ orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const orderRepo = AppDataSource.getRepository(Order);
      const order = await orderRepo.findOne({ where: { id: orderId } });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.sellerId !== userId) {
        return res.status(403).json({ message: 'Only seller can update order status' });
      }

      order.status = status;
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      await orderRepo.save(order);

      res.json({
        message: 'Order updated successfully',
        order,
      });
    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({ message: 'Failed to update order' });
    }
  }
}
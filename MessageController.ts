import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Message } from '../models/Message';

export class MessageController {
  static async sendMessage(req: Request, res: Response) {
    try {
      const { receiverId, content, listingId, orderId } = req.body;
      const senderId = req.user?.id;

      if (!senderId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!receiverId || !content) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const messageRepo = AppDataSource.getRepository(Message);
      const message = messageRepo.create({
        senderId,
        receiverId,
        content,
        listingId,
        orderId,
      });

      await messageRepo.save(message);

      res.status(201).json({
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }

  static async getConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { otherUserId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const messageRepo = AppDataSource.getRepository(Message);
      const messages = await messageRepo.find({
        where: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        order: { createdAt: 'ASC' },
      });

      // Mark messages as read
      const unreadMessages = messages.filter(m => m.receiverId === userId && !m.isRead);
      for (const msg of unreadMessages) {
        msg.isRead = true;
      }
      await messageRepo.save(unreadMessages);

      res.json({ messages });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  }

  static async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const messageRepo = AppDataSource.getRepository(Message);
      const messages = await messageRepo
        .createQueryBuilder('message')
        .where('message.senderId = :userId OR message.receiverId = :userId', { userId })
        .orderBy('message.createdAt', 'DESC')
        .getMany();

      // Group by conversation (sender/receiver pair)
      const conversationMap = new Map();
      messages.forEach(msg => {
        const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, msg);
        }
      });

      const conversations = Array.from(conversationMap.values());

      res.json({ conversations });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  }
}
import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import { AuthRequest } from '../middleware/auth.js';

export const notificationsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      const result = await notificationService.getUserNotifications(userId, cursor, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const notificationId = String(req.params.id);

      const success = await notificationService.markAsRead(notificationId, userId);
      if (!success) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found' } });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const count = await notificationService.markAllAsRead(userId);
      res.json({ success: true, markedCount: count });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  },
};

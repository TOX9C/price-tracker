import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { itemsService } from '../services/items.service.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { AuthRequest } from '../middleware/auth.js';

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  urls: z.array(z.string().url()).min(1).max(5),
  category: z.enum(['electronics', 'gaming', 'home', 'fashion', 'other']).optional(),
  imageUrl: z.string().url().optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.enum(['electronics', 'gaming', 'home', 'fashion', 'other']).optional(),
});

const addUrlSchema = z.object({
  url: z.string().url(),
  storeName: z.string().max(255).optional(),
});

const itemParamsSchema = z.object({
  id: z.string().uuid(),
});

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const itemsController = {
  validateCreate: validateBody(createItemSchema),
  validateUpdate: validateBody(updateItemSchema),
  validateAddUrl: validateBody(addUrlSchema),
  validateParams: validateParams(itemParamsSchema),
  validateList: validateQuery(listQuerySchema),

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const item = await itemsService.createItem(userId, req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const { cursor, limit } = req.query as { cursor?: string; limit?: string };
      const result = await itemsService.getItems(
        userId,
        cursor,
        limit ? parseInt(limit, 10) : 20
      );
      res.json({
        items: result.items,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      next(error);
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const { id } = req.params as { id: string };
      const item = await itemsService.getItem(id, userId);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const { id } = req.params as { id: string };
      const item = await itemsService.updateItem(id, userId, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const { id } = req.params as { id: string };
      await itemsService.deleteItem(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async addUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const { id } = req.params as { id: string };
      const result = await itemsService.addUrl(id, userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async removeUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const { id, urlId } = req.params as { id: string; urlId: string };
      await itemsService.removeUrl(id, urlId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async manualCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      res.json({
        message: 'Price check queued',
        itemId: id,
        note: 'Price extraction will be implemented in Phase 2',
      });
    } catch (error) {
      next(error);
    }
  },
};

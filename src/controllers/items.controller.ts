import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { itemsService } from '../services/items.service.js';
import { priceCheckService } from '../services/price-check.service.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { AuthRequest } from '../middleware/auth.js';
import { scrapePrice } from '../scrapers/index.js';

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  urls: z.array(z.string().url()).min(1).max(5),
  category: z.enum(['electronics', 'gaming', 'home', 'fashion', 'other']).optional(),
  imageUrl: z.string().url().optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.enum(['electronics', 'gaming', 'home', 'fashion', 'other']).optional(),
  imageUrl: z.string().url().optional(),
});

const addUrlSchema = z.object({
  url: z.string().url(),
  storeName: z.string().max(255).optional(),
});

const itemParamsSchema = z.object({
  id: z.string().uuid(),
});

const jobParamsSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string(),
});

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

const previewQuerySchema = z.object({
  url: z.string().url(),
});

interface ListQuery {
  cursor?: string;
  limit?: string;
}

export const itemsController = {
  validateCreate: validateBody(createItemSchema),
  validateUpdate: validateBody(updateItemSchema),
  validateAddUrl: validateBody(addUrlSchema),
  validateParams: validateParams(itemParamsSchema),
  validateJobParams: validateParams(jobParamsSchema),
  validateList: validateQuery(listQuerySchema),
  validatePreview: validateQuery(previewQuerySchema),

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
      const parsedQuery = (req as Request & { parsedQuery?: ListQuery }).parsedQuery;
      const { cursor, limit } = parsedQuery || {};
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

  /**
   * Queue a price check for an item
   * POST /items/:id/check
   */
  async queueCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      const { id } = req.params as { id: string };

      const result = await priceCheckService.queueItemCheck(id, userId);

      if (result.rateLimited) {
        res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many price check requests',
            retryAfter: result.retryAfter,
          },
        });
        return;
      }

      res.json({
        message: 'Price check queued',
        itemId: id,
        jobs: result.jobs,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get status of a price check job
   * GET /items/:id/check/:jobId
   */
  async getCheckStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params as { jobId: string };

      const status = await priceCheckService.getCheckStatus(jobId);

      if (status.status === 'not_found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Job not found',
          },
        });
        return;
      }

      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get queue statistics
   * GET /items/queue/stats
   */
  async getQueueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await priceCheckService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Preview a URL - scrape without saving
   * GET /items/preview?url=...
   */
  async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = (req as Request & { parsedQuery?: { url: string } }).parsedQuery;
      const url = parsedQuery?.url;

      if (!url) {
        res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'URL is required' } });
        return;
      }

      const result = await scrapePrice(url);
      res.json({
        name: result.name || null,
        image: result.image || null,
        price: result.price,
        currency: result.currency,
        store: new URL(url).hostname.replace('www.', '').split('.')[0],
        availability: result.availability,
        confidence: result.confidence,
        blocked: result.blocked || false,
      });
    } catch (error) {
      next(error);
    }
  },
};

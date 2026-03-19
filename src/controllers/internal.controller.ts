import { Request, Response, NextFunction } from 'express';
import { priceCheckService } from '../services/price-check.service.js';
import {
  initScheduler,
  stopScheduler,
  triggerManualCheck,
  getSchedulerStatus,
  isSchedulerRunning,
} from '../jobs/scheduler.js';

export const internalController = {
  /**
   * Manually trigger a price check
   * POST /internal/check-prices
   */
  async triggerCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.body?.limit ? parseInt(req.body.limit, 10) : undefined;

      if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 500)) {
        res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 500',
          },
        });
        return;
      }

      const result = await triggerManualCheck(limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Price check already in progress') {
        res.status(409).json({
          error: {
            code: 'CHECK_IN_PROGRESS',
            message: 'A price check is already in progress',
          },
        });
        return;
      }
      next(error);
    }
  },

  /**
   * Get scheduler status
   * GET /internal/scheduler/status
   */
  async getSchedulerStatus(_req: Request, res: Response): Promise<void> {
    const status = getSchedulerStatus();
    res.json({
      success: true,
      data: status,
    });
  },

  /**
   * Start the scheduler
   * POST /internal/scheduler/start
   */
  async startScheduler(_req: Request, res: Response): Promise<void> {
    initScheduler({ enabled: true });
    res.json({
      success: true,
      data: getSchedulerStatus(),
    });
  },

  /**
   * Stop the scheduler
   * POST /internal/scheduler/stop
   */
  async stopScheduler(_req: Request, res: Response): Promise<void> {
    stopScheduler();
    res.json({
      success: true,
      data: getSchedulerStatus(),
    });
  },

  /**
   * Check if scheduler is running
   * GET /internal/scheduler/running
   */
  async isRunning(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        running: isSchedulerRunning(),
      },
    });
  },

  /**
   * Check a single URL manually
   * POST /internal/check-single
   */
  async checkSingleUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trackedUrlId, url, itemId, storeName, currentPrice } = req.body;

      if (!trackedUrlId || !url || !itemId) {
        res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'trackedUrlId, url, and itemId are required',
          },
        });
        return;
      }

      const result = await priceCheckService.checkUrl({
        id: trackedUrlId,
        url,
        item_id: itemId,
        store_name: storeName || null,
        current_price: currentPrice || null,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

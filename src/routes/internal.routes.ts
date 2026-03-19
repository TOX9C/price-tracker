import { Router } from 'express';
import { internalController } from '../controllers/internal.controller.js';

const router = Router();

/**
 * @openapi
 * /internal/check-prices:
 *   post:
 *     summary: Manually trigger a price check
 *     tags: [Internal]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 500
 *     responses:
 *       200:
 *         description: Price check completed
 *       409:
 *         description: Check already in progress
 */
router.post('/check-prices', internalController.triggerCheck);

/**
 * @openapi
 * /internal/check-single:
 *   post:
 *     summary: Check a single URL for price update
 *     tags: [Internal]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackedUrlId
 *               - url
 *               - itemId
 *             properties:
 *               trackedUrlId:
 *                 type: string
 *               url:
 *                 type: string
 *               itemId:
 *                 type: string
 *               storeName:
 *                 type: string
 *               currentPrice:
 *                 type: number
 */
router.post('/check-single', internalController.checkSingleUrl);

/**
 * @openapi
 * /internal/scheduler/status:
 *   get:
 *     summary: Get scheduler status
 *     tags: [Internal]
 */
router.get('/scheduler/status', internalController.getSchedulerStatus);

/**
 * @openapi
 * /internal/scheduler/start:
 *   post:
 *     summary: Start the scheduler
 *     tags: [Internal]
 */
router.post('/scheduler/start', internalController.startScheduler);

/**
 * @openapi
 * /internal/scheduler/stop:
 *   post:
 *     summary: Stop the scheduler
 *     tags: [Internal]
 */
router.post('/scheduler/stop', internalController.stopScheduler);

/**
 * @openapi
 * /internal/scheduler/running:
 *   get:
 *     summary: Check if scheduler is running
 *     tags: [Internal]
 */
router.get('/scheduler/running', internalController.isRunning);

export default router;

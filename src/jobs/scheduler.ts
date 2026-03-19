import cron from 'node-cron';
import { priceCheckService } from '../services/price-check.service.js';

export interface SchedulerConfig {
  cronExpression: string;
  enabled: boolean;
  batchSize: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  cronExpression: '0 * * * *', // Every hour at minute 0
  enabled: true,
  batchSize: 100,
};

let scheduledJob: cron.ScheduledTask | null = null;
let config = { ...DEFAULT_CONFIG };
let isRunning = false;

/**
 * Initialize the price check scheduler
 */
export function initScheduler(customConfig?: Partial<SchedulerConfig>): void {
  if (customConfig) {
    config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  if (scheduledJob) {
    scheduledJob.stop();
  }

  if (config.enabled) {
    scheduledJob = cron.schedule(config.cronExpression, async () => {
      if (isRunning) {
        console.log('[Scheduler] Previous job still running, skipping...');
        return;
      }

      isRunning = true;
      try {
        console.log('[Scheduler] Starting scheduled price check...');
        const result = await priceCheckService.runScheduledCheck(config.batchSize);
        console.log('[Scheduler] Price check complete:', result);
      } catch (error) {
        console.error('[Scheduler] Error during price check:', error);
      } finally {
        isRunning = false;
      }
    });

    console.log(`[Scheduler] Initialized with cron: ${config.cronExpression}`);
  }
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    console.log('[Scheduler] Stopped');
  }
}

/**
 * Manually trigger a price check
 */
export async function triggerManualCheck(limit?: number): Promise<{
  checked: number;
  successful: number;
  priceDrops: number;
  errors: number;
}> {
  if (isRunning) {
    throw new Error('Price check already in progress');
  }

  isRunning = true;
  try {
    const result = await priceCheckService.runScheduledCheck(limit ?? config.batchSize);
    return result;
  } finally {
    isRunning = false;
  }
}

/**
 * Check if the scheduler is currently running a job
 */
export function isSchedulerRunning(): boolean {
  return isRunning;
}

/**
 * Get current scheduler status
 */
export function getSchedulerStatus(): {
  enabled: boolean;
  cronExpression: string;
  isRunning: boolean;
} {
  return {
    enabled: config.enabled,
    cronExpression: config.cronExpression,
    isRunning,
  };
}

/**
 * Update scheduler configuration
 */
export function updateSchedulerConfig(newConfig: Partial<SchedulerConfig>): void {
  config = { ...config, ...newConfig };

  if (scheduledJob) {
    scheduledJob.stop();
  }

  if (config.enabled) {
    scheduledJob = cron.schedule(config.cronExpression, async () => {
      if (isRunning) return;

      isRunning = true;
      try {
        const result = await priceCheckService.runScheduledCheck(config.batchSize);
        console.log('[Scheduler] Price check complete:', result);
      } catch (error) {
        console.error('[Scheduler] Error:', error);
      } finally {
        isRunning = false;
      }
    });
  }
}

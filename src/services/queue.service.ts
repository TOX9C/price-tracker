import { Redis } from 'ioredis';

export interface PriceCheckJob {
  trackedUrlId: string;
  url: string;
  itemId: string;
  storeName: string | null;
  userId: string;
  priority: number;
}

export interface JobResult {
  success: boolean;
  price: number | null;
  error?: string;
  cached?: boolean;
}

// In-memory queue (works without Redis, but Redis improves reliability)
let redis: Redis | null = null;

// Job status storage
const jobStatusMap = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: JobResult;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}>();

// Rate limit tracking
const userHourlyJobs = new Map<string, { count: number; resetAt: number }>();
const userDailyJobs = new Map<string, { count: number; resetAt: number }>();

// Concurrency limits
const MAX_CONCURRENT_JOBS = 3;
const MAX_JOBS_PER_USER_PER_HOUR = 100;
const MAX_JOBS_PER_USER_PER_DAY = 500;

// Processing state
let currentJobs = 0;
const jobQueue: Array<{ job: PriceCheckJob; jobId: string }> = [];
let workerRunning = false;

// Worker function type
type JobProcessor = (job: PriceCheckJob) => Promise<JobResult>;
let jobProcessor: JobProcessor | null = null;

/**
 * Set the job processor function (called by price-check.service)
 */
export function setJobProcessor(processor: JobProcessor): void {
  jobProcessor = processor;
}

/**
 * Start the queue worker
 */
export function startWorker(): void {
  if (workerRunning) return;
  workerRunning = true;
  processNextJob();
}

/**
 * Stop the queue worker
 */
export function stopWorker(): void {
  workerRunning = false;
}

/**
 * Process next job in queue
 */
async function processNextJob(): Promise<void> {
  if (!workerRunning) return;

  const nextJob = getNextJob();
  if (!nextJob) {
    // No jobs, wait and try again
    setTimeout(() => processNextJob(), 1000);
    return;
  }

  const { job, jobId } = nextJob;

  try {
    updateJobStatus(jobId, 'processing');

    if (!jobProcessor) {
      throw new Error('No job processor configured');
    }

    const result = await jobProcessor(job);
    updateJobStatus(jobId, result.success ? 'completed' : 'failed', result, result.error);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateJobStatus(jobId, 'failed', undefined, errorMessage);
  } finally {
    completeJob();
  }

  // Process next job
  setImmediate(() => processNextJob());
}

/**
 * Initialize Redis connection (optional)
 */
export function initQueue(): void {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
      });

      redis.on('error', (err) => {
        console.error('[Queue] Redis error:', err.message);
        redis = null;
      });

      redis.on('connect', () => {
        console.log('[Queue] Redis connected');
      });

      // Try to connect
      redis.connect().catch(() => {
        console.log('[Queue] Redis unavailable, using in-memory fallback');
        redis = null;
      });
    } catch (error) {
      console.log('[Queue] Redis setup failed, using in-memory fallback');
      redis = null;
    }
  }
}

/**
 * Close queue connections
 */
export async function closeQueue(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Check if user is rate limited
 */
export function checkRateLimit(userId: string): { allowed: boolean; reason?: string; retryAfter?: number } {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  // Check hourly limit
  const hourly = userHourlyJobs.get(userId);
  if (hourly && hourly.resetAt > now) {
    if (hourly.count >= MAX_JOBS_PER_USER_PER_HOUR) {
      return {
        allowed: false,
        reason: 'Hourly limit exceeded',
        retryAfter: Math.ceil((hourly.resetAt - now) / 1000),
      };
    }
  } else {
    userHourlyJobs.set(userId, { count: 0, resetAt: now + HOUR });
  }

  // Check daily limit
  const daily = userDailyJobs.get(userId);
  if (daily && daily.resetAt > now) {
    if (daily.count >= MAX_JOBS_PER_USER_PER_DAY) {
      return {
        allowed: false,
        reason: 'Daily limit exceeded',
        retryAfter: Math.ceil((daily.resetAt - now) / 1000),
      };
    }
  } else {
    userDailyJobs.set(userId, { count: 0, resetAt: now + DAY });
  }

  return { allowed: true };
}

/**
 * Increment user's job count
 */
function incrementUserJobCount(userId: string): void {
  const hourly = userHourlyJobs.get(userId);
  if (hourly) hourly.count++;

  const daily = userDailyJobs.get(userId);
  if (daily) daily.count++;
}

/**
 * Add a price check job to the queue
 */
export async function addPriceCheckJob(job: PriceCheckJob): Promise<{ jobId: string; position: number }> {
  const jobId = `${job.itemId}-${job.trackedUrlId}-${Date.now()}`;

  // Track status
  jobStatusMap.set(jobId, {
    status: 'pending',
    createdAt: new Date(),
  });

  // Increment user's rate limit counter
  incrementUserJobCount(job.userId);

  // Add to in-memory queue
  jobQueue.push({ job, jobId });

  return {
    jobId,
    position: jobQueue.length,
  };
}

/**
 * Get next job from queue (for processing)
 */
export function getNextJob(): { job: PriceCheckJob; jobId: string } | null {
  if (jobQueue.length === 0 || currentJobs >= MAX_CONCURRENT_JOBS) {
    return null;
  }

  currentJobs++;
  return jobQueue.shift() || null;
}

/**
 * Mark job as complete (release slot)
 */
export function completeJob(): void {
  if (currentJobs > 0) {
    currentJobs--;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  result?: JobResult;
  error?: string;
  createdAt?: Date;
  completedAt?: Date;
}> {
  const tracked = jobStatusMap.get(jobId);
  if (tracked) {
    return {
      status: tracked.status,
      result: tracked.result,
      error: tracked.error,
      createdAt: tracked.createdAt,
      completedAt: tracked.completedAt,
    };
  }

  return { status: 'not_found' };
}

/**
 * Update job status (called by worker)
 */
export function updateJobStatus(jobId: string, status: 'pending' | 'processing' | 'completed' | 'failed', result?: JobResult, error?: string): void {
  const existing = jobStatusMap.get(jobId);
  if (existing) {
    jobStatusMap.set(jobId, {
      ...existing,
      status,
      result,
      error,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
    });
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  let completed = 0;
  let failed = 0;
  let waiting = 0;
  let active = 0;

  for (const status of jobStatusMap.values()) {
    switch (status.status) {
      case 'pending': waiting++; break;
      case 'processing': active++; break;
      case 'completed': completed++; break;
      case 'failed': failed++; break;
    }
  }

  // Override with pending queue
  waiting = jobQueue.length;
  active = currentJobs;

  return { waiting, active, completed, failed };
}

/**
 * Get maximum concurrent jobs
 */
export function getMaxConcurrency(): number {
  return MAX_CONCURRENT_JOBS;
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return redis !== null && redis.status === 'ready';
}

// Clean up old job statuses periodically
setInterval(() => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [jobId, status] of jobStatusMap.entries()) {
    if (status.completedAt && now - status.completedAt.getTime() > ONE_HOUR) {
      jobStatusMap.delete(jobId);
    }
  }
}, 60 * 60 * 1000);

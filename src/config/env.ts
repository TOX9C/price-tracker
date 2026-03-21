// src/config/env.ts
import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Redis for job queue (optional)
  REDIS_URL: z.string().optional(),
  // External scraping providers (optional)
  SCRAPING_PROVIDER: z.enum(['none', 'scrapingbee', 'scraperapi', 'zenrows']).default('none'),
  SCRAPING_API_KEY: z.string().optional(),
  // Rate limiting
  MAX_JOBS_PER_USER_PER_HOUR: z.string().default('100'),
  MAX_JOBS_PER_USER_PER_DAY: z.string().default('500'),
  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

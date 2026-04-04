// Simple in-memory rate limiter for development
// Replace with @upstash/ratelimit for production

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

export function checkRateLimit(ip: string): { success: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { success: false, retryAfter };
  }

  record.count++;
  return { success: true };
}

export function resetRateLimit(ip: string): void {
  attempts.delete(ip);
}

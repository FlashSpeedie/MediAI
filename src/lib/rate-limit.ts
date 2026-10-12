import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter configuration
 * Uses Upstash Redis for distributed rate limiting in production
 * Uses in-memory Map for local development only
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
}

function createInMemoryLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs, keyPrefix = 'api' } = config;
  const store = new Map<string, { count: number; resetTime: number }>();

  return async function rateLimit(request: Request): Promise<RateLimitResult> {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const key = `${keyPrefix}:${ip}:${userAgent.slice(0, 50)}`;

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs, limit: maxRequests };
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, remaining: 0, resetTime: entry.resetTime, retryAfter, limit: maxRequests };
    }

    entry.count++;
    store.set(key, entry);
    return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime, limit: maxRequests };
  };
}

// Initialize Upstash Redis client if credentials are available
let redis: Redis | null = null;
let upstashAvailable = false;
let upstashInitializationError: Error | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redis = redisClient;
    upstashAvailable = true;
  } catch (error) {
    upstashInitializationError = error instanceof Error ? error : new Error(String(error));
    console.error('Failed to initialize Upstash Redis:', upstashInitializationError);
    upstashAvailable = false;
  }
}

function createUpstashLimiter(config: RateLimitConfig) {
  if (!redis) {
    throw new Error('Upstash Redis not initialized');
  }

  const { maxRequests, windowMs, keyPrefix = 'api' } = config;
  const windowSec = Math.ceil(windowMs / 1000);

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
    analytics: true,
    prefix: `ratelimit:${keyPrefix}`,
  });

  return async function rateLimit(request: Request): Promise<RateLimitResult> {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const key = `${keyPrefix}:${ip}:${userAgent.slice(0, 50)}`;

    try {
      const { success, limit, remaining, reset } = await ratelimit.limit(key);
      const resetTime = reset * 1000; // Convert to milliseconds

      if (!success) {
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        return { allowed: false, remaining: 0, resetTime, retryAfter, limit };
      }

      return { allowed: true, remaining, resetTime, limit };
    } catch (error) {
      // In production, do NOT fall back to in-memory - fail safely
      if (process.env.NODE_ENV === 'production') {
        console.error('Upstash rate limit error in production:', error);
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
          limit: 0,
        };
      }
      // Development only: fall back to in-memory
      console.warn('Upstash rate limit error in development, falling back to in-memory:', error);
      return createInMemoryLimiter(config)(request);
    }
  };
}

// Determine which limiter to use
// In production, Upstash MUST be available. In development, use in-memory.
const isProduction = process.env.NODE_ENV === 'production';

function createRateLimiter(config: RateLimitConfig) {
  if (isProduction) {
    if (!upstashAvailable) {
      // In production without Upstash credentials, return a limiter that always rejects
      console.error('PRODUCTION RATE LIMITER: Upstash Redis not configured. All requests will be rate limited.');
      return async function rateLimit(): Promise<RateLimitResult> {
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
          limit: 0,
        };
      };
    }
    return createUpstashLimiter(config);
  }
  return createInMemoryLimiter(config);
}

export const chatRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'chat',
});

export const imageAnalysisRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  keyPrefix: 'image-analysis',
});

export const medicineLookupRateLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  keyPrefix: 'medicine-lookup',
});

export const authRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  keyPrefix: 'auth',
});

export const cabinetRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
  keyPrefix: 'cabinet',
});

export function addRateLimitHeaders(
  response: Response,
  rateLimitResult: RateLimitResult
): Response {
  response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetTime / 1000)));
  if (rateLimitResult.retryAfter) {
    response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
  }
  return response;
}

export { createInMemoryLimiter, createRateLimiter };
export type { RateLimitResult };
export function getRateLimiterStatus(): { type: 'upstash' | 'memory' | 'unavailable'; available: boolean } {
  return {
    type: isProduction ? (upstashAvailable ? 'upstash' : 'unavailable') : 'memory',
    available: isProduction ? upstashAvailable : true,
  };
}
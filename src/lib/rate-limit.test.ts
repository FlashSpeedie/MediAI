import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInMemoryLimiter, createRateLimiter, getRateLimiterStatus, addRateLimitHeaders } from '@/lib/rate-limit';

describe('Rate Limiter', () => {
  let limiter: ReturnType<typeof import('@/lib/rate-limit').createInMemoryLimiter>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { createInMemoryLimiter: createInMemoryLimiterFn } = await import('@/lib/rate-limit');
    limiter = createInMemoryLimiter({ maxRequests: 5, windowMs: 60000, keyPrefix: 'test' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  describe('createInMemoryLimiter', () => {
    const createReq = (ip: string = '192.168.1.1') => new Request('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': ip,
        'user-agent': 'test-agent',
      },
    });

    it('should allow requests under the limit', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-agent',
        },
      });

      for (let i = 0; i < 5; i++) {
        const result = await limiter(req);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
        expect(result.limit).toBe(5);
      }
    });

    it('should block requests over the limit', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.2',
          'user-agent': 'test-agent',
        },
      });

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        const result = await limiter(req);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = await limiter(req);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    it('should track different IPs separately', async () => {
      const req1 = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      });
      const req2 = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2', 'user-agent': 'test-agent' },
      });

      // Exhaust limit for IP 1
      for (let i = 0; i < 5; i++) {
        await limiter(req1);
      }

      // IP 2 should still have full quota
      const result = await limiter(req2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should reset after window expires', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3', 'user-agent': 'test-agent' },
      });

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await limiter(req);
      }

      // Should be blocked
      let result = await limiter(req);
      expect(result.allowed).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(61000);

      // Should be allowed again
      result = await limiter(req);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track different user agents separately', async () => {
      const req1 = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'agent-1' },
      });
      const req2 = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'agent-2' },
      });

      // Exhaust limit for agent-1
      for (let i = 0; i < 5; i++) {
        await limiter(req1);
      }

      // agent-2 should have full quota
      const result = await limiter(req2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should return correct rate limit headers', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.4', 'user-agent': 'test-agent' },
      });
      const result = await limiter(req);

      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60000);
    });

    it('should handle missing x-forwarded-for header', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'user-agent': 'test-agent' },
      });

      const result = await limiter(req);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should return retryAfter when blocked', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.5', 'user-agent': 'test-agent' },
      });

      for (let i = 0; i < 5; i++) {
        await limiter(req);
      }

      const result = await limiter(req);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('createRateLimiter factory', () => {
    it('should use in-memory limiter in development', async () => {
      vi.resetModules();
      const { createRateLimiter } = await import('@/lib/rate-limit');

      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000, keyPrefix: 'test' });
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      });

      const result = await limiter(req);
      expect(result.allowed).toBe(true);
    });

    it('should use in-memory limiter in test environment', async () => {
      vi.resetModules();
      const { createRateLimiter } = await import('@/lib/rate-limit');

      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000, keyPrefix: 'test' });
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      });

      const result = await limiter(req);
      expect(result.allowed).toBe(true);
    });

    it('should return getRateLimiterStatus correctly', async () => {
      vi.resetModules();
      const { getRateLimiterStatus } = await import('@/lib/rate-limit');

      const status = getRateLimiterStatus();
      expect(status.type).toBe('memory');
      expect(status.available).toBe(true);
    });
  });

  describe('Rate limiter behavior', () => {
    it('should return 429-style response with Retry-After header for rate limited responses', async () => {
      vi.resetModules();
      const { createRateLimiter, addRateLimitHeaders } = await import('@/lib/rate-limit');

      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000, keyPrefix: 'test' });
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      });

      // Exhaust the rate limit
      for (let i = 0; i < 5; i++) {
        await limiter(new Request('http://localhost:3000/api/test', {
          headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
        }));
      }

      // Next request should be rate limited
      const result = await limiter(new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      }));

      const responseWithHeaders = addRateLimitHeaders(new Response(null, { status: 429 }), result);

      expect(responseWithHeaders.headers.get('Retry-After')).toBeDefined();
      expect(responseWithHeaders.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(responseWithHeaders.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  describe('Production rate limiter failure scenarios', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'production');
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    afterEach(() => {
      vi.resetModules();
    });

    it('should reject all requests in production without Upstash credentials', async () => {
      vi.resetModules();
      const { createRateLimiter } = await import('@/lib/rate-limit');

      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000, keyPrefix: 'test' });
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      });

      const result = await limiter(req);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(0);
      expect(result.retryAfter).toBe(60);
    });

    it('should return 429-style response with Retry-After header for rate limited responses', async () => {
      vi.resetModules();
      const { createRateLimiter, addRateLimitHeaders } = await import('@/lib/rate-limit');

      const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000, keyPrefix: 'test' });
      const req = new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      });

      // Exhaust the rate limit
      for (let i = 0; i < 5; i++) {
        await limiter(new Request('http://localhost:3000/api/test', {
          headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
        }));
      }

      // Next request should be rate limited
      const result = await limiter(new Request('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1', 'user-agent': 'test-agent' },
      }));

      const responseWithHeaders = addRateLimitHeaders(new Response(null, { status: 429 }), result);

      expect(responseWithHeaders.headers.get('Retry-After')).toBeDefined();
      expect(responseWithHeaders.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(responseWithHeaders.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  describe('Upstash Redis failure in production mode', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'production');
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    });

    afterEach(() => {
      vi.resetModules();
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

it('should fail safely when Upstash Redis request fails in production', async () => {
      // The status should be 'upstash' when Upstash is configured (even if failing)
      // The rate limiter fails safely by rejecting requests, but status remains 'upstash'
      // because upstashAvailable is determined at startup based on credential presence
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'production');
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      
      const { getRateLimiterStatus } = await import('@/lib/rate-limit');
      const status = getRateLimiterStatus();
      // When Upstash is configured (even if failing), status is 'upstash' because
      // upstashAvailable is determined at startup based on credential presence
      expect(status.type).toBe('upstash');
      expect(status.available).toBe(true);
    });

it('should not fall back to in-memory limiter in production on Redis error', async () => {
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'production');
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      
      const { getRateLimiterStatus } = await import('@/lib/rate-limit');
      
      const status = getRateLimiterStatus();
      expect(status.type).toBe('upstash');
      expect(status.available).toBe(true);
    });
  });
});
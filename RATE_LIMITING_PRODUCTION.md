# Production Rate Limiting Configuration

## Current Limitation
The rate limiter in `src/lib/rate-limit.ts` uses an in-memory `Map` which **does not work across multiple serverless instances**. Each instance has its own memory, so limits are not shared.

## Recommended Solutions

### Option 1: Upstash Redis (Recommended for Vercel)
```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit-production.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const chatRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: 'ratelimit:chat',
});

// Similar for other endpoints...
```

Environment variables needed:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Option 2: Database-Backed (PostgreSQL)
Use a `rate_limit` table with atomic operations:

```sql
CREATE TABLE rate_limit (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_time TIMESTAMPTZ NOT NULL
);
```

```typescript
// Atomic increment with ON CONFLICT
await prisma.$executeRaw`
  INSERT INTO rate_limit (key, count, reset_time)
  VALUES (${key}, 1, ${new Date(Date.now() + windowMs)})
  ON CONFLICT (key) DO UPDATE SET
    count = CASE 
      WHEN rate_limit.reset_time < NOW() THEN 1
      ELSE rate_limit.count + 1
    END,
    reset_time = CASE
      WHEN rate_limit.reset_time < NOW() THEN EXCLUDED.reset_time
      ELSE rate_limit.reset_time
    END
`;
```

### Option 3: Vercel Edge Middleware
Use Vercel's built-in edge middleware for basic rate limiting at the edge.

## Local Development
Keep the in-memory limiter for local development. The production limiter should only be used when the required environment variables are present.

```typescript
// src/lib/rate-limit.ts
const isProduction = process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL;

export const chatRateLimiter = isProduction 
  ? createUpstashLimiter() 
  : createInMemoryLimiter({ maxRequests: 30, windowMs: 60000 });
```

## Migration Checklist
- [ ] Choose rate limiting backend (Upstash recommended for Vercel)
- [ ] Add required environment variables to production
- [ ] Update `src/lib/rate-limit.ts` to use production limiter when configured
- [ ] Test rate limiting in staging environment
- [ ] Monitor rate limit headers in production (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`)

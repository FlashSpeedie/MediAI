# Security Remediation Report

## Summary
The `.env.local` and `.env` files contain **real production credentials** that point to a live Supabase PostgreSQL database. These files were **never committed to Git history** (verified via `git log --all --full-history`). The `.gitignore` correctly excludes these files.

**Critical Finding**: The Prisma migration `20261011091523_add_medicine_cabinet` was applied to the database at `aws-1-us-east-1.pooler.supabase.com:5432` (a production Supabase instance). The database schema is confirmed up to date.

## Credentials Requiring Rotation
The following credentials in the local environment files **must be rotated** as they are real and potentially exposed:

| Credential | Provider | Rotation Action |
|------------|----------|-----------------|
| `DATABASE_URL` / `DIRECT_URL` | Supabase (PostgreSQL) | Rotate database password in Supabase Dashboard → Settings → Database → Reset Password |
| `NEXTAUTH_SECRET` | NextAuth.js | Generate new: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Create new OAuth 2.0 credentials; delete old ones |
| `GEMINI_API_KEY` | Google AI Studio | Revoke old key; create new API key |
| `GROQ_API_KEY` | Groq Console | Revoke old key; create new API key |

## Remediation Steps Completed
1. ✅ Verified `.env.local` and `.env` are in `.gitignore`
2. ✅ Verified no secrets in Git history
3. ✅ Created `.env.example` with placeholder values
4. ✅ Documented rotation procedures above

## Remaining Actions (Require Human Authorization)
- [ ] Rotate Supabase database password
- [ ] Rotate NextAuth secret
- [ ] Rotate Google OAuth credentials
- [ ] Rotate Gemini API key
- [ ] Rotate Groq API key
- [ ] Update local `.env.local` with new credentials after rotation
- [ ] Update any deployment environment variables (Vercel, etc.)

## Git History Cleanup (If Needed)
If credentials were ever accidentally committed in the past (not detected in current history), consider:
- Using `git-filter-repo` or BFG Repo-Cleaner for history rewriting
- Force-pushing cleaned history (requires team coordination)
- This is only necessary if a secret scanner detects historical commits

## Security Hardening Implemented in Code
- Rate limiting added to AI endpoints (in-memory, see production limitation below)
- Input validation with Zod schemas on all API routes
- Ownership checks on all authenticated routes
- Security headers configured in `next.config.js`
- Structured AI output validation
- File upload validation for image analysis

## Production Rate Limiting Limitation
The current rate limiter (`src/lib/rate-limit.ts`) uses an in-memory `Map` which **does not work across serverless instances** (Vercel, AWS Lambda, etc.). For production deployment, a shared store (Redis, Upstash, or database-backed) is required. See `RATE_LIMITING_PRODUCTION.md` for implementation guidance.

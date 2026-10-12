# MediAI - AI-Powered Symptom Triage & Medication Management

A Next.js 15 application for AI-powered symptom triage and medication management with official FDA/RxNorm drug data integration.

## Features

### Core Triage Functionality
- **Structured symptom conversations** - Guided follow-up questions (onset → severity → location → associated symptoms → history → medications → allergies)
- **Emergency detection** - Deterministic keyword-based safety layer with immediate 911 guidance
- **Urgency assessment** - Four-level classification (LOW, MEDIUM, HIGH, CRITICAL) with actionable next steps
- **OTC medication recommendations** - FDA-sourced, matched from AI response with validation
- **Session persistence** - Full conversation history stored per user with AI-generated health summaries

### Medication Management
- **Medicine cabinet** - Private, user-confirmed medication records with verification states
- **Medicine label scanning** - Camera capture + local OCR (Tesseract.js) with review/correction workflow
- **FDA drug lookup** - Live OpenFDA drug-label API + NIH RxNorm integration
- **Recall matching** - FDA enforcement reports with match confidence (confirmed/ambiguous/no match/error)
- **Source transparency** - Every medication card shows FDA/NIH badges with working source links

### User Experience
- **Multi-modal input** - Text, voice (Web Speech API), and camera/image upload
- **Mobile-first responsive design** - Hamburger navigation, drawer-based medicine panel
- **Accessibility** - Skip links, ARIA live regions, keyboard navigation, visible focus states
- **Family groups** - Shared account management with invite codes (admin/member roles)

### Security & Reliability
- **Input validation** - Zod schemas on all API routes
- **Rate limiting** - Per-endpoint limits for AI, image, medicine, auth, and cabinet operations
- **Security headers** - CSP, X-Content-Type-Options, Referrer-Policy, frame restrictions
- **Ownership enforcement** - Server-side verification on all authenticated routes
- **Structured AI output** - Validated response schema replacing fragile regex parsing

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 + custom design system |
| UI Components | Radix UI primitives |
| Database | PostgreSQL (Supabase) via Prisma ORM |
| Auth | NextAuth v5 (credentials only) |
| AI Chat | Groq SDK → Llama 3.3 70B Versatile |
| AI Vision | Google Generative AI SDK → Gemini 2.5 Flash/Pro |
| Drug Data | OpenFDA API + NIH RxNorm (no keys required) |
| OCR | Tesseract.js (local browser processing) |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| Linting | ESLint + @typescript-eslint |

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (Supabase recommended)
- API keys for: Groq, Google AI Studio (Gemini)

### Installation

```bash
# Clone and install dependencies
cd WebApp
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler) | Yes |
| `DIRECT_URL` | Direct PostgreSQL connection for migrations | Yes |
| `NEXTAUTH_SECRET` | 32-byte base64 secret (`openssl rand -base64 32`) | Yes |
| `NEXTAUTH_URL` | App URL (e.g., `http://localhost:3000`) | Yes |
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |
| `GROQ_API_KEY` | Groq Cloud API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes |

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: Open Prisma Studio
npm run db:studio
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
npm run test         # Run Vitest unit/integration tests
npm run test:ui      # Run Vitest with UI
npm run test:e2e     # Run Playwright E2E tests
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
WebApp/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Login/register pages
│   │   ├── api/               # API routes
│   │   │   ├── cabinet/       # Medicine cabinet CRUD
│   │   │   ├── chat/          # Triage conversation
│   │   │   ├── analyze-image/ # Image analysis
│   │   │   ├── medicines/     # FDA/RxNorm lookup + recalls
│   │   │   ├── history/       # Session history
│   │   │   ├── health-summary/# AI health summaries
│   │   │   ├── onboarding/    # Health profile
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── register/      # Registration
│   │   │   ├── account/       # Account management
│   │   │   └── family/        # Family groups
│   │   ├── chat/              # Main triage page
│   │   ├── dashboard/         # Session history
│   │   ├── account/           # Settings
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── chat/              # ChatWindow, ChatInput, MessageBubble, UrgencyBanner
│   │   ├── video/             # CameraView
│   │   ├── medicines/         # MedicinePanel (lookup + cabinet)
│   │   ├── layout/            # Navbar, Disclaimer
│   │   ├── history/           # SymptomHistory
│   │   ├── auth/              # LoginForm, RegisterForm
│   │   └── account/           # AccountPage
│   ├── hooks/
│   │   ├── useChat.ts         # Chat state + API communication
│   │   ├── useCamera.ts       # Camera stream + frame capture
│   │   └── useVoiceInput.ts   # Web Speech API wrapper
│   ├── lib/
│   │   ├── chat-response.ts   # AI response validation utilities
│   │   ├── validation.ts      # Zod schemas
│   │   ├── rate-limit.ts      # In-memory rate limiting
│   │   ├── groq.ts            # Groq chat integration
│   │   ├── gemini.ts          # Gemini vision + chat
│   │   ├── medicine-api.ts    # FDA/RxNorm/Recall APIs
│   │   ├── user-context.ts    # Profile → AI context
│   │   ├── urgency.ts         # Urgency display helpers
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma singleton
│   │   └── utils.ts           # ClassName helper
│   ├── constants/
│   │   ├── triage.ts          # Questions + emergency keywords
│   │   └── onboarding.ts      # Onboarding step definitions
│   └── types/index.ts         # TypeScript interfaces
├── tests/
│   └── e2e/                   # Playwright tests
├── .env.example               # Environment template
├── .eslintrc.json             # ESLint config
├── vitest.config.ts           # Vitest config
├── playwright.config.ts       # Playwright config
├── tailwind.config.js         # Tailwind config
├── next.config.js             # Next.js config
└── SECURITY-REMEDIATION.md    # Credential rotation guide
```

## API Endpoints

### Chat & Triage
- `POST /api/chat` - Main triage conversation with validation, rate limiting, structured output
- `POST /api/analyze-image` - Image analysis (Gemini Vision + Groq guidance)

### Medicine Cabinet
- `GET /api/cabinet` - List user's cabinet items
- `POST /api/cabinet` - Add item (with validation)
- `GET /api/cabinet/[id]` - Get single item
- `PUT /api/cabinet/[id]` - Update item (resets verification on key changes)
- `DELETE /api/cabinet/[id]` - Delete item

### Medicine Lookup & Recalls
- `GET /api/medicines?drug=X` - Drug label lookup (OpenFDA + RxNorm)
- `GET /api/medicines?symptom=Y` - OTC search by symptom
- `GET /api/medicines?recall=Z` - FDA recall lookup
- `GET /api/medicines?prefetch=true/false` - Seed data for MedicinePanel

### Auth & Account
- `POST /api/register` - Email/password registration
- `POST /api/auth/*` - NextAuth endpoints
- `GET/PUT /api/onboarding` - Health profile
- `POST /api/account/password` - Password change
- `DELETE /api/account` - Account deletion

### History & Family
- `GET /api/history` - List sessions
- `GET/DELETE /api/history/[id]` - Session detail/deletion
- `GET/POST /api/family` - Family group CRUD
- `POST /api/family/join` - Join via invite code

## Testing

### Unit/Integration Tests (Vitest)
```bash
npm run test
```
Covers:
- Validation schemas (chat, image, medicine, onboarding, register, cabinet)
- AI response parsing (urgency, medicines, assessments)
- FDA/RxNorm/Recall API error handling

### E2E Tests (Playwright)
```bash
npm run test:e2e
```
Covers:
- Landing page navigation
- Authentication flows
- Accessibility checks (skip links, heading hierarchy)

## Security

See [SECURITY-REMEDIATION.md](./SECURITY-REMEDIATION.md) for credential rotation procedures.

### Implemented Protections
- All secrets in `.env.local` (gitignored)
- No credentials in client bundles
- Zod validation on all inputs
- Ownership checks on all authenticated routes
- Rate limiting on expensive endpoints
- Security headers (CSP, X-Frame-Options, etc.)
- Structured AI output validation

## Medical Safety

AI Doctor provides **general health information only** - not medical advice, diagnosis, or treatment.

### Safety Measures
- Deterministic emergency keyword layer (cannot be downgraded by AI)
- Four-level urgency with explicit 911 guidance for CRITICAL
- No prescription medication recommendations
- Source-linked FDA/RxNorm data only
- Verification states for cabinet items (needs_review → user_confirmed)
- Clear disclaimers on every assessment

### Limitations
- No personalized treatment recommendations
- No drug interaction engine (label sections shown when available)
- OCR not a substitute for reading actual labels
- Recall data may have publication delays
- Not a substitute for professional medical care

## Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - Supabase PostgreSQL pooler URL
   - `DIRECT_URL` - Supabase direct PostgreSQL URL
   - `NEXTAUTH_SECRET` - 32-byte base64 secret
   - `NEXTAUTH_URL` - Production URL (e.g., `https://medi-ai-silk.vercel.app`)
   - `GEMINI_API_KEY` - Google AI Studio API key
   - `GROQ_API_KEY` - Groq Cloud API key
   - `NEXT_PUBLIC_APP_URL` - Production URL
   - Optional: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for rate limiting (production rate limiter fails closed without these)
3. Run `npm run db:migrate` against production database
4. Deploy

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## License

MIT License - see LICENSE file for details.

## Disclaimer

This application is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for medical decisions. In emergencies, call 911 immediately.

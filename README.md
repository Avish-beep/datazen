# DataZen Backend (Phase 1)

Backend Route Handlers for **DataZen**, a mobile data tracking, waste avoidance, and exhaustion prediction platform.

## Architecture

- **Framework**: Next.js 15 (App Router Route Handlers only - `src/app/api/v1/...`)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security, Auth JWT verification)
- **Validation**: Zod
- **Testing**: Vitest
- **CI/CD**: GitHub Actions (Lint, Type-check, Unit tests) + Vercel Deployment

```
datazen/
├── .github/workflows/ci.yml       # Automated CI on PRs & Main
├── supabase/migrations/           # Versioned SQL migrations
├── src/
│   ├── app/api/v1/                # Route handlers
│   │   ├── health/                # Public uptime check
│   │   ├── usage/
│   │   │   ├── sync/              # Idempotent batch upsert & rate limiting
│   │   │   ├── summary/           # Today, week, month totals, waste metrics
│   │   │   ├── history/           # Aggregations (daily, weekly, monthly)
│   │   │   ├── apps/              # Per-app breakdown by date
│   │   │   └── prediction/        # Depletion date estimate
│   │   ├── settings/quota/        # GET & PUT quota configuration
│   │   └── devices/               # Device management (GET, POST, DELETE)
│   ├── lib/                       # Auth, Supabase clients, CORS, Rate Limit, Response helpers
│   ├── repositories/              # Database data access layer
│   ├── services/                  # Business logic (waste calculation & prediction)
│   └── validators/                # Zod request validation schemas
├── tests/                         # Vitest unit & validation test suites
└── openapi.yaml                   # OpenAPI 3.1 specification
```

## Environment Variables

| Variable | Description | Client Exposed |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (`https://<ref>.supabase.co`) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | **No (Backend Only)** |

## Database Setup & Migrations

Migrations are stored under `supabase/migrations/` and applied using Supabase CLI:

```bash
supabase db push
```

Tables included:
- `profiles`: User profile data referencing `auth.users(id)`
- `devices`: User registered devices
- `quota_settings`: Daily & monthly data quotas
- `daily_usage`: Daily device totals with unique constraint `(device_id, date)`
- `app_usage`: Per-app breakdown with unique constraint `(device_id, date, package_name)`
- `rate_limits`: Postgres-backed rate limiting storage
- `check_rate_limit()`: Stored procedure for atomic rate checks

## Running Tests

```bash
npm test
```

## API Documentation

See [openapi.yaml](./openapi.yaml) for full schema and request/response specifications.

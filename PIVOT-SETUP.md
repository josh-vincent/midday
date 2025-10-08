# Pivot Project Setup Guide

This document explains the Pivot project architecture within the Midday monorepo.

## Overview

Pivot is built as a **separate application** within the Midday monorepo, sharing common packages while maintaining its own independent API and frontend.

## Architecture

```
midday/
├── apps/
│   ├── api/                # Midday API (port 3334)
│   ├── dashboard/          # Midday Dashboard (port 3333)
│   ├── mobile/             # Midday Mobile
│   ├── templates/          # Midday Templates
│   ├── pivot-api/          # 🆕 Pivot API (port 3335)
│   └── pivot-dashboard/    # 🆕 Pivot Dashboard (port 3336)
├── packages/
│   ├── db/                 # ✅ Shared database layer
│   ├── invoice/            # ✅ Shared invoice logic
│   ├── supabase/           # ✅ Shared Supabase client
│   ├── ui/                 # ✅ Shared UI components
│   ├── utils/              # ✅ Shared utilities
│   ├── pivot-core/         # 🆕 Pivot-specific business logic
│   └── ...                 # Other shared packages
└── package.json            # Root workspace config
```

## Shared Packages

Both Midday and Pivot share these packages:

| Package | Purpose |
|---------|---------|
| `@midday/db` | Database schemas, queries, and ORM |
| `@midday/supabase` | Supabase client configuration |
| `@midday/cache` | Redis caching layer |
| `@midday/encryption` | Encryption utilities |
| `@midday/logger` | Logging utilities |
| `@midday/ui` | UI component library |
| `@midday/utils` | Common utility functions |

## Pivot-Specific Packages

| Package | Purpose |
|---------|---------|
| `@midday/pivot-core` | Pivot business logic, types, and utilities |

## Development

### Start Pivot API

```bash
# From root
bun run dev:pivot-api

# Or directly
cd apps/pivot-api && bun run dev
```

API will be available at: **http://localhost:3335**

### Start Pivot Dashboard

```bash
# From root
bun run dev:pivot-dashboard

# Or directly
cd apps/pivot-dashboard && bun run dev
```

Dashboard will be available at: **http://localhost:3336**

### Start Both (Recommended)

```bash
bun run dev:pivot
```

This runs both Pivot API and Dashboard in parallel.

### Start Everything (Midday + Pivot)

```bash
bun run dev
```

This will start all apps in the monorepo (Midday API, Dashboard, Mobile, Pivot API, Pivot Dashboard).

## Building

### Build Pivot Only

```bash
bun run build:pivot
```

### Build Everything

```bash
bun run build
```

## Environment Variables

### Pivot API (.env.local)

Create `apps/pivot-api/.env.local`:

```bash
# Database
DATABASE_URL=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Redis (optional)
REDIS_URL=
```

### Pivot Dashboard (.env.local)

Create `apps/pivot-dashboard/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# API
NEXT_PUBLIC_API_URL=http://localhost:3335
```

## Package Dependencies

### Adding Dependencies

**To Pivot API:**
```bash
bun add <package> --filter=@midday/pivot-api
```

**To Pivot Dashboard:**
```bash
bun add <package> --filter=@midday/pivot-dashboard
```

**To Pivot Core:**
```bash
bun add <package> --filter=@midday/pivot-core
```

### Using Shared Packages

In your Pivot apps, import shared packages like this:

```typescript
// Pivot API (apps/pivot-api/src/index.ts)
import { db } from '@midday/db';
import { logger } from '@midday/logger';
import { formatPivotDate } from '@midday/pivot-core/utils';

// Pivot Dashboard (apps/pivot-dashboard/src/app/page.tsx)
import { Button } from '@midday/ui';
import { formatDate } from '@midday/utils';
import type { PivotConfig } from '@midday/pivot-core/types';
```

## Project Structure Details

### Pivot API (`apps/pivot-api`)

```
apps/pivot-api/
├── src/
│   ├── index.ts           # Main entry point (Hono app)
│   ├── trpc/              # tRPC routers (to be added)
│   └── routes/            # HTTP routes (to be added)
├── package.json
├── tsconfig.json
└── README.md
```

**Technology Stack:**
- Runtime: Bun
- Framework: Hono
- API: tRPC
- Database: Shared via `@midday/db`

### Pivot Dashboard (`apps/pivot-dashboard`)

```
apps/pivot-dashboard/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── components/        # React components (to be added)
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

**Technology Stack:**
- Framework: Next.js 15
- Styling: Tailwind CSS
- UI: Shared via `@midday/ui`
- API Client: tRPC
- State: TanStack Query

### Pivot Core (`packages/pivot-core`)

```
packages/pivot-core/
├── src/
│   ├── index.ts           # Main exports
│   ├── types/
│   │   └── index.ts       # TypeScript types & Zod schemas
│   └── utils/
│       └── index.ts       # Utility functions
├── package.json
└── README.md
```

## CI/CD & Deployment

### Deploying Pivot Separately

Pivot apps can be deployed independently from Midday:

```bash
# Deploy Pivot API only
turbo build --filter=@midday/pivot-api

# Deploy Pivot Dashboard only
turbo build --filter=@midday/pivot-dashboard
```

### Docker (Future)

Each app can have its own Dockerfile:
- `apps/pivot-api/Dockerfile`
- `apps/pivot-dashboard/Dockerfile`

### Vercel (Future)

Deploy with project filtering:
- Pivot API: Filter on `apps/pivot-api`
- Pivot Dashboard: Filter on `apps/pivot-dashboard`

## Benefits of This Architecture

### ✅ Pros

1. **Code Reuse**: Share database schemas, utilities, and UI components
2. **Consistency**: Same tooling, linting, and TypeScript configs
3. **Atomic Changes**: Update shared packages and both projects benefit
4. **Simplified Development**: Single `bun install` for everything
5. **Type Safety**: Full TypeScript support across projects
6. **Independent Deployment**: Deploy Pivot without touching Midday

### ⚠️ Considerations

1. **Larger Repository**: More code in one place
2. **Build Times**: Building everything takes longer (use filters)
3. **Access Control**: Everyone with repo access can see both projects

## Next Steps

1. **Implement Pivot Business Logic**: Add features to `@midday/pivot-core`
2. **Build API Endpoints**: Create tRPC routers in `apps/pivot-api`
3. **Create UI**: Build pages and components in `apps/pivot-dashboard`
4. **Setup Database**: Add Pivot-specific tables using `@midday/db` migrations
5. **Configure CI/CD**: Set up deployment pipelines with Turbo filters

## FAQ

**Q: Can Pivot and Midday share the same database?**
A: Yes, they use `@midday/db` which connects to the same database. Use table prefixes or schemas to separate data.

**Q: Can I publish Pivot as a separate npm package?**
A: Not recommended while in the monorepo. Keep it as a workspace package.

**Q: How do I keep Pivot changes from affecting Midday?**
A: Keep Pivot-specific code in `@midday/pivot-core` and pivot apps. Only modify shared packages if both projects need the change.

**Q: Can I move Pivot to a separate repo later?**
A: Yes, but you'll need to either:
- Publish shared packages to npm, or
- Duplicate shared code into the new repo

**Q: Should Pivot have its own API or use Midday's API?**
A: Separate API (current setup) is recommended for:
- Independent scaling
- Different access patterns
- Clear separation of concerns

## Support

For questions or issues:
1. Check individual app READMEs:
   - `apps/pivot-api/README.md`
   - `apps/pivot-dashboard/README.md`
   - `packages/pivot-core/README.md`
2. Review shared package docs in `packages/README.md`
3. Consult the Midday team for shared package changes

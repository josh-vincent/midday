# @midday/api-core

Shared tRPC routers and API logic used across api and pivot-api applications.

## Installation

```bash
pnpm add @midday/api-core
```

## Usage

### In Your API Application

```typescript
// apps/api/src/trpc/routers/_app.ts
import { billingRouter } from '@midday/api-core/routers/billing';
import { customersRouter } from '@midday/api-core/routers/customers';
import { invoiceRouter } from '@midday/api-core/routers/invoice';
import { jobRouter } from '@midday/api-core/routers/job';
import { teamRouter } from '@midday/api-core/routers/team';
import { userRouter } from '@midday/api-core/routers/user';

export const appRouter = router({
  // Shared routers
  billing: billingRouter,
  customers: customersRouter,
  invoice: invoiceRouter,
  job: jobRouter,
  team: teamRouter,
  user: userRouter,

  // App-specific routers
  // ... your custom routers
});
```

### Using Shared Middleware

```typescript
import { authMiddleware, teamMiddleware } from '@midday/api-core/middleware';

const protectedRouter = t.procedure
  .use(authMiddleware)
  .use(teamMiddleware);
```

## Available Routers (23 to be migrated)

### Core Business Logic
- `billingRouter` - Subscription and payment management
- `customersRouter` - Customer CRUD operations
- `invoiceRouter` - Invoice generation and management
- `jobRouter` - Job tracking and management
- `teamRouter` - Team management and permissions
- `userRouter` - User profile and settings

### Additional Routers
- `apiKeysRouter` - API key management
- `invoiceProductsRouter` - Invoice product catalog
- `invoiceTemplateRouter` - Invoice template management
- `pricingRouter` - Pricing calculations
- `reportsRouter` - Report generation
- `shortLinksRouter` - URL shortening service
- `tagsRouter` - Tag management

## Router Structure

```
src/
├── routers/
│   ├── billing.ts
│   ├── customers.ts
│   ├── invoice.ts
│   ├── job.ts
│   ├── team.ts
│   └── user.ts
├── middleware/
│   ├── auth.ts
│   ├── team.ts
│   └── rate-limit.ts
└── index.ts
```

## Testing

Each router includes comprehensive tests:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Test specific router
pnpm test customers
```

## Migration Status

- [ ] Phase 1: Core routers (0/6)
  - [ ] billing.ts
  - [ ] customers.ts
  - [ ] invoice.ts
  - [ ] job.ts
  - [ ] team.ts
  - [ ] user.ts
- [ ] Phase 2: Support routers (0/17)
  - [ ] api-keys.ts
  - [ ] invoice-products.ts
  - [ ] Additional routers...

Total: 0/23 routers migrated

## Dependencies

- `@midday/api-schemas` - Shared validation schemas
- `@midday/db` - Database client and queries
- `@midday/supabase` - Supabase client
- `@trpc/server` - tRPC server
- `superjson` - Data serialization
- `zod` - Schema validation
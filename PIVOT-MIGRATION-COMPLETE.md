# Pivot Migration Complete

The Pivot project has been successfully created as a complete copy of the Midday application within the same monorepo.

## What Was Done

### 1. Copied Entire Codebase

**Pivot API** (`apps/pivot-api`)
- Complete copy of `apps/api`
- All tRPC routers, REST endpoints, and business logic
- Database migrations and schemas
- Test files and configuration

**Pivot Dashboard** (`apps/pivot-dashboard`)
- Complete copy of `apps/dashboard`
- All React components, pages, and layouts
- Complete UI including forms, tables, charts
- All hooks, utilities, and styles

### 2. Updated Configuration

**Pivot API**
- Package name: `@midday/pivot-api`
- Port: `3335` (changed from 3334)
- Added dependency: `@midday/pivot-core`

**Pivot Dashboard**
- Package name: `@midday/pivot-dashboard`
- Port: `3336` (changed from 3333)
- Updated tRPC client to use `@midday/pivot-api`
- Added dependencies: `@midday/pivot-api`, `@midday/pivot-core`

**Root Configuration**
- Added npm scripts:
  - `dev:pivot-api` - Run Pivot API
  - `dev:pivot-dashboard` - Run Pivot Dashboard
  - `dev:pivot` - Run both in parallel
  - `build:pivot-api`, `build:pivot-dashboard`, `build:pivot`

### 3. Directory Structure

```
midday/
├── apps/
│   ├── api/                    # Midday API (port 3334)
│   ├── dashboard/              # Midday Dashboard (port 3333)
│   ├── mobile/                 # Midday Mobile
│   ├── templates/              # Midday Templates
│   ├── pivot-api/              # 🆕 Pivot API (port 3335)
│   └── pivot-dashboard/        # 🆕 Pivot Dashboard (port 3336)
└── packages/
    ├── db/                     # ✅ Shared
    ├── invoice/                # ✅ Shared
    ├── ui/                     # ✅ Shared
    ├── pivot-core/             # 🆕 Pivot-specific
    └── ...                     # All other shared packages
```

## Starting the Apps

### Pivot Only

```bash
# Both apps
bun run dev:pivot

# Individual apps
bun run dev:pivot-api        # http://localhost:3335
bun run dev:pivot-dashboard  # http://localhost:3336
```

### All Apps (Midday + Pivot)

```bash
bun run dev
```

This will start:
- Midday API: http://localhost:3334
- Midday Dashboard: http://localhost:3333
- Pivot API: http://localhost:3335
- Pivot Dashboard: http://localhost:3336

## Environment Variables

### Pivot API (`.env.local`)

Copy from `apps/api/.env.local` and adjust if needed:

```bash
# Database
DATABASE_URL=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_API_KEY=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Other services
RESEND_API_KEY=
API_ROUTE_SECRET=
MIDDAY_ENCRYPTION_KEY=
```

### Pivot Dashboard (`.env.local`)

Copy from `apps/dashboard/.env.local` and update the API URL:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# API
NEXT_PUBLIC_API_URL=http://localhost:3335

# Other environment variables from dashboard
```

## What's Included

Both Pivot apps now have **complete feature parity** with Midday:

### Features
- ✅ Authentication & Authorization
- ✅ Team management
- ✅ Customer management (CRUD)
- ✅ Job management
- ✅ Invoice generation with templates
- ✅ Document vault
- ✅ Transaction tracking
- ✅ Reports & analytics
- ✅ Search functionality
- ✅ Settings & configuration
- ✅ Email integrations
- ✅ Bank connections
- ✅ Real-time updates
- ✅ Notification system
- ✅ API key management
- ✅ Billing & subscriptions

### Technical Stack
- **API**: Hono + tRPC + Bun
- **Dashboard**: Next.js 15 + React 19
- **Database**: Shared via `@midday/db` (Drizzle ORM)
- **UI**: Shared via `@midday/ui` (shadcn/ui)
- **Auth**: Supabase
- **Styling**: Tailwind CSS
- **State**: TanStack Query + Zustand

## Next Steps

Now that you have a complete copy, you can:

1. **Customize for Pivot**:
   - Add Pivot-specific features in `packages/pivot-core`
   - Modify UI components as needed
   - Add new routes and endpoints

2. **Database Separation** (Optional):
   - Create Pivot-specific tables
   - Use table prefixes (e.g., `pivot_*`)
   - Or use a separate database with same schema

3. **Rename/Rebrand**:
   - Update UI copy and branding
   - Change logo and assets
   - Customize email templates

4. **Deploy Separately**:
   - Set up separate Vercel projects
   - Configure separate environment variables
   - Deploy with Turbo filters

## Shared vs Separate Code

**Shared Packages** (Both use):
- `@midday/db` - Database layer
- `@midday/supabase` - Supabase client
- `@midday/ui` - UI components
- `@midday/invoice` - Invoice logic
- `@midday/invoice-components` - Invoice UI
- `@midday/charts` - Chart components
- `@midday/utils` - Utilities
- `@midday/cache` - Caching
- `@midday/events` - Events
- All other shared packages

**Pivot-Specific**:
- `@midday/pivot-core` - Pivot business logic
- `@midday/pivot-api` - Pivot API server
- `@midday/pivot-dashboard` - Pivot frontend

**Midday-Specific**:
- `@midday/api` - Midday API server
- `@midday/dashboard` - Midday frontend

## Important Notes

1. **Same Codebase**: Both Pivot and Midday currently share the exact same code. You'll need to differentiate them as you develop.

2. **Database**: Both apps can use the same database (with separate teams) or you can configure Pivot to use a different database.

3. **TypeScript**: Some packages have existing TypeScript errors (from the original Midday codebase). These don't prevent the apps from running.

4. **Development**: When running `bun run dev`, all apps start simultaneously. Use filters to run specific apps.

5. **Updates to Shared Packages**: Changes to shared packages affect both Midday and Pivot.

## Troubleshooting

### Port Already in Use

If ports 3335 or 3336 are in use:
1. Stop other processes
2. Or update the ports in `package.json`

### Environment Variables Missing

Make sure both `.env.local` files are created:
- `apps/pivot-api/.env.local`
- `apps/pivot-dashboard/.env.local`

### Build Errors

Run `bun install` in the root directory if you encounter missing dependencies.

## Documentation

- **Pivot Setup Guide**: See `PIVOT-SETUP.md`
- **Midday API**: See `apps/api/README.md`
- **Midday Dashboard**: See `apps/dashboard/README.md`

## Success! 🎉

Pivot is now a fully functional copy of Midday, ready for customization and development. The apps are independent and can be deployed separately while sharing common infrastructure.

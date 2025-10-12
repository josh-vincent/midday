# Mock Mode for Development

This API supports a mock mode that generates fake data conforming to your Zod schemas for development and testing purposes.

## Enabling Mock Mode

Set the `MOCK_MODE` environment variable to `true`:

```bash
# In your .env file (apps/api/.env)
MOCK_MODE=true

# Or when starting the API
cd apps/api
MOCK_MODE=true npm run dev
MOCK_MODE=true PORT=3334 bun run --hot src/index.ts
```

## Authentication & Team Permission Bypass

**Important:** Mock mode automatically bypasses authentication and team permission checks. Here's how:

### How It Works:

1. **Mock Middleware Intercepts First**
   - The mock middleware runs BEFORE team permission and auth checks
   - It intercepts tRPC queries and returns mock data immediately
   - Real authentication is never required for mocked endpoints

2. **Automatic Mock Session**
   - If no session exists, mock mode creates one automatically:
     ```typescript
     {
       user: { id: "mock-user-id", email: "mock@example.com" },
       expires_at: Date.now() + 3600000,
       aud: "authenticated",
       sub: "mock-user-id",
       email: "mock@example.com",
       role: "authenticated"
     }
     ```

3. **Automatic Mock Team**
   - Team permission middleware detects mock mode
   - Sets `teamId: "mock-team-id"` automatically
   - Bypasses all team membership checks

4. **Console Logs Confirm Bypass**
   ```
   [Team Permission] Mock mode active - bypassing permission checks
   [MOCK MODE] Active for job.list
   [MOCK MODE] Intercepting query call to job.list
   ```

### What This Means:

✅ **No login required** - Frontend can make API calls without authentication
✅ **No team setup needed** - All queries use mock team ID
✅ **No database required** - All data comes from mock generators
✅ **Perfect for development** - Develop UI without backend dependencies

### Implementation Details:

The bypass happens in two places:

**1. Team Permission Middleware** (`apps/api/src/trpc/middleware/team-permission.ts`):
```typescript
if (isMockMode() && !userId) {
  console.log("[Team Permission] Mock mode active - bypassing permission checks");
  return next({
    ctx: {
      session: ctx.session,
      teamId: "mock-team-id",
      db: ctx.db,
    },
  });
}
```

**2. Protected Procedure** (`apps/api/src/trpc/init.ts`):
```typescript
if (isMockMode() && !session) {
  return opts.next({
    ctx: {
      teamId: teamId || "mock-team-id",
      session: {
        user: { id: "mock-user-id", email: "mock@example.com" },
        // ... mock session data
      },
    },
  });
}
```

This design allows you to:
- Test the dashboard UI without authentication
- Develop features without database setup
- Demo the application with realistic data
- Onboard new developers quickly

## What Gets Mocked

When mock mode is enabled, the following tRPC endpoints will return generated mock data instead of querying the database:

### Jobs Endpoints
- `job.list` - Returns 25 mock jobs with various statuses, companies, and invoice links
- `job.get` - Same as list with search/filter support
- `job.unlinkedByCompany` - Returns jobs without customer links

**Mock Job Data Includes:**
- Job numbers (JOB-2024-0001, etc.)
- Random statuses: pending, in_progress, completed, cancelled, delivered, invoiced
- Random companies: Acme Corp, TechStart Inc, BuildCo, etc.
- Random contact persons and phone numbers
- Vehicle registration numbers (regos)
- Pricing data (price per unit, total amounts in cents)
- Volume and weight measurements
- Invoice links (some jobs have invoices, some don't)
- Invoice statuses: draft, unpaid, paid, canceled, overdue

### Invoice Endpoints
- `invoice.list` - Returns 20 mock invoices
- `invoice.get` - Same as list with search/filter support

**Mock Invoice Data Includes:**
- Invoice numbers (INV-2024-0001, etc.)
- Statuses: draft, unpaid, paid, canceled, overdue
- Customer details with names, emails, websites
- Amounts in dollars (converted from cents)
- VAT, tax, and discount calculations
- Payment dates, sent dates, viewed dates
- Line items and notes

### Customer Endpoints
- `customers.get` - Returns 10 mock customers

**Mock Customer Data Includes:**
- Company names matching those in jobs
- Email addresses, phone numbers
- Websites and physical addresses
- Customer tokens

## Features

### Search and Filtering
Mock endpoints support the same filters as real endpoints:
- Search by query string (`q` parameter)
- Filter by customer ID
- Filter by status
- Pagination with page/pageSize

### Realistic Data
Mock data is designed to be realistic:
- Some jobs have invoices, some don't
- Some jobs have customer links, some don't
- Random dates within the last 90 days
- Realistic amounts between $100 and $1000
- Mixed statuses to test UI states

### Consistent IDs
Mock data uses consistent IDs so relationships work:
- `mock-job-1`, `mock-job-2`, etc.
- `mock-invoice-1`, `mock-invoice-2`, etc.
- `mock-customer-1` through `mock-customer-5`

## Development Workflow

1. **Start API in mock mode:**
   ```bash
   cd apps/api
   MOCK_MODE=true PORT=3334 bun run --hot src/index.ts
   ```

2. **Start dashboard (normal mode):**
   ```bash
   cd apps/dashboard
   npm run dev
   ```

3. **View mock data in your tables:**
   - Jobs table will show 25 mock jobs
   - Invoices table will show 20 mock invoices
   - All data conforms to your Zod schemas

4. **Test UI features:**
   - Search and filtering
   - Status indicators and colored dots
   - Invoice linking
   - Customer management
   - Pagination

## Disabling Mock Mode

Simply remove the environment variable or set it to `false`:

```bash
# Remove from .env
# MOCK_MODE=true

# Or set to false
MOCK_MODE=false npm run dev
```

## Production Safety

Mock mode is automatically disabled in production (`NODE_ENV=production`) even if `MOCK_MODE=true` is set. This prevents accidental use of mock data in production environments.

## Logging

When mock mode is active, you'll see console logs indicating which endpoints are being mocked:

```
[MOCK MODE] Active for job.list
[MOCK MODE] Intercepting query call to job.list
```

## Extending Mock Data

To add more mock data generators or modify existing ones, edit:
- `apps/api/src/trpc/middleware/mock-data.ts`

The file contains:
- `generateMockJobs()` - Job data generator
- `generateMockInvoices()` - Invoice data generator
- `generateMockCustomers()` - Customer data generator
- `withMockData()` - Middleware that intercepts tRPC calls

## Testing

Mock mode is perfect for:
- UI development without database setup
- Testing table components with realistic data
- Testing search and filter functionality
- Testing pagination
- Demo environments
- Onboarding new developers

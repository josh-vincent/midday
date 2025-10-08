# Test Execution Instructions

## Prerequisites

The tests require a PostgreSQL database to be running. You have several options:

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL if not already installed
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create a test database
createdb midday_test

# Set the DATABASE_URL
export DATABASE_URL="postgresql://localhost:5432/midday_test"
```

### Option 2: Docker PostgreSQL
```bash
# Start PostgreSQL in Docker
docker run -d \
  --name midday-test-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=midday_test \
  -p 5432:5432 \
  postgres:16

# Set the DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/midday_test"
```

### Option 3: Supabase Local
```bash
# If you have Supabase CLI installed
supabase start

# The DATABASE_URL will be automatically set to the local Supabase instance
export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

## Running Database Migrations

Before running tests, ensure the database schema is up to date:

```bash
# From the midday/packages/db directory
cd ../../packages/db

# Run migrations
bun db:migrate

# Return to API directory
cd ../../apps/api
```

## Running the Tests

Once the database is running and migrations are complete:

```bash
# Option 1: Run all tests with environment setup
bun run-tests.ts

# Option 2: Run specific test file
DATABASE_URL="your-connection-string" bun test src/trpc/routers/invoice.test.ts

# Option 3: Run all tests with watch mode
DATABASE_URL="your-connection-string" bun test --watch
```

## Test Results

When the database is properly configured, you should see:
- ✅ All authentication and authorization tests passing
- ✅ CRUD operations working correctly
- ✅ Data validation tests passing
- ✅ Pagination and filtering tests working
- ✅ Error handling tests catching expected errors

## Troubleshooting

### Connection Refused Error
If you see `ECONNREFUSED` errors, it means the database is not accessible. Check:
1. PostgreSQL is running (`pg_isready -h localhost -p 5432`)
2. DATABASE_URL is correctly set
3. Database exists and is accessible

### Missing Tables Error
If you see errors about missing tables, run the migrations:
```bash
cd ../../packages/db && bun db:migrate
```

### Environment Variables
The test runner automatically sets mock values for required services:
- RESEND_API_KEY (for email service)
- SUPABASE_URL, SUPABASE_ANON_KEY (for auth)
- Other service keys

These are mock values for testing only and don't need to be real.

## Summary

The comprehensive test suite covers:
- **Invoice Router**: 20+ endpoints including CRUD, metrics, scheduling
- **Customers Router**: Full CRUD with search and pagination
- **Invoice Template Router**: Template management
- **Team Router**: 14 endpoints for team management
- **User Router**: Profile management

Total test coverage: **40+ API endpoints** with authorization, validation, and error handling tests.
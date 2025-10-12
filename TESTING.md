# Testing Setup (Cal.com-Style)

This project follows **Cal.com's testing philosophy**: integration testing over mocking, using real database queries with test data.

## Philosophy

- **Integration tests** over unit tests with mocks
- **Real database** queries with test data
- **tRPC createCallerFactory** for testing endpoints
- **Vitest** for test execution
- **No middleware mocking** - test the actual implementation

## Quick Start

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with UI
bun test:ui
```

## Writing Tests

### Testing tRPC Endpoints

Use `createTestCaller` to test tRPC endpoints with real database queries:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestCaller } from '../__tests__/test-utils';

describe('job router', () => {
  let caller: Awaited<ReturnType<typeof createTestCaller>>;

  beforeAll(async () => {
    caller = await createTestCaller({
      teamId: 'test-team-id',
    });
  });

  it('should list jobs', async () => {
    const result = await caller.job.list();
    
    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
  });
});
```

### Test Utilities

Located in `apps/api/src/trpc/__tests__/test-utils.ts`:

- `createTestCaller(options)` - Create authenticated tRPC caller
- `createPublicCaller(options)` - Create unauthenticated tRPC caller

### Test Database

Tests use your regular database by default. To use a separate test database:

```bash
# Set in your .env.test file
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/midday_test
```

## File Structure

```
├── vitest.config.ts              # Vitest configuration
├── vitest.setup.ts               # Global test setup
├── apps/api/src/trpc/
│   ├── __tests__/
│   │   └── test-utils.ts         # tRPC test helpers
│   └── routers/
│       ├── job.ts                # Router implementation
│       └── job.test.ts           # Router tests
```

## Key Differences from Mock Mode

| Aspect | Mock Mode (Old) | Testing (New) |
|--------|----------------|---------------|
| **Purpose** | Development without DB | Automated testing |
| **Data** | Fake generated data | Real DB queries |
| **When** | `MOCK_MODE=true` dev server | `bun test` command |
| **Auth** | Bypassed automatically | Mocked in tests |
| **Coverage** | All endpoints | Individual tests |

## Benefits

✅ **Real implementation testing** - Tests use actual database queries  
✅ **Type-safe** - Full tRPC type inference in tests  
✅ **Fast feedback** - Vitest watch mode for TDD  
✅ **Integration testing** - Test entire request flow  
✅ **No mock maintenance** - No need to keep mocks in sync  

## Running Specific Tests

```bash
# Run tests for specific file
bun test job.test

# Run tests matching pattern
bun test invoice

# Run with coverage
bun test --coverage
```

## CI/CD

Tests run automatically in CI. Ensure `DATABASE_URL` or `TEST_DATABASE_URL` is set in your CI environment.

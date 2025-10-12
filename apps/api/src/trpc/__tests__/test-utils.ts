import { createCallerFactory } from '@api/trpc/init';
import { appRouter } from '@api/trpc/routers/_app';
import { connectDb } from '@midday/db/client';
import type { Database } from '@midday/db/client';
import type { Session } from '@api/utils/auth';
import { createTestFixtures, TEST_USER_ID, TEST_TEAM_ID } from './fixtures';

/**
 * Create a test tRPC caller with mock context
 * Following Cal.com's pattern of using createCallerFactory for testing
 */
export async function createTestCaller(options: {
  session?: Session | null;
  teamId?: string;
  db?: Database;
  skipFixtures?: boolean;
} = {}) {
  const db = options.db || await connectDb(process.env.DATABASE_URL);

  // Create test fixtures in the database unless explicitly skipped
  if (!options.skipFixtures) {
    await createTestFixtures(db);
  }

  const mockSession: Session | null = options.session || {
    user: { id: TEST_USER_ID, email: 'test@example.com' },
    expires_at: Date.now() + 3600000,
    aud: 'authenticated',
    sub: TEST_USER_ID,
    email: 'test@example.com',
    role: 'authenticated',
  };

  const mockContext = {
    session: mockSession,
    db,
    teamId: options.teamId || TEST_TEAM_ID,
    supabase: {} as any, // Mock Supabase client
    geo: {
      country: 'US',
      city: 'San Francisco',
      region: 'CA',
    },
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    invoiceJwtSecret: process.env.INVOICE_JWT_SECRET,
  };

  const createCaller = createCallerFactory(appRouter);
  return createCaller(mockContext);
}

/**
 * Create a caller without authentication (for public procedures)
 */
export async function createPublicCaller(options: { db?: Database } = {}) {
  return createTestCaller({
    session: null,
    teamId: undefined,
    db: options.db,
  });
}

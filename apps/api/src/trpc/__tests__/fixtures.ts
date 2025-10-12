import type { Database } from '@midday/db/client';
import { users, teams } from '@midday/db/schema';

/**
 * Test fixtures for database seeding
 * Following Cal.com's pattern of real database data for integration testing
 */

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_TEAM_ID = '00000000-0000-0000-0000-000000000002';

export interface TestFixtures {
  userId: string;
  teamId: string;
  email: string;
}

/**
 * Create test user and team in the database
 * Returns created IDs for use in tests
 */
export async function createTestFixtures(db: Database): Promise<TestFixtures> {
  // Create test team
  const [team] = await db
    .insert(teams)
    .values({
      id: TEST_TEAM_ID,
      name: 'Test Team',
      email: 'test@example.com',
    })
    .onConflictDoNothing()
    .returning();

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      id: TEST_USER_ID,
      email: 'test@example.com',
      teamId: TEST_TEAM_ID,
    })
    .onConflictDoNothing()
    .returning();

  return {
    userId: user?.id || TEST_USER_ID,
    teamId: team?.id || TEST_TEAM_ID,
    email: 'test@example.com',
  };
}

/**
 * Clean up test fixtures after tests
 */
export async function cleanupTestFixtures(db: Database) {
  // Note: In a real setup, you might want to:
  // 1. Use transactions and rollback
  // 2. Use a separate test database
  // 3. Clean up related records (jobs, invoices, etc.)

  // For now, we rely on onConflictDoNothing to make tests idempotent
}

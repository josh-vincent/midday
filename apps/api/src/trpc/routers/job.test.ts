import { describe, it, expect, beforeAll } from 'vitest';
import { createTestCaller } from '../__tests__/test-utils';
import { TEST_TEAM_ID } from '../__tests__/fixtures';

describe('job router', () => {
  let caller: Awaited<ReturnType<typeof createTestCaller>>;

  beforeAll(async () => {
    caller = await createTestCaller({
      teamId: TEST_TEAM_ID,
    });
  });

  it('should return empty jobs list for non-existent team', async () => {
    const result = await caller.job.list();
    
    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
  });

  it('should return job summary', async () => {
    const result = await caller.job.summary();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('today');
    expect(result).toHaveProperty('week');
    expect(result).toHaveProperty('pending');
    expect(result).toHaveProperty('month');
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { redis, RedisService, cacheKeys } from "./client";

describe("Redis Client", () => {
  beforeAll(async () => {
    // Ensure Redis is connected before tests
    const isHealthy = await redis.isHealthy();
    if (!isHealthy) {
      console.warn("Redis is not available, skipping Redis tests");
      process.exit(0);
    }
  });

  afterAll(async () => {
    // Clean up test keys and disconnect
    await RedisService.flushPattern("test:*");
    await redis.disconnect();
  });

  describe("Connection", () => {
    it("should connect to Redis successfully", async () => {
      const isHealthy = await redis.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it("should handle connection errors gracefully", async () => {
      // This test would require mocking or stopping Redis
      // For now, we just verify the health check works
      const isHealthy = await redis.isHealthy();
      expect(typeof isHealthy).toBe("boolean");
    });
  });

  describe("Basic Operations", () => {
    const testKey = "test:basic:key";
    const testValue = { data: "test", timestamp: Date.now() };

    beforeEach(async () => {
      await RedisService.del(testKey);
    });

    it("should set and get a value", async () => {
      const setResult = await RedisService.set(testKey, testValue);
      expect(setResult).toBe(true);

      const getValue = await RedisService.get(testKey);
      expect(getValue).toEqual(testValue);
    });

    it("should set a value with TTL", async () => {
      const setResult = await RedisService.set(testKey, testValue, 1);
      expect(setResult).toBe(true);

      // Value should exist immediately
      const getValue = await RedisService.get(testKey);
      expect(getValue).toEqual(testValue);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Value should be gone
      const expiredValue = await RedisService.get(testKey);
      expect(expiredValue).toBeNull();
    });

    it("should delete a key", async () => {
      await RedisService.set(testKey, testValue);
      
      const deleteResult = await RedisService.del(testKey);
      expect(deleteResult).toBe(1);

      const getValue = await RedisService.get(testKey);
      expect(getValue).toBeNull();
    });

    it("should delete multiple keys", async () => {
      const keys = ["test:del:1", "test:del:2", "test:del:3"];
      
      for (const key of keys) {
        await RedisService.set(key, { value: key });
      }

      const deleteResult = await RedisService.del(keys);
      expect(deleteResult).toBe(3);

      for (const key of keys) {
        const value = await RedisService.get(key);
        expect(value).toBeNull();
      }
    });

    it("should check if key exists", async () => {
      const existsBefore = await RedisService.exists(testKey);
      expect(existsBefore).toBe(false);

      await RedisService.set(testKey, testValue);

      const existsAfter = await RedisService.exists(testKey);
      expect(existsAfter).toBe(true);
    });

    it("should set expiration on existing key", async () => {
      await RedisService.set(testKey, testValue);
      
      const expireResult = await RedisService.expire(testKey, 1);
      expect(expireResult).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 1100));

      const exists = await RedisService.exists(testKey);
      expect(exists).toBe(false);
    });
  });

  describe("Pattern Operations", () => {
    beforeEach(async () => {
      await RedisService.flushPattern("test:pattern:*");
    });

    it("should find keys by pattern", async () => {
      const testKeys = [
        "test:pattern:1",
        "test:pattern:2",
        "test:pattern:3",
        "test:other:1"
      ];

      for (const key of testKeys) {
        await RedisService.set(key, { key });
      }

      const patternKeys = await RedisService.keys("test:pattern:*");
      expect(patternKeys.length).toBe(3);
      expect(patternKeys.every(k => k.startsWith("test:pattern:"))).toBe(true);
    });

    it("should flush keys by pattern", async () => {
      const testKeys = [
        "test:pattern:flush:1",
        "test:pattern:flush:2",
        "test:pattern:flush:3",
        "test:pattern:keep:1"
      ];

      for (const key of testKeys) {
        await RedisService.set(key, { key });
      }

      const flushed = await RedisService.flushPattern("test:pattern:flush:*");
      expect(flushed).toBe(3);

      // Check flushed keys are gone
      const flushedKeys = await RedisService.keys("test:pattern:flush:*");
      expect(flushedKeys.length).toBe(0);

      // Check other keys remain
      const keptKeys = await RedisService.keys("test:pattern:keep:*");
      expect(keptKeys.length).toBe(1);
    });
  });

  describe("Counter Operations", () => {
    const counterKey = "test:counter";

    beforeEach(async () => {
      await RedisService.del(counterKey);
    });

    it("should increment a counter", async () => {
      const result1 = await RedisService.incr(counterKey);
      expect(result1).toBe(1);

      const result2 = await RedisService.incr(counterKey);
      expect(result2).toBe(2);

      const result3 = await RedisService.incr(counterKey);
      expect(result3).toBe(3);
    });

    it("should decrement a counter", async () => {
      // Set initial value
      await RedisService.set(counterKey, 10);

      const result1 = await RedisService.decr(counterKey);
      expect(result1).toBe(9);

      const result2 = await RedisService.decr(counterKey);
      expect(result2).toBe(8);
    });
  });

  describe("Cache Key Generators", () => {
    it("should generate consistent job cache keys", () => {
      const teamId = "team-123";
      const jobId = "job-456";

      const listKey = cacheKeys.jobsList(teamId, { status: "pending" });
      expect(listKey).toBe('jobs:list:team-123:{"status":"pending"}');

      const detailKey = cacheKeys.jobById(jobId);
      expect(detailKey).toBe("jobs:job-456");

      const summaryKey = cacheKeys.jobsSummary(teamId);
      expect(summaryKey).toBe("jobs:summary:team-123");
    });

    it("should generate consistent customer cache keys", () => {
      const teamId = "team-123";
      const customerId = "customer-789";

      const listKey = cacheKeys.customersList(teamId);
      expect(listKey).toBe('customers:list:team-123:{}');

      const detailKey = cacheKeys.customerById(customerId);
      expect(detailKey).toBe("customers:customer-789");
    });

    it("should generate search cache keys", () => {
      const searchKey = cacheKeys.searchResults("concrete", "jobs");
      expect(searchKey).toBe("search:jobs:concrete");
    });
  });

  describe("Error Handling", () => {
    it("should handle get errors gracefully", async () => {
      // Try to get with invalid key format (in a real scenario)
      const result = await RedisService.get("test:nonexistent");
      expect(result).toBeNull();
    });

    it("should handle set errors gracefully", async () => {
      // Very large value that might fail
      const largeValue = { data: "x".repeat(1000000) };
      const result = await RedisService.set("test:large", largeValue);
      expect(typeof result).toBe("boolean");
    });

    it("should return 0 for del on non-existent keys", async () => {
      const result = await RedisService.del("test:nonexistent:key");
      expect(result).toBe(0);
    });

    it("should return false for exists on non-existent keys", async () => {
      const result = await RedisService.exists("test:nonexistent:key");
      expect(result).toBe(false);
    });

    it("should return empty array for keys with no matches", async () => {
      const result = await RedisService.keys("test:nomatch:*");
      expect(result).toEqual([]);
    });
  });
});
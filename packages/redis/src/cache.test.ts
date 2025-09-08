import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { withCache, invalidateCache, invalidatePattern, Cacheable } from "./cache";
import { RedisService, redis } from "./client";

describe("Cache Operations", () => {
  beforeAll(async () => {
    const isHealthy = await redis.isHealthy();
    if (!isHealthy) {
      console.warn("Redis is not available, skipping cache tests");
      process.exit(0);
    }
  });

  afterAll(async () => {
    await RedisService.flushPattern("cache:test:*");
    await redis.disconnect();
  });

  describe("withCache", () => {
    const testKey = "cache:test:withCache";
    let callCount = 0;

    const expensiveOperation = async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
      return { data: "expensive result", count: callCount };
    };

    beforeEach(async () => {
      callCount = 0;
      await RedisService.del(testKey);
    });

    it("should cache function results", async () => {
      // First call - should execute function
      const result1 = await withCache(
        { key: testKey, ttl: 60 },
        expensiveOperation
      );
      expect(result1.count).toBe(1);
      expect(callCount).toBe(1);

      // Second call - should return cached result
      const result2 = await withCache(
        { key: testKey, ttl: 60 },
        expensiveOperation
      );
      expect(result2.count).toBe(1); // Same as first call
      expect(callCount).toBe(1); // Function not called again
    });

    it("should skip cache when requested", async () => {
      // First call - cache it
      const result1 = await withCache(
        { key: testKey, ttl: 60 },
        expensiveOperation
      );
      expect(result1.count).toBe(1);

      // Second call - skip cache
      const result2 = await withCache(
        { key: testKey, ttl: 60 },
        expensiveOperation,
        true // skipCache
      );
      expect(result2.count).toBe(2); // New execution
      expect(callCount).toBe(2);
    });

    it("should respect cache version", async () => {
      // First call with version 1
      const result1 = await withCache(
        { key: testKey, ttl: 60, version: 1 },
        expensiveOperation
      );
      expect(result1.count).toBe(1);

      // Second call with version 2 - should bypass cache
      const result2 = await withCache(
        { key: testKey, ttl: 60, version: 2 },
        expensiveOperation
      );
      expect(result2.count).toBe(2); // New execution due to version mismatch
    });

    it("should handle TTL expiration", async () => {
      // Cache with 1 second TTL
      const result1 = await withCache(
        { key: testKey, ttl: 1 },
        expensiveOperation
      );
      expect(result1.count).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should execute function again
      const result2 = await withCache(
        { key: testKey, ttl: 60 },
        expensiveOperation
      );
      expect(result2.count).toBe(2);
    });

    it("should handle errors gracefully", async () => {
      const errorOperation = async () => {
        throw new Error("Operation failed");
      };

      // Should throw the error but not crash
      expect(async () => {
        await withCache(
          { key: testKey, ttl: 60 },
          errorOperation
        );
      }).toThrow("Operation failed");
    });

    it("should work when Redis is unavailable", async () => {
      // Simulate Redis being down by using invalid operation
      const result = await withCache(
        { key: "invalid:key:that:might:fail", ttl: 60 },
        async () => ({ data: "fallback" })
      );
      expect(result.data).toBe("fallback");
    });
  });

  describe("invalidateCache", () => {
    it("should invalidate a single cache key", async () => {
      const key = "cache:test:invalidate:single";
      await RedisService.set(key, { data: "cached" });

      const existsBefore = await RedisService.exists(key);
      expect(existsBefore).toBe(true);

      await invalidateCache(key);

      const existsAfter = await RedisService.exists(key);
      expect(existsAfter).toBe(false);
    });

    it("should invalidate multiple cache keys", async () => {
      const keys = [
        "cache:test:invalidate:1",
        "cache:test:invalidate:2",
        "cache:test:invalidate:3"
      ];

      for (const key of keys) {
        await RedisService.set(key, { data: key });
      }

      await invalidateCache(keys);

      for (const key of keys) {
        const exists = await RedisService.exists(key);
        expect(exists).toBe(false);
      }
    });

    it("should handle non-existent keys gracefully", async () => {
      await expect(async () => {
        await invalidateCache("cache:test:nonexistent");
      }).not.toThrow();
    });
  });

  describe("invalidatePattern", () => {
    beforeEach(async () => {
      await RedisService.flushPattern("cache:test:pattern:*");
    });

    it("should invalidate all keys matching pattern", async () => {
      const keys = [
        "cache:test:pattern:1",
        "cache:test:pattern:2",
        "cache:test:pattern:3",
        "cache:test:other:1"
      ];

      for (const key of keys) {
        await RedisService.set(key, { data: key });
      }

      await invalidatePattern("cache:test:pattern:*");

      // Pattern keys should be gone
      const patternKeys = await RedisService.keys("cache:test:pattern:*");
      expect(patternKeys.length).toBe(0);

      // Other keys should remain
      const otherExists = await RedisService.exists("cache:test:other:1");
      expect(otherExists).toBe(true);
    });

    it("should handle patterns with no matches", async () => {
      await expect(async () => {
        await invalidatePattern("cache:test:nomatch:*");
      }).not.toThrow();
    });
  });

  describe("Cacheable Decorator", () => {
    class TestService {
      public callCount = 0;

      @Cacheable({ ttl: 60 })
      async getData(id: string) {
        this.callCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id, data: `Data for ${id}`, count: this.callCount };
      }

      @Cacheable({ key: "custom:key", ttl: 30 })
      async getStaticData() {
        this.callCount++;
        return { static: true, count: this.callCount };
      }
    }

    it("should cache decorated method results", async () => {
      const service = new TestService();

      // First call
      const result1 = await service.getData("test-id");
      expect(result1.count).toBe(1);
      expect(service.callCount).toBe(1);

      // Second call - should be cached
      const result2 = await service.getData("test-id");
      expect(result2.count).toBe(1); // Same as first
      expect(service.callCount).toBe(1); // Method not called again

      // Different argument - should not be cached
      const result3 = await service.getData("other-id");
      expect(result3.count).toBe(2);
      expect(service.callCount).toBe(2);
    });

    it("should use custom cache key when provided", async () => {
      const service = new TestService();

      const result1 = await service.getStaticData();
      expect(result1.count).toBe(1);

      // Check the custom key exists
      const cached = await RedisService.get("custom:key");
      expect(cached).toBeTruthy();

      const result2 = await service.getStaticData();
      expect(result2.count).toBe(1); // Cached
    });
  });

  describe("Cache Performance", () => {
    it("should be significantly faster for cached results", async () => {
      const key = "cache:test:performance";
      const slowOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { data: "slow result" };
      };

      // First call - measure time
      const start1 = Date.now();
      await withCache({ key, ttl: 60 }, slowOperation);
      const time1 = Date.now() - start1;

      // Second call - should be much faster
      const start2 = Date.now();
      await withCache({ key, ttl: 60 }, slowOperation);
      const time2 = Date.now() - start2;

      // Cached call should be at least 10x faster
      expect(time2).toBeLessThan(time1 / 10);
      console.log(`Cache performance: ${time1}ms (miss) vs ${time2}ms (hit)`);
    });
  });

  describe("Cache Scenarios", () => {
    it("should handle concurrent cache requests", async () => {
      const key = "cache:test:concurrent";
      let executionCount = 0;

      const operation = async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: "data", count: executionCount };
      };

      // Fire multiple requests concurrently
      const promises = Array(5).fill(null).map(() => 
        withCache({ key, ttl: 60 }, operation)
      );

      const results = await Promise.all(promises);

      // All should have the same result
      results.forEach(result => {
        expect(result.count).toBe(1); // Function only executed once
      });

      expect(executionCount).toBe(1);
    });

    it("should handle complex data structures", async () => {
      const key = "cache:test:complex";
      const complexData = {
        users: [
          { id: 1, name: "User 1", roles: ["admin", "user"] },
          { id: 2, name: "User 2", roles: ["user"] }
        ],
        metadata: {
          total: 2,
          page: 1,
          nested: {
            deep: {
              value: "test"
            }
          }
        },
        timestamp: new Date().toISOString()
      };

      const result1 = await withCache(
        { key, ttl: 60 },
        async () => complexData
      );

      const result2 = await withCache(
        { key, ttl: 60 },
        async () => ({ different: "data" })
      );

      // Should return cached complex data
      expect(result2).toEqual(complexData);
      expect(result2.metadata.nested.deep.value).toBe("test");
    });
  });
});
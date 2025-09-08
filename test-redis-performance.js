#!/usr/bin/env bun
/**
 * Redis Performance Benchmark Test
 * Tests cache performance, hit rates, and overall system impact
 */

import { redis, RedisService, cacheKeys } from "./packages/redis/src/client.js";
import { withCache, invalidateCache, invalidatePattern } from "./packages/redis/src/cache.js";

// Test configuration
const ITERATIONS = 100;
const CONCURRENT_REQUESTS = 10;
const TEST_DATA_SIZE = {
  small: { items: 10 },
  medium: { items: 100 },
  large: { items: 1000 }
};

// Utility functions
const log = (message, data = null) => {
  console.log(`✅ ${message}`);
  if (data) console.table(data);
};

const error = (message, err = null) => {
  console.error(`❌ ${message}`);
  if (err) console.error(err);
};

const generateTestData = (size) => {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push({
      id: `id-${i}`,
      name: `Item ${i}`,
      description: `Description for item ${i}`,
      metadata: {
        created: new Date().toISOString(),
        tags: [`tag${i % 5}`, `tag${i % 3}`],
        nested: {
          value: Math.random() * 1000,
          deep: {
            field: `field-${i}`
          }
        }
      }
    });
  }
  return data;
};

const measure = async (name, fn) => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration, name };
};

// Test scenarios
async function testCacheHitRate() {
  console.log("\n📊 Testing Cache Hit Rate\n");
  
  const results = {
    hits: 0,
    misses: 0,
    totalTime: 0,
    cacheTime: 0,
    directTime: 0
  };

  const testKey = "perf:test:hitrate";
  const testData = generateTestData(TEST_DATA_SIZE.medium.items);
  
  // Clear cache
  await invalidateCache(testKey);

  // First access - cache miss
  const miss = await measure("Cache Miss", async () => {
    return withCache(
      { key: testKey, ttl: 300 },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB query
        return testData;
      }
    );
  });
  results.misses++;
  results.directTime += miss.duration;

  // Multiple cache hits
  for (let i = 0; i < 10; i++) {
    const hit = await measure(`Cache Hit ${i + 1}`, async () => {
      return withCache(
        { key: testKey, ttl: 300 },
        async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return testData;
        }
      );
    });
    results.hits++;
    results.cacheTime += hit.duration;
  }

  const avgCacheTime = results.cacheTime / results.hits;
  const improvement = ((results.directTime - avgCacheTime) / results.directTime * 100).toFixed(2);

  log("Cache Hit Rate Results", {
    "Total Requests": results.hits + results.misses,
    "Cache Hits": results.hits,
    "Cache Misses": results.misses,
    "Hit Rate": `${(results.hits / (results.hits + results.misses) * 100).toFixed(2)}%`,
    "Avg Cache Response": `${avgCacheTime.toFixed(2)}ms`,
    "Direct Query Time": `${results.directTime.toFixed(2)}ms`,
    "Performance Improvement": `${improvement}%`
  });
}

async function testDataSizeImpact() {
  console.log("\n📦 Testing Data Size Impact\n");
  
  const results = [];

  for (const [size, config] of Object.entries(TEST_DATA_SIZE)) {
    const testKey = `perf:test:size:${size}`;
    const testData = generateTestData(config.items);
    
    // Clear cache
    await invalidateCache(testKey);

    // Test write performance
    const write = await measure(`Write ${size}`, async () => {
      return RedisService.set(testKey, testData, 300);
    });

    // Test read performance
    const read = await measure(`Read ${size}`, async () => {
      return RedisService.get(testKey);
    });

    // Calculate data size in KB
    const dataSize = JSON.stringify(testData).length / 1024;

    results.push({
      Size: size,
      Items: config.items,
      "Data Size (KB)": dataSize.toFixed(2),
      "Write Time (ms)": write.duration.toFixed(2),
      "Read Time (ms)": read.duration.toFixed(2),
      "Total (ms)": (write.duration + read.duration).toFixed(2)
    });
  }

  log("Data Size Impact Results", results);
}

async function testConcurrentAccess() {
  console.log("\n🔄 Testing Concurrent Access\n");
  
  const testKey = "perf:test:concurrent";
  const testData = generateTestData(TEST_DATA_SIZE.medium.items);
  let executionCount = 0;
  
  // Clear cache
  await invalidateCache(testKey);

  const operation = async () => {
    executionCount++;
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    return testData;
  };

  // Test concurrent requests
  const start = performance.now();
  const promises = Array(CONCURRENT_REQUESTS).fill(null).map((_, index) => 
    withCache(
      { key: testKey, ttl: 300 },
      operation
    )
  );

  const results = await Promise.all(promises);
  const duration = performance.now() - start;

  log("Concurrent Access Results", {
    "Concurrent Requests": CONCURRENT_REQUESTS,
    "Function Executions": executionCount,
    "Cache Efficiency": executionCount === 1 ? "Perfect (1 execution)" : `${executionCount} executions`,
    "Total Time": `${duration.toFixed(2)}ms`,
    "Avg Time per Request": `${(duration / CONCURRENT_REQUESTS).toFixed(2)}ms`
  });
}

async function testCacheInvalidation() {
  console.log("\n🗑️  Testing Cache Invalidation\n");
  
  const results = [];

  // Test single key invalidation
  const singleKey = "perf:test:invalidate:single";
  await RedisService.set(singleKey, { data: "test" });
  
  const single = await measure("Single Key Invalidation", async () => {
    return invalidateCache(singleKey);
  });
  results.push({
    Type: "Single Key",
    "Time (ms)": single.duration.toFixed(2)
  });

  // Test multiple key invalidation
  const multiKeys = Array(10).fill(null).map((_, i) => `perf:test:invalidate:multi:${i}`);
  for (const key of multiKeys) {
    await RedisService.set(key, { data: key });
  }
  
  const multi = await measure("Multiple Keys Invalidation", async () => {
    return invalidateCache(multiKeys);
  });
  results.push({
    Type: `Multiple Keys (${multiKeys.length})`,
    "Time (ms)": multi.duration.toFixed(2)
  });

  // Test pattern invalidation
  const patternKeys = Array(20).fill(null).map((_, i) => `perf:test:pattern:${i}`);
  for (const key of patternKeys) {
    await RedisService.set(key, { data: key });
  }
  
  const pattern = await measure("Pattern Invalidation", async () => {
    return invalidatePattern("perf:test:pattern:*");
  });
  results.push({
    Type: `Pattern (${patternKeys.length} keys)`,
    "Time (ms)": pattern.duration.toFixed(2)
  });

  log("Cache Invalidation Results", results);
}

async function testMemoryUsage() {
  console.log("\n💾 Testing Memory Usage\n");
  
  const results = [];
  const testPrefix = "perf:test:memory";

  // Clear existing test keys
  await invalidatePattern(`${testPrefix}:*`);

  // Test different data volumes
  const volumes = [
    { count: 100, size: 10 },
    { count: 500, size: 10 },
    { count: 100, size: 100 },
    { count: 50, size: 500 }
  ];

  for (const { count, size } of volumes) {
    const keys = [];
    const data = generateTestData(size);
    
    // Store data
    for (let i = 0; i < count; i++) {
      const key = `${testPrefix}:${count}x${size}:${i}`;
      keys.push(key);
      await RedisService.set(key, data, 300);
    }

    // Calculate approximate memory usage
    const dataSize = JSON.stringify(data).length;
    const totalSize = (dataSize * count) / (1024 * 1024); // Convert to MB

    results.push({
      "Keys": count,
      "Items per Key": size,
      "Total Items": count * size,
      "Approx Memory (MB)": totalSize.toFixed(2)
    });

    // Clean up
    await invalidatePattern(`${testPrefix}:${count}x${size}:*`);
  }

  log("Memory Usage Estimates", results);
}

async function testRealWorldScenario() {
  console.log("\n🌍 Testing Real-World Scenario\n");
  
  // Simulate a typical job search workflow
  const teamId = "team-test-123";
  const searchQueries = [
    { search: "concrete", status: ["pending"] },
    { search: "concrete", status: ["pending"] }, // Duplicate (should hit cache)
    { customerId: "customer-123" },
    { dateFrom: "2024-01-01", dateTo: "2024-12-31" },
    { search: "concrete", status: ["pending"] } // Another duplicate
  ];

  const results = [];
  let cacheHits = 0;
  let cacheMisses = 0;

  for (const [index, query] of searchQueries.entries()) {
    const cacheKey = cacheKeys.jobsList(teamId, query);
    
    // Check if already cached
    const exists = await RedisService.exists(cacheKey);
    
    const timing = await measure(`Query ${index + 1}`, async () => {
      return withCache(
        { key: cacheKey, ttl: 60 },
        async () => {
          if (!exists) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB query
            cacheMisses++;
          } else {
            cacheHits++;
          }
          return generateTestData(25); // Typical page size
        }
      );
    });

    results.push({
      Query: JSON.stringify(query).substring(0, 50),
      "Cache Status": exists ? "HIT" : "MISS",
      "Response Time": `${timing.duration.toFixed(2)}ms`
    });
  }

  log("Real-World Scenario Results", results);
  log("Summary", {
    "Total Queries": searchQueries.length,
    "Cache Hits": cacheHits,
    "Cache Misses": cacheMisses,
    "Hit Rate": `${(cacheHits / searchQueries.length * 100).toFixed(2)}%`
  });
}

// Main test runner
async function runPerformanceTests() {
  console.log("🚀 Redis Performance Benchmark Suite");
  console.log("====================================\n");

  try {
    // Check Redis connection
    const isHealthy = await redis.isHealthy();
    if (!isHealthy) {
      error("Redis is not available. Please start Redis first.");
      console.log("Run: docker-compose up -d redis");
      process.exit(1);
    }
    log("Redis connection established");

    // Clean up any existing test data
    await invalidatePattern("perf:test:*");

    // Run performance tests
    await testCacheHitRate();
    await testDataSizeImpact();
    await testConcurrentAccess();
    await testCacheInvalidation();
    await testMemoryUsage();
    await testRealWorldScenario();

    // Final cleanup
    await invalidatePattern("perf:test:*");

    console.log("\n====================================");
    console.log("✨ Performance tests completed successfully!");
    
    // Disconnect from Redis
    await redis.disconnect();
    
  } catch (err) {
    error("Performance test failed", err);
    process.exit(1);
  }
}

// Run tests
runPerformanceTests();
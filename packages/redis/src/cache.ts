import { logger } from '@midday/logger';
import { RedisService } from './client';
import type { CacheOptions, CachedData } from './types';

const DEFAULT_TTL = 300; // 5 minutes
const DEFAULT_VERSION = 1;

/**
 * Higher-order function for caching async operations
 */
export async function withCache<T>(
  options: CacheOptions,
  fn: () => Promise<T>,
  skipCache = false
): Promise<T> {
  const { key, ttl = DEFAULT_TTL, version = DEFAULT_VERSION } = options;

  // Skip cache if requested or in development with hot reload
  if (skipCache || process.env.SKIP_CACHE === 'true') {
    return fn();
  }

  try {
    // Try to get from cache
    const cached = await RedisService.get<CachedData<T>>(key);
    
    if (cached && cached.version === version) {
      const age = Date.now() - cached.cachedAt;
      logger.info(`Cache hit for ${key} (age: ${age}ms)`);
      return cached.data;
    }

    // Cache miss or version mismatch
    logger.info(`Cache miss for ${key}`);
    const data = await fn();

    // Store in cache
    const cacheData: CachedData<T> = {
      data,
      cachedAt: Date.now(),
      version,
    };

    await RedisService.set(key, cacheData, ttl);
    
    return data;
  } catch (error) {
    logger.error('Cache operation failed, falling back to direct call:', error);
    // Fallback to direct call if Redis fails
    return fn();
  }
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string | string[]): Promise<void> {
  try {
    const keys = Array.isArray(key) ? key : [key];
    const deleted = await RedisService.del(keys);
    logger.info(`Invalidated ${deleted} cache key(s)`);
  } catch (error) {
    logger.error('Failed to invalidate cache:', error);
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const deleted = await RedisService.flushPattern(pattern);
    logger.info(`Invalidated ${deleted} cache key(s) matching pattern: ${pattern}`);
  } catch (error) {
    logger.error('Failed to invalidate cache pattern:', error);
  }
}

/**
 * Cache decorator for class methods
 */
export function Cacheable(options: Partial<CacheOptions> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      const cacheOptions: CacheOptions = {
        key,
        ttl: options.ttl || DEFAULT_TTL,
        version: options.version || DEFAULT_VERSION,
      };

      return withCache(
        cacheOptions,
        () => originalMethod.apply(this, args),
        false
      );
    };

    return descriptor;
  };
}
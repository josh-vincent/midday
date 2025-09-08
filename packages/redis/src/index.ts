export { redis, RedisService, cacheKeys } from './client';
export type { CacheOptions, CachedData } from './types';
export { withCache, invalidateCache, invalidatePattern } from './cache';
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key: string;
  version?: number; // Cache version for invalidation
}

export interface CachedData<T = unknown> {
  data: T;
  cachedAt: number;
  version?: number;
}
import Redis from 'ioredis';
import { logger } from '@midday/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_MAX_RETRIES = 3;
const REDIS_RETRY_DELAY = 1000;

class RedisClient {
  private client: Redis | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<Redis> | null = null;

  async getClient(): Promise<Redis> {
    if (this.client && this.client.status === 'ready') {
      return this.client;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.connect();
    
    try {
      this.client = await this.connectionPromise;
      return this.client;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async connect(): Promise<Redis> {
    try {
      const client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: REDIS_MAX_RETRIES,
        retryStrategy: (times) => {
          if (times > REDIS_MAX_RETRIES) {
            logger.error('Redis connection failed after max retries');
            return null;
          }
          return Math.min(times * REDIS_RETRY_DELAY, 3000);
        },
        lazyConnect: false,
        enableOfflineQueue: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      client.on('error', (error) => {
        logger.error('Redis client error:', error);
      });

      client.on('connect', () => {
        logger.info('Redis client connected');
      });

      client.on('ready', () => {
        logger.info('Redis client ready');
      });

      client.on('close', () => {
        logger.warn('Redis connection closed');
      });

      client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      // Wait for connection
      await client.ping();
      
      return client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const response = await client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const redis = new RedisClient();

// Cache key generators
export const cacheKeys = {
  // Jobs
  jobsList: (teamId: string, filters?: Record<string, any>) => 
    `jobs:list:${teamId}:${JSON.stringify(filters || {})}`,
  jobById: (jobId: string) => `jobs:${jobId}`,
  jobsSummary: (teamId: string) => `jobs:summary:${teamId}`,
  
  // Customers
  customersList: (teamId: string, filters?: Record<string, any>) => 
    `customers:list:${teamId}:${JSON.stringify(filters || {})}`,
  customerById: (customerId: string) => `customers:${customerId}`,
  
  // Invoices
  invoicesList: (teamId: string, filters?: Record<string, any>) => 
    `invoices:list:${teamId}:${JSON.stringify(filters || {})}`,
  invoiceById: (invoiceId: string) => `invoices:${invoiceId}`,
  
  // Teams
  teamById: (teamId: string) => `teams:${teamId}`,
  teamMembers: (teamId: string) => `teams:${teamId}:members`,
  
  // Users
  userById: (userId: string) => `users:${userId}`,
  userTeams: (userId: string) => `users:${userId}:teams`,
  
  // Search
  searchResults: (query: string, type: string) => `search:${type}:${query}`,
};

// Redis service with utility methods
export class RedisService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = await redis.getClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(
    key: string, 
    value: any, 
    ttl?: number
  ): Promise<boolean> {
    try {
      const client = await redis.getClient();
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await client.setex(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  static async del(key: string | string[]): Promise<number> {
    try {
      const client = await redis.getClient();
      const keys = Array.isArray(key) ? key : [key];
      return await client.del(...keys);
    } catch (error) {
      logger.error(`Redis del error for key(s) ${key}:`, error);
      return 0;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const client = await redis.getClient();
      return (await client.exists(key)) === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  static async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const client = await redis.getClient();
      return (await client.expire(key, ttl)) === 1;
    } catch (error) {
      logger.error(`Redis expire error for key ${key}:`, error);
      return false;
    }
  }

  static async keys(pattern: string): Promise<string[]> {
    try {
      const client = await redis.getClient();
      return await client.keys(pattern);
    } catch (error) {
      logger.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  static async flushPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.del(keys);
    } catch (error) {
      logger.error(`Redis flush pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  static async incr(key: string): Promise<number> {
    try {
      const client = await redis.getClient();
      return await client.incr(key);
    } catch (error) {
      logger.error(`Redis incr error for key ${key}:`, error);
      return 0;
    }
  }

  static async decr(key: string): Promise<number> {
    try {
      const client = await redis.getClient();
      return await client.decr(key);
    } catch (error) {
      logger.error(`Redis decr error for key ${key}:`, error);
      return 0;
    }
  }
}
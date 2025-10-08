import { checkHealth as checkDbHealth } from "@midday/db/utils/health";
import { redis } from "@midday/redis";
import { logger } from "@midday/logger";

export async function checkHealth(): Promise<void> {
  // Check database health
  await checkDbHealth();
  
  // Check Redis health (optional - don't fail if Redis is down)
  try {
    const isRedisHealthy = await redis.isHealthy();
    if (!isRedisHealthy) {
      logger.warn("Redis is not healthy but application can continue");
    }
  } catch (error) {
    logger.warn("Redis health check failed:", error);
    // Don't throw - Redis is optional for caching
  }
}

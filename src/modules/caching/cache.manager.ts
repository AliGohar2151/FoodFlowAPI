import { redis, isRedisHealthy } from "../../infrastructure/cache/redis.js";
import { logger } from "../../config/logger.js";

export class CacheManager {
  /**
   * Get cached item by key with automatic JSON parsing.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const healthy = await isRedisHealthy();
      if (!healthy) return null;

      const cached = await redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch (err) {
      logger.warn(`[CacheManager] Failed to get key '${key}': ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Set cached item with key, value, and optional TTL in seconds.
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const healthy = await isRedisHealthy();
      if (!healthy) return;

      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (err) {
      logger.warn(`[CacheManager] Failed to set key '${key}': ${(err as Error).message}`);
    }
  }

  /**
   * Delete specific cached key.
   */
  async del(key: string): Promise<void> {
    try {
      const healthy = await isRedisHealthy();
      if (!healthy) return;

      await redis.del(key);
    } catch (err) {
      logger.warn(
        `[CacheManager] Failed to delete key '${key}': ${(err as Error).message}`,
      );
    }
  }

  /**
   * Invalidate cached keys matching a wildcard pattern (using SCAN).
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      const healthy = await isRedisHealthy();
      if (!healthy) return 0;

      let cursor = "0";
      let count = 0;

      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          count += keys.length;
        }
      } while (cursor !== "0");

      logger.info(
        `[CacheManager] Invalidated ${String(count)} keys matching pattern '${pattern}'`,
      );
      return count;
    } catch (err) {
      logger.warn(
        `[CacheManager] Failed to delete pattern '${pattern}': ${(err as Error).message}`,
      );
      return 0;
    }
  }

  /**
   * Get item from cache if present, otherwise execute fetchFn, cache the result, and return.
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fetchFn();
    await this.set(key, result, ttlSeconds);
    return result;
  }
}

export const cacheManager = new CacheManager();

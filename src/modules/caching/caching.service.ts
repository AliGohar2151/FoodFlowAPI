import { cacheManager } from "./cache.manager.js";
import { isRedisHealthy, redis } from "../../infrastructure/cache/redis.js";
import { ForbiddenError, BadRequestError } from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";
import type { InvalidateCacheInput } from "./caching.schema.ts";

export class CachingService {
  /**
   * Check cache health and connection status.
   */
  async getCacheHealth(userContext: UserContext) {
    this.ensureAdmin(userContext);

    const healthy = await isRedisHealthy();
    const status = healthy ? "ONLINE" : "OFFLINE";

    return {
      status,
      isHealthy: healthy,
      redisStatus: redis.status,
    };
  }

  /**
   * Invalidate specific key or pattern.
   */
  async invalidateCache(userContext: UserContext, input: InvalidateCacheInput) {
    this.ensureAdmin(userContext);

    if (input.key) {
      await cacheManager.del(input.key);
      return { message: `Key '${input.key}' invalidated successfully`, count: 1 };
    }

    if (input.pattern) {
      const count = await cacheManager.delByPattern(input.pattern);
      return { message: `Pattern '${input.pattern}' invalidated successfully`, count };
    }

    throw new BadRequestError(
      "Either 'key' or 'pattern' must be provided for cache invalidation",
    );
  }

  /**
   * Flush all Redis keys (Admin only).
   */
  async flushAllCache(userContext: UserContext) {
    this.ensureAdmin(userContext);

    const healthy = await isRedisHealthy();
    if (!healthy) {
      throw new BadRequestError("Redis is not connected");
    }

    await redis.flushdb();
    return { message: "Redis cache flushed successfully" };
  }

  private ensureAdmin(userContext: UserContext) {
    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    if (!isAdmin) {
      throw new ForbiddenError("Only administrators can manage the cache");
    }
  }
}

export const cachingService = new CachingService();

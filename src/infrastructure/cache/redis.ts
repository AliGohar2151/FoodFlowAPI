import { Redis } from "ioredis";
import { config } from "../../config/index.js";
import { logger } from "../../config/logger.js";

/**
 * Redis client singleton.
 * Uses ioredis with lazyConnect enabled to allow graceful setup/teardown.
 */

declare global {
  var __redis: Redis | undefined;
}

function createRedisClient(): Redis {
  const client = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on("error", (err) => {
    logger.error("Redis client error", { error: String(err) });
  });

  client.on("connect", () => {
    logger.info("✅ Redis connected");
  });

  return client;
}

const redis = config.app.isProd
  ? createRedisClient()
  : (globalThis.__redis ??= createRedisClient());

if (!config.app.isProd) {
  globalThis.__redis = redis;
}

export { redis };

/**
 * Connect to Redis.
 */
export async function connectRedis(): Promise<void> {
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") {
      await redis.connect();
    }
  } catch (err) {
    logger.warn("⚠️ Redis failed to connect (continuing without cache)", {
      error: String(err),
    });
  }
}

/**
 * Gracefully disconnect Redis.
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.status === "ready" || redis.status === "connecting") {
      await redis.quit();
      logger.info("Redis disconnected");
    }
  } catch (err) {
    logger.error("Error disconnecting Redis", { error: String(err) });
  }
}

/**
 * Check if Redis is connected and responsive.
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    if (redis.status !== "ready") return false;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return (await redis.ping()) === "PONG";
  } catch {
    return false;
  }
}

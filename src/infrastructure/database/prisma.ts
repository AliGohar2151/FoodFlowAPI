import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "../../config/index.js";
import { logger } from "../../config/logger.js";

/**
 * Prisma client singleton.
 * Uses Prisma 7 Driver Adapter with pg.
 */

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const pool = new pg.Pool({
    connectionString: config.db.url,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
}

// Singleton pattern — reuse in dev to avoid connection pool exhaustion on hot reload
const prisma = config.app.isProd
  ? createPrismaClient()
  : (globalThis.__prisma ??= createPrismaClient());

if (!config.app.isProd) {
  globalThis.__prisma = prisma;
}

export { prisma };

/**
 * Connect to the database with retry logic.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("✅ PostgreSQL connected via Prisma");
  } catch (err) {
    logger.error("❌ Failed to connect to PostgreSQL", { error: String(err) });
    throw err;
  }
}

/**
 * Gracefully disconnect Prisma.
 * Call during application shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("PostgreSQL disconnected");
  } catch (err) {
    logger.error("Error disconnecting from PostgreSQL", { error: String(err) });
  }
}

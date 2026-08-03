/**
 * FoodFlow — Background Worker Entry Point
 *
 * This process runs independently from the API server.
 * It connects to the same infrastructure (PostgreSQL, Redis) and
 * processes background jobs from the queue system.
 *
 * In production this runs as a separate container (see docker-compose.yml).
 * The same Docker image is reused — only the startup command differs.
 *
 * Job queues processed:
 *   - notifications  (email, push, in-app)
 *   - orders         (expiration, status automation)
 *   - payments       (webhook retries, refund processing)
 *   - cleanup        (session cleanup, stale data removal)
 */

import { config } from "./config/index.js";
import { logger } from "./config/logger.js";
import { connectDatabase, disconnectDatabase } from "./infrastructure/database/index.js";
import { connectRedis, disconnectRedis } from "./infrastructure/cache/index.js";
import { jobsService } from "./modules/jobs/jobs.service.js";

async function startWorker(): Promise<void> {
  logger.info("🔧 FoodFlow Worker starting", {
    env: config.app.env,
    pid: process.pid,
  });

  // Connect to shared infrastructure
  await connectDatabase();
  await connectRedis();

  logger.info("✅ Worker connected to PostgreSQL and Redis");
  logger.info("📋 Registered queues: notifications, orders, payments, cleanup");
  logger.info("⏳ Worker is running — waiting for jobs...");

  // jobsService constructor auto-registers all default workers
  // The singleton is initialized at import time
  void jobsService;
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — worker shutting down gracefully`);

  await disconnectRedis();
  await disconnectDatabase();

  logger.info("Worker shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.fatal("Worker uncaught exception — shutting down", { error: String(err) });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal("Worker unhandled rejection — shutting down", { reason: String(reason) });
  process.exit(1);
});

startWorker().catch((err: unknown) => {
  logger.fatal("Worker failed to start", { error: String(err) });
  process.exit(1);
});

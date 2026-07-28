import app from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./config/logger.js";
import { connectDatabase, disconnectDatabase } from "./infrastructure/database/index.js";
import { connectRedis, disconnectRedis } from "./infrastructure/cache/index.js";

const { port, env: nodeEnv, apiPrefix } = config.app;

async function bootstrap(): Promise<void> {
  // Connect to infrastructure services
  await connectDatabase();
  await connectRedis();

  const server = app.listen(port, () => {
    logger.info(`🚀 FoodFlow API started`, {
      env: nodeEnv,
      port,
      apiPrefix,
      pid: process.pid,
    });
    logger.info(`📋 Health: http://localhost:${String(port)}${apiPrefix}/health`);
  });

  // ── Graceful Shutdown ──────────────────────────────────────────────────────

  async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async (err) => {
      if (err) {
        logger.error("Error during server shutdown", { error: String(err) });
      }

      logger.info("HTTP server closed");
      await disconnectRedis();
      await disconnectDatabase();
      process.exit(err ? 1 : 0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error("Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

process.on("uncaughtException", (err) => {
  logger.fatal("Uncaught Exception — shutting down", { error: String(err) });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal("Unhandled Rejection — shutting down", { reason: String(reason) });
  process.exit(1);
});

bootstrap().catch((err: unknown) => {
  logger.fatal("Failed to start application", { error: String(err) });
  process.exit(1);
});

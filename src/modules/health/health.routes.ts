import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import { sendSuccess } from "../../common/responses/index.js";
import { asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

/**
 * GET /health
 * General health check — confirms the server is up.
 */
router.get("/", (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { message: "Server is healthy" },
  );
});

/**
 * GET /health/live
 * Liveness probe — confirms the process is alive.
 * Used by orchestrators (Kubernetes, Docker) to restart if this fails.
 */
router.get("/live", (_req: Request, res: Response) => {
  sendSuccess(res, { status: "ok" }, { message: "Service is alive" });
});

/**
 * GET /health/ready
 * Readiness probe — confirms the app is ready to serve traffic.
 * Checks DB and Redis connectivity.
 */
router.get(
  "/ready",
  asyncHandler(async (_req: Request, res: Response) => {
    const checks: Record<string, string> = {
      server: "ok",
    };

    // Check DB (Prisma)
    try {
      const { prisma } = await import("../../infrastructure/database/prisma.js");
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }

    // Check Redis
    try {
      const { isRedisHealthy } = await import("../../infrastructure/cache/redis.js");
      const redisHealthy = await isRedisHealthy();
      checks.redis = redisHealthy ? "ok" : "disabled_or_unreachable";
    } catch {
      checks.redis = "error";
    }

    // Database is critical; Redis is non-blocking in development
    const dbOk = checks.database === "ok";
    const allOk = dbOk;

    sendSuccess(
      res,
      { status: allOk ? "ok" : "degraded", checks },
      {
        message: allOk ? "Service is ready" : "Service is degraded",
        statusCode: allOk ? 200 : 503,
      },
    );
  }),
);

/**
 * GET /health/metrics
 * System & Application Observability Metrics Endpoint.
 * Returns process memory usage, uptime, CPU usage, and environment state.
 */
router.get("/metrics", (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const bytesToMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

  const metrics = {
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memoryMb: {
      rss: bytesToMb(memoryUsage.rss),
      heapTotal: bytesToMb(memoryUsage.heapTotal),
      heapUsed: bytesToMb(memoryUsage.heapUsed),
      external: bytesToMb(memoryUsage.external),
      arrayBuffers: bytesToMb(memoryUsage.arrayBuffers ?? 0),
    },
    cpuUsage: process.cpuUsage(),
  };

  sendSuccess(res, metrics, { message: "System observability metrics" });
});

export default router;

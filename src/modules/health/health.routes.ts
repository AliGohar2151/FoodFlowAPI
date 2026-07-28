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

export default router;

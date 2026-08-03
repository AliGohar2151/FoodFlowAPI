import type { Request, Response, NextFunction } from "express";
import { logger } from "../../config/logger.js";

/**
 * Structured Request Performance Logger
 * Measures and logs HTTP request duration, status code, method, route, and correlation ID.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startMs = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startMs;
    const statusCode = res.statusCode;
    const requestId =
      (req.headers["x-request-id"] as string | undefined) ??
      (req as Request & { id?: string }).id ??
      "unknown";

    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      durationMs: `${durationMs}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    if (statusCode >= 500) {
      logger.error(
        `HTTP ${req.method} ${req.originalUrl} ${statusCode} - ${durationMs}ms`,
        logData,
      );
    } else if (statusCode >= 400) {
      logger.warn(
        `HTTP ${req.method} ${req.originalUrl} ${statusCode} - ${durationMs}ms`,
        logData,
      );
    } else {
      logger.info(
        `HTTP ${req.method} ${req.originalUrl} ${statusCode} - ${durationMs}ms`,
        logData,
      );
    }
  });

  next();
}

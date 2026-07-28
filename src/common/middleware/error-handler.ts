import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/index.js";
import { ZodError } from "zod";
import { config } from "../../config/index.js";

/**
 * Global error handler middleware.
 * Catches all thrown errors and returns a consistent JSON response.
 * Never exposes internal details (stack traces, DB errors) in production.
 */
export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      error: {
        code: "VALIDATION_ERROR",
        details: err.format(),
      },
    });
    return;
  }

  // Handle our custom AppErrors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        details: err.details ?? null,
      },
    });
    return;
  }

  // Unknown / programmer errors
  const isProduction = config.app.isProd;

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    error: {
      code: "INTERNAL_ERROR",
      details: isProduction ? null : String(err),
    },
  });
}

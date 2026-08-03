import { rateLimit } from "express-rate-limit";
import { config } from "../../config/index.js";

/**
 * Global Rate Limiter
 * Applied to all API routes by default.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
    error: {
      code: "TOO_MANY_REQUESTS",
      details: { retryAfterSeconds: Math.ceil(config.rateLimit.windowMs / 1000) },
    },
  },
});

/**
 * Auth Rate Limiter
 * Strict limiter for sensitive auth operations (login, register, forgot/reset password).
 * Max 5 attempts per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes",
    error: {
      code: "TOO_MANY_REQUESTS",
      details: { retryAfterSeconds: 900 },
    },
  },
});

/**
 * Sensitive Operations Rate Limiter
 * Applied to payments, user deletions, password modifications.
 * Max 10 operations per 15 minutes per IP.
 */
export const sensitiveOpsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sensitive requests. Please try again later",
    error: {
      code: "TOO_MANY_REQUESTS",
      details: { retryAfterSeconds: 900 },
    },
  },
});

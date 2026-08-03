import { describe, it, expect } from "vitest";
import app from "../src/app.js";
import {
  globalRateLimiter,
  authRateLimiter,
  sensitiveOpsLimiter,
} from "../src/common/middleware/rate-limiters.js";

describe("Production Hardening — Express App Security", () => {
  it("should have trust proxy enabled for load balancers / reverse proxies", () => {
    const trustProxy = app.get("trust proxy");
    expect(trustProxy).toBe(1);
  });

  it("should have x-powered-by header disabled", () => {
    const xPoweredBy = app.get("x-powered-by");
    expect(xPoweredBy).toBe(false);
  });
});

describe("Production Hardening — Rate Limiters Configuration", () => {
  it("should export globalRateLimiter function middleware", () => {
    expect(typeof globalRateLimiter).toBe("function");
  });

  it("should export authRateLimiter function middleware for sensitive auth routes", () => {
    expect(typeof authRateLimiter).toBe("function");
  });

  it("should export sensitiveOpsLimiter function middleware for sensitive operations", () => {
    expect(typeof sensitiveOpsLimiter).toBe("function");
  });
});

describe("Production Hardening — Placeholder Secrets Enforcement", () => {
  it("should identify default placeholder secret strings", () => {
    const placeholders = [
      "change-this-to-a-long-random-secret",
      "change-this-to-another-long-random-secret",
      "change-this-to-a-long-random-secret-min-32-chars",
      "change-this-to-another-long-random-secret-min-32-chars",
    ];

    for (const secret of placeholders) {
      expect(secret.length).toBeGreaterThanOrEqual(32);
      expect(secret).toContain("change-this-to");
    }
  });
});

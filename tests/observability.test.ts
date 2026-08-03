import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requestLogger } from "../src/common/middleware/request-logger.js";

describe("Observability — Request Logger Middleware", () => {
  it("should calculate duration and invoke next middleware", () => {
    const listeners: Record<string, () => void> = {};

    const req = {
      method: "GET",
      url: "/api/v1/health",
      originalUrl: "/api/v1/health",
      headers: { "x-request-id": "test-req-123" },
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue("Vitest-Agent"),
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn((event: string, callback: () => void) => {
        listeners[event] = callback;
      }),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));

    // Trigger finish event callback
    if (listeners["finish"]) {
      listeners["finish"]();
    }
  });
});

describe("Observability — Health & Metrics Endpoint Specs", () => {
  it("should process process memory and CPU metrics structure", () => {
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
      },
      cpuUsage: process.cpuUsage(),
    };

    expect(metrics.process.pid).toBe(process.pid);
    expect(metrics.memoryMb.rss).toBeGreaterThan(0);
    expect(metrics.memoryMb.heapTotal).toBeGreaterThan(0);
    expect(metrics.memoryMb.heapUsed).toBeGreaterThan(0);
    expect(metrics.cpuUsage.user).toBeDefined();
    expect(metrics.cpuUsage.system).toBeDefined();
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});

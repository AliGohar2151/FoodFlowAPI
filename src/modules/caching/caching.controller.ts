import type { Request, Response } from "express";
import { cachingService } from "./caching.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type { InvalidateCacheInput } from "./caching.schema.js";

export class CachingController {
  /**
   * GET /api/v1/caching/health
   */
  async getCacheHealth(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const health = await cachingService.getCacheHealth(req.user);
    sendSuccess(res, health, { message: "Cache health status retrieved" });
  }

  /**
   * POST /api/v1/caching/invalidate
   */
  async invalidateCache(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as InvalidateCacheInput;
    const result = await cachingService.invalidateCache(req.user, input);
    sendSuccess(res, result, { message: "Cache invalidation executed" });
  }

  /**
   * POST /api/v1/caching/flush
   */
  async flushAllCache(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const result = await cachingService.flushAllCache(req.user);
    sendSuccess(res, result, { message: "Cache flush executed" });
  }
}

export const cachingController = new CachingController();

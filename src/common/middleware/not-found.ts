import type { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../errors/index.js";

/**
 * 404 handler — catches all requests that don't match any route.
 * Must be registered after all routes.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
}

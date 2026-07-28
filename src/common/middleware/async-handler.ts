import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps async route handlers to automatically catch errors
 * and forward them to the global error middleware.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

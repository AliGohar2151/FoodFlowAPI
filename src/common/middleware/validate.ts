import type { Request, Response, NextFunction } from "express";
import { type ZodType, ZodError } from "zod";
import { ValidationError } from "../errors/index.js";

interface ValidateSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

declare global {
  namespace Express {
    interface Request {
      validatedBody: unknown;
      validatedParams: unknown;
      validatedQuery: unknown;
    }
  }
}

/**
 * Zod validation middleware.
 * Validates req.body, req.params, and req.query against provided schemas.
 * Attaches validated (type-safe) data to req.validatedBody, etc.
 *
 * Usage:
 *   router.post("/", validate({ body: createRestaurantSchema }), controller.create)
 */
export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.validatedBody = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.validatedParams = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.validatedQuery = schemas.query.parse(req.query);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError("Validation failed", err.format()));
      } else {
        next(err);
      }
    }
  };
}

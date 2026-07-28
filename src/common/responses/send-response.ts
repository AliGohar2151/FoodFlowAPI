import type { Response } from "express";

interface SuccessResponseOptions {
  message?: string;
  statusCode?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sends a standardized success response.
 *
 * Shape:
 * { success: true, message: "...", data: {...} }
 */
export function sendSuccess(
  res: Response,
  data: unknown,
  options: SuccessResponseOptions = {},
): Response {
  const { message = "Success", statusCode = 200, pagination } = options;

  const body: Record<string, unknown> = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    body.pagination = pagination;
  }

  return res.status(statusCode).json(body);
}

/**
 * Sends a standardized 204 No Content response.
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

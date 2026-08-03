import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  BusinessRuleError,
  TooManyRequestsError,
} from "../src/common/errors/app-error.js";

/**
 * Custom Application Error Classes — Unit Tests
 *
 * Verifies that all error classes carry the correct HTTP status codes,
 * error codes, messages, and that they are instances of AppError.
 *
 * See Memory.md §19 — Error Memory
 */

describe("AppError — Base Class", () => {
  it("should create an AppError with all properties set", () => {
    const err = new AppError("Something went wrong", 500, "INTERNAL_ERROR", {
      trace: "x",
    });
    expect(err.message).toBe("Something went wrong");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.details).toEqual({ trace: "x" });
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe("AppError");
    expect(err instanceof Error).toBe(true);
  });

  it("should have a stack trace", () => {
    const err = new AppError("Test", 400, "BAD_REQUEST");
    expect(err.stack).toBeDefined();
  });
});

describe("BadRequestError — 400", () => {
  it("should default to statusCode 400 and code BAD_REQUEST", () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Bad request");
  });

  it("should accept a custom message", () => {
    const err = new BadRequestError("Cart is empty");
    expect(err.message).toBe("Cart is empty");
  });

  it("should accept details object", () => {
    const details = { field: "quantity", issue: "must be positive" };
    const err = new BadRequestError("Invalid input", details);
    expect(err.details).toEqual(details);
  });

  it("should be an instance of AppError and BadRequestError", () => {
    const err = new BadRequestError();
    expect(err instanceof BadRequestError).toBe(true);
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe("UnauthorizedError — 401", () => {
  it("should default to statusCode 401 and code UNAUTHORIZED", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Authentication required");
  });

  it("should accept a custom message", () => {
    const err = new UnauthorizedError("Token has expired");
    expect(err.message).toBe("Token has expired");
  });
});

describe("ForbiddenError — 403", () => {
  it("should default to statusCode 403 and code FORBIDDEN", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("should accept a custom message", () => {
    const err = new ForbiddenError("Only admins can perform this action");
    expect(err.message).toBe("Only admins can perform this action");
  });
});

describe("NotFoundError — 404", () => {
  it("should default to statusCode 404 and code NOT_FOUND", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("should format message as '<Resource> not found'", () => {
    const err = new NotFoundError("Restaurant");
    expect(err.message).toBe("Restaurant not found");
  });

  it("should use default 'Resource' when not specified", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Resource not found");
  });
});

describe("ConflictError — 409", () => {
  it("should default to statusCode 409 and code CONFLICT", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("should use provided conflict message", () => {
    const err = new ConflictError("Email already registered");
    expect(err.message).toBe("Email already registered");
  });
});

describe("ValidationError — 422", () => {
  it("should default to statusCode 422 and code VALIDATION_ERROR", () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("should accept structured details for field errors", () => {
    const fieldErrors = [{ field: "email", message: "Invalid email" }];
    const err = new ValidationError("Validation failed", fieldErrors);
    expect(err.details).toEqual(fieldErrors);
  });
});

describe("BusinessRuleError — 400 BUSINESS_RULE_ERROR", () => {
  it("should set statusCode 400 and code BUSINESS_RULE_ERROR", () => {
    const err = new BusinessRuleError("Cannot cancel a delivered order");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BUSINESS_RULE_ERROR");
    expect(err.message).toBe("Cannot cancel a delivered order");
  });
});

describe("TooManyRequestsError — 429", () => {
  it("should default to statusCode 429 and code TOO_MANY_REQUESTS", () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("TOO_MANY_REQUESTS");
  });
});

describe("Error instanceof chain", () => {
  it("every custom error should be instanceof AppError and Error", () => {
    const errors = [
      new BadRequestError(),
      new UnauthorizedError(),
      new ForbiddenError(),
      new NotFoundError(),
      new ConflictError(),
      new ValidationError(),
      new BusinessRuleError("test"),
      new TooManyRequestsError(),
    ];

    for (const err of errors) {
      expect(err instanceof AppError).toBe(true);
      expect(err instanceof Error).toBe(true);
      expect(err.isOperational).toBe(true);
    }
  });
});

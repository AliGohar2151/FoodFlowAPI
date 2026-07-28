import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";
import { UnauthorizedError, ForbiddenError } from "../errors/index.js";
import { prisma } from "../../infrastructure/database/index.js";
import type { JwtPayload, UserResponse } from "../../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
    }
  }
}

/**
 * Authentication middleware.
 * Verifies JWT access token in `Authorization: Bearer <token>` header.
 * Attaches user profile to `req.user`.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token required");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Authentication token required");
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }

    if (payload.type !== "access") {
      throw new UnauthorizedError("Invalid token type");
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User account not found");
    }

    if (user.status === "SUSPENDED") {
      throw new ForbiddenError("Your account has been suspended");
    }

    if (user.status === "INACTIVE") {
      throw new ForbiddenError("Your account is inactive");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

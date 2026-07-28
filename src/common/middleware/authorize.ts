import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../errors/index.js";
import { prisma } from "../../infrastructure/database/index.js";
import { redis } from "../../infrastructure/cache/index.js";

declare global {
  namespace Express {
    interface Request {
      userRoles?: string[];
      userPermissions?: string[];
    }
  }
}

const CACHE_TTL_SECONDS = 300; // Cache user permissions for 5 minutes

/**
 * Fetch a user's assigned roles and combined set of permission names.
 * Uses Redis cache with fallback to PostgreSQL.
 */
export async function getUserRolesAndPermissions(userId: string): Promise<{
  roles: string[];
  permissions: string[];
}> {
  const cacheKey = `user:permissions:${userId}`;

  // Try Redis cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as {
        roles: string[];
        permissions: string[];
      };
      return parsed;
    }
  } catch {
    // Cache miss or Redis unavailable — fall back to DB
  }

  // DB lookup
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const roles: string[] = [];
  const permissionsSet = new Set<string>();

  for (const ur of userRoles) {
    roles.push(ur.role.name);
    for (const rp of ur.role.permissions) {
      permissionsSet.add(rp.permission.name);
    }
  }

  const permissions = Array.from(permissionsSet);
  const result = { roles, permissions };

  // Cache result in Redis
  try {
    await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
  } catch {
    // Non-blocking cache write failure
  }

  return result;
}

/**
 * Invalidate user permission cache in Redis (e.g. after role assignment).
 */
export async function invalidateUserPermissionsCache(userId: string): Promise<void> {
  try {
    await redis.del(`user:permissions:${userId}`);
  } catch {
    // Non-blocking cache deletion failure
  }
}

/**
 * Middleware: Require specified permission(s).
 * If multiple permissions are passed, user must have AT LEAST ONE of them.
 * SUPER_ADMIN role automatically bypasses permission checks.
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const { roles, permissions } = await getUserRolesAndPermissions(req.user.id);
      req.userRoles = roles;
      req.userPermissions = permissions;

      // SUPER_ADMIN bypass
      if (roles.includes("SUPER_ADMIN")) {
        next();
        return;
      }

      const hasPermission = requiredPermissions.some((perm) =>
        permissions.includes(perm),
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          `Permission denied — missing required permission: ${requiredPermissions.join(" or ")}`,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware: Require specified role(s).
 * If multiple roles are passed, user must have AT LEAST ONE of them.
 */
export function requireRole(...requiredRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const { roles, permissions } = await getUserRolesAndPermissions(req.user.id);
      req.userRoles = roles;
      req.userPermissions = permissions;

      // SUPER_ADMIN bypass
      if (roles.includes("SUPER_ADMIN")) {
        next();
        return;
      }

      const hasRole = requiredRoles.some((role) => roles.includes(role));

      if (!hasRole) {
        throw new ForbiddenError(
          `Access denied — missing required role: ${requiredRoles.join(" or ")}`,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

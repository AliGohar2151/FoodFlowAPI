import { prisma } from "../../infrastructure/database/index.js";
import { logger } from "../../config/logger.js";
import { NotFoundError, ForbiddenError } from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";
import type { AuditLogQueryInput } from "./audit-logs.schema.js";
import { Prisma } from "../../generated/prisma/client.js";

export interface RecordAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogsService {
  /**
   * Record a sensitive action in the audit trail.
   * Execution is non-blocking — errors are caught and logged cleanly without breaking caller operations.
   */
  async record(params: RecordAuditParams) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: params.oldValues
            ? (params.oldValues as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          newValues: params.newValues
            ? (params.newValues as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });

      logger.info(
        `[Audit Log] Recorded action '${params.action}' on '${params.entityType}:${params.entityId}' by user '${params.userId ?? "SYSTEM"}'`,
      );
      return log;
    } catch (err) {
      logger.error(
        `[Audit Log Error] Failed to write audit record for action '${params.action}': ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Query audit logs with pagination and filters (Admin only).
   */
  async getAuditLogs(userContext: UserContext, query: AuditLogQueryInput) {
    this.ensureAdmin(userContext);

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId && { userId: query.userId }),
      ...(query.action && { action: query.action }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...((query.startDate !== undefined || query.endDate !== undefined) && {
        createdAt: {
          ...(query.startDate && { gte: query.startDate }),
          ...(query.endDate && { lte: query.endDate }),
        },
      }),
    };

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get single audit log record by ID (Admin only).
   */
  async getAuditLogById(userContext: UserContext, id: string) {
    this.ensureAdmin(userContext);

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundError("Audit log entry");
    }

    return log;
  }

  private ensureAdmin(userContext: UserContext) {
    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    if (!isAdmin) {
      throw new ForbiddenError("Only administrators can view audit logs");
    }
  }
}

export const auditLogsService = new AuditLogsService();

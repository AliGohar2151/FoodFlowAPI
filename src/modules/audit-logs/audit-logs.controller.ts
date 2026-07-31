import type { Request, Response } from "express";
import { auditLogsService } from "./audit-logs.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type { AuditLogQueryInput } from "./audit-logs.schema.js";

export class AuditLogsController {
  /**
   * GET /api/v1/audit-logs (Admin)
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const query = (req.validatedQuery as AuditLogQueryInput | undefined) ?? {
      page: 1,
      limit: 20,
    };
    const result = await auditLogsService.getAuditLogs(req.user, query);
    sendSuccess(res, result, { message: "Audit logs retrieved" });
  }

  /**
   * GET /api/v1/audit-logs/:id (Admin)
   */
  async getAuditLogById(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const log = await auditLogsService.getAuditLogById(req.user, id);
    sendSuccess(res, log, { message: "Audit log entry retrieved" });
  }
}

export const auditLogsController = new AuditLogsController();

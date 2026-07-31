import { Router, type IRouter } from "express";
import { auditLogsController } from "./audit-logs.controller.js";
import { auditLogQuerySchema } from "./audit-logs.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All audit log endpoints require authentication
router.use(asyncHandler(authenticate));

router.get(
  "/",
  validate({ query: auditLogQuerySchema }),
  asyncHandler((req, res) => auditLogsController.getAuditLogs(req, res)),
);

router.get(
  "/:id",
  asyncHandler((req, res) => auditLogsController.getAuditLogById(req, res)),
);

export default router;

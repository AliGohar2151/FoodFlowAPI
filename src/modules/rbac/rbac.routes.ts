import { Router, type IRouter } from "express";
import { rbacController } from "./rbac.controller.js";
import {
  createRoleSchema,
  updateRolePermissionsSchema,
  assignUserRoleSchema,
} from "./rbac.schema.js";
import {
  authenticate,
  requirePermission,
  validate,
  asyncHandler,
} from "../../common/middleware/index.js";

const router: IRouter = Router();

// All RBAC endpoints require valid authentication
router.use(asyncHandler(authenticate));

// Role endpoints
router.get(
  "/roles",
  requirePermission("roles.read"),
  asyncHandler((req, res) => rbacController.listRoles(req, res)),
);

router.get(
  "/roles/:id",
  requirePermission("roles.read"),
  asyncHandler((req, res) => rbacController.getRoleById(req, res)),
);

router.post(
  "/roles",
  requirePermission("roles.create"),
  validate({ body: createRoleSchema }),
  asyncHandler((req, res) => rbacController.createRole(req, res)),
);

router.put(
  "/roles/:id/permissions",
  requirePermission("roles.update"),
  validate({ body: updateRolePermissionsSchema }),
  asyncHandler((req, res) => rbacController.updateRolePermissions(req, res)),
);

// Permission endpoints
router.get(
  "/permissions",
  requirePermission("permissions.read"),
  asyncHandler((req, res) => rbacController.listPermissions(req, res)),
);

// User role management endpoints
router.post(
  "/users/:userId/roles",
  requirePermission("roles.assign"),
  validate({ body: assignUserRoleSchema }),
  asyncHandler((req, res) => rbacController.assignRoleToUser(req, res)),
);

router.delete(
  "/users/:userId/roles/:roleId",
  requirePermission("roles.assign"),
  asyncHandler((req, res) => rbacController.removeRoleFromUser(req, res)),
);

export default router;

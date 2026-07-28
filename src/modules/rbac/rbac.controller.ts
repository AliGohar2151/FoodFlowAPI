import type { Request, Response } from "express";
import { rbacService } from "./rbac.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import type {
  CreateRoleInput,
  UpdateRolePermissionsInput,
  AssignUserRoleInput,
} from "./rbac.schema.js";

export class RbacController {
  /**
   * GET /api/v1/roles
   */
  async listRoles(_req: Request, res: Response): Promise<void> {
    const roles = await rbacService.listRoles();
    sendSuccess(res, roles, { message: "Roles retrieved successfully" });
  }

  /**
   * GET /api/v1/roles/:id
   */
  async getRoleById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const role = await rbacService.getRoleById(id);
    sendSuccess(res, role, { message: "Role details retrieved" });
  }

  /**
   * POST /api/v1/roles
   */
  async createRole(req: Request, res: Response): Promise<void> {
    const input = req.validatedBody as CreateRoleInput;
    const role = await rbacService.createRole(input);
    sendSuccess(res, role, {
      message: "Role created successfully",
      statusCode: 201,
    });
  }

  /**
   * PUT /api/v1/roles/:id/permissions
   */
  async updateRolePermissions(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const input = req.validatedBody as UpdateRolePermissionsInput;
    const role = await rbacService.updateRolePermissions(id, input);
    sendSuccess(res, role, { message: "Role permissions updated" });
  }

  /**
   * GET /api/v1/permissions
   */
  async listPermissions(_req: Request, res: Response): Promise<void> {
    const permissions = await rbacService.listPermissions();
    sendSuccess(res, permissions, {
      message: "Permissions retrieved successfully",
    });
  }

  /**
   * POST /api/v1/users/:userId/roles
   */
  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    const input = req.validatedBody as AssignUserRoleInput;
    const userRole = await rbacService.assignRoleToUser(userId, input.roleId);
    sendSuccess(res, userRole, {
      message: "Role assigned to user successfully",
      statusCode: 201,
    });
  }

  /**
   * DELETE /api/v1/users/:userId/roles/:roleId
   */
  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    const { userId, roleId } = req.params as { userId: string; roleId: string };
    await rbacService.removeRoleFromUser(userId, roleId);
    sendSuccess(res, null, { message: "Role removed from user" });
  }
}

export const rbacController = new RbacController();

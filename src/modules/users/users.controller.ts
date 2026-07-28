import type { Request, Response } from "express";
import { usersService } from "./users.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import { PolicyEngine, userPolicy } from "../../common/policies/index.js";
import type {
  UpdateProfileInput,
  QueryUsersInput,
  UpdateUserStatusInput,
} from "./users.schema.js";

export class UsersController {
  /**
   * GET /api/v1/users/me
   */
  async getMyProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const profile = await usersService.getUserProfile(req.user.id);
    sendSuccess(res, profile, { message: "Profile retrieved successfully" });
  }

  /**
   * PUT /api/v1/users/me
   */
  async updateMyProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as UpdateProfileInput;
    const updated = await usersService.updateProfile(req.user.id, input);
    sendSuccess(res, updated, { message: "Profile updated successfully" });
  }

  /**
   * GET /api/v1/users
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    const query = req.validatedQuery as QueryUsersInput;
    const result = await usersService.listUsers(query);
    sendSuccess(res, result.users, {
      message: "Users retrieved successfully",
      pagination: result.pagination,
    });
  }

  /**
   * GET /api/v1/users/:id
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    // Enforce policy check (own profile or admin)
    await PolicyEngine.enforce(
      req.user,
      userPolicy,
      "read",
      { id },
      "You do not have permission to view this user profile",
    );

    const profile = await usersService.getUserProfile(id);
    sendSuccess(res, profile, { message: "User profile retrieved" });
  }

  /**
   * PUT /api/v1/users/:id
   */
  async updateUserProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };

    // Enforce policy check (own profile or admin)
    await PolicyEngine.enforce(
      req.user,
      userPolicy,
      "update",
      { id },
      "You do not have permission to update this user profile",
    );

    const input = req.validatedBody as UpdateProfileInput;
    const updated = await usersService.updateProfile(id, input);
    sendSuccess(res, updated, { message: "User profile updated" });
  }

  /**
   * PATCH /api/v1/users/:id/status
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const input = req.validatedBody as UpdateUserStatusInput;
    const updated = await usersService.updateUserStatus(id, input);
    sendSuccess(res, updated, {
      message: `User status updated to ${input.status}`,
    });
  }
}

export const usersController = new UsersController();

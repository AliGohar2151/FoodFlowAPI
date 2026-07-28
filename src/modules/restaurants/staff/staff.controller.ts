import type { Request, Response } from "express";
import { staffService } from "./staff.service.js";
import { restaurantsService } from "../restaurants.service.js";
import { sendSuccess } from "../../../common/responses/index.js";
import { PolicyEngine, restaurantPolicy } from "../../../common/policies/index.js";
import type { AddStaffInput, UpdateStaffRoleInput } from "./staff.schema.js";

export class StaffController {
  /**
   * POST /api/v1/restaurants/:restaurantId/staff
   */
  async addStaffMember(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params as { restaurantId: string };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to manage staff for this restaurant",
    );

    const input = req.validatedBody as AddStaffInput;
    const staff = await staffService.addStaffMember(restaurantId, input);
    sendSuccess(res, staff, {
      message: "Staff member added successfully",
      statusCode: 201,
    });
  }

  /**
   * GET /api/v1/restaurants/:restaurantId/staff
   */
  async getRestaurantStaff(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params as { restaurantId: string };
    const staff = await staffService.getRestaurantStaff(restaurantId);
    sendSuccess(res, staff, { message: "Restaurant staff retrieved" });
  }

  /**
   * PATCH /api/v1/restaurants/:restaurantId/staff/:userId
   */
  async updateStaffMember(req: Request, res: Response): Promise<void> {
    const { restaurantId, userId } = req.params as {
      restaurantId: string;
      userId: string;
    };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to update staff for this restaurant",
    );

    const input = req.validatedBody as UpdateStaffRoleInput;
    const updated = await staffService.updateStaffMember(restaurantId, userId, input);
    sendSuccess(res, updated, { message: "Staff member role updated" });
  }

  /**
   * DELETE /api/v1/restaurants/:restaurantId/staff/:userId
   */
  async removeStaffMember(req: Request, res: Response): Promise<void> {
    const { restaurantId, userId } = req.params as {
      restaurantId: string;
      userId: string;
    };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to remove staff from this restaurant",
    );

    const result = await staffService.removeStaffMember(restaurantId, userId);
    sendSuccess(res, result, { message: "Staff member removed" });
  }
}

export const staffController = new StaffController();

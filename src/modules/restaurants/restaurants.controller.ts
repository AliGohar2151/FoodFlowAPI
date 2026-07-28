import type { Request, Response } from "express";
import { restaurantsService } from "./restaurants.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import { PolicyEngine, restaurantPolicy } from "../../common/policies/index.js";
import type {
  CreateRestaurantInput,
  UpdateRestaurantInput,
  UpdateRestaurantStatusInput,
  QueryRestaurantsInput,
} from "./restaurants.schema.js";

export class RestaurantsController {
  /**
   * POST /api/v1/restaurants
   */
  async createRestaurant(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as CreateRestaurantInput;
    const restaurant = await restaurantsService.createRestaurant(req.user.id, input);
    sendSuccess(res, restaurant, {
      message: "Restaurant application submitted successfully",
      statusCode: 201,
    });
  }

  /**
   * GET /api/v1/restaurants
   */
  async listRestaurants(req: Request, res: Response): Promise<void> {
    const query = req.validatedQuery as QueryRestaurantsInput;
    const result = await restaurantsService.listRestaurants(query);
    sendSuccess(res, result.restaurants, {
      message: "Restaurants retrieved successfully",
      pagination: result.pagination,
    });
  }

  /**
   * GET /api/v1/restaurants/mine
   */
  async getMyRestaurants(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const restaurants = await restaurantsService.getMyRestaurants(req.user.id);
    sendSuccess(res, restaurants, { message: "Owner restaurants retrieved" });
  }

  /**
   * GET /api/v1/restaurants/slug/:slug
   */
  async getRestaurantBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = req.params as { slug: string };
    const restaurant = await restaurantsService.getRestaurantBySlug(slug);
    sendSuccess(res, restaurant, { message: "Restaurant details retrieved" });
  }

  /**
   * GET /api/v1/restaurants/:id
   */
  async getRestaurantById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const restaurant = await restaurantsService.getRestaurantById(id);
    sendSuccess(res, restaurant, { message: "Restaurant details retrieved" });
  }

  /**
   * PUT /api/v1/restaurants/:id
   */
  async updateRestaurant(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const target = await restaurantsService.getRestaurantById(id);

    // Enforce Policy: Owner or Admin
    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: target.id, ownerId: target.ownerId },
      "You do not have permission to update this restaurant",
    );

    const input = req.validatedBody as UpdateRestaurantInput;
    const updated = await restaurantsService.updateRestaurant(id, input);
    sendSuccess(res, updated, { message: "Restaurant details updated" });
  }

  /**
   * PATCH /api/v1/restaurants/:id/status
   */
  async updateRestaurantStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const input = req.validatedBody as UpdateRestaurantStatusInput;
    const updated = await restaurantsService.updateRestaurantStatus(id, input);
    sendSuccess(res, updated, {
      message: `Restaurant status updated to ${input.status}`,
    });
  }
}

export const restaurantsController = new RestaurantsController();

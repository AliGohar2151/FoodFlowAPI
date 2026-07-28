import type { Request, Response } from "express";
import { menusService } from "./menus.service.js";
import { restaurantsService } from "../restaurants/restaurants.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { PolicyEngine, restaurantPolicy } from "../../common/policies/index.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  QueryMenuItemsInput,
} from "./menus.schema.js";

export class MenusController {
  // ── Categories ─────────────────────────────────────────────────────────────

  async createCategory(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params as { restaurantId: string };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to manage categories for this restaurant",
    );

    const input = req.validatedBody as CreateCategoryInput;
    const category = await menusService.createCategory(restaurantId, input);
    sendSuccess(res, category, {
      message: "Menu category created successfully",
      statusCode: 201,
    });
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params as { restaurantId: string };
    const categories = await menusService.getCategories(restaurantId);
    sendSuccess(res, categories, { message: "Menu categories retrieved" });
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const { restaurantId, categoryId } = req.params as {
      restaurantId: string;
      categoryId: string;
    };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to update categories for this restaurant",
    );

    const input = req.validatedBody as UpdateCategoryInput;
    const updated = await menusService.updateCategory(restaurantId, categoryId, input);
    sendSuccess(res, updated, { message: "Menu category updated" });
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const { restaurantId, categoryId } = req.params as {
      restaurantId: string;
      categoryId: string;
    };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to delete categories for this restaurant",
    );

    const result = await menusService.deleteCategory(restaurantId, categoryId);
    sendSuccess(res, result, { message: "Menu category deleted" });
  }

  // ── Menu Items ─────────────────────────────────────────────────────────────

  async createMenuItem(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params as { restaurantId: string };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to add menu items to this restaurant",
    );

    const input = req.validatedBody as CreateMenuItemInput;
    const item = await menusService.createMenuItem(restaurantId, input);
    sendSuccess(res, item, {
      message: "Menu item created successfully",
      statusCode: 201,
    });
  }

  async getMenuItems(req: Request, res: Response): Promise<void> {
    const { restaurantId } = req.params as { restaurantId: string };
    const query = req.validatedQuery as QueryMenuItemsInput;
    const result = await menusService.getMenuItems(restaurantId, query);
    sendSuccess(res, result.items, {
      message: "Menu items retrieved successfully",
      pagination: result.pagination,
    });
  }

  async getMenuItemById(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params as { itemId: string };
    const item = await menusService.getMenuItemById(itemId);
    sendSuccess(res, item, { message: "Menu item details retrieved" });
  }

  async updateMenuItem(req: Request, res: Response): Promise<void> {
    const { restaurantId, itemId } = req.params as {
      restaurantId: string;
      itemId: string;
    };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to update menu items for this restaurant",
    );

    const input = req.validatedBody as UpdateMenuItemInput;
    const updated = await menusService.updateMenuItem(restaurantId, itemId, input);
    sendSuccess(res, updated, { message: "Menu item updated" });
  }

  async deleteMenuItem(req: Request, res: Response): Promise<void> {
    const { restaurantId, itemId } = req.params as {
      restaurantId: string;
      itemId: string;
    };
    const restaurant = await restaurantsService.getRestaurantById(restaurantId);

    await PolicyEngine.enforce(
      req.user,
      restaurantPolicy,
      "update",
      { id: restaurant.id, ownerId: restaurant.ownerId },
      "You do not have permission to delete menu items from this restaurant",
    );

    const result = await menusService.deleteMenuItem(restaurantId, itemId);
    sendSuccess(res, result, { message: "Menu item deleted" });
  }
}

export const menusController = new MenusController();

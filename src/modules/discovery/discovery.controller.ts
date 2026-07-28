import type { Request, Response } from "express";
import { discoveryService } from "./discovery.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import type { DiscoverySearchInput } from "./discovery.schema.js";

export class DiscoveryController {
  /**
   * GET /api/v1/discovery/search
   */
  async searchRestaurants(req: Request, res: Response): Promise<void> {
    const query = req.validatedQuery as DiscoverySearchInput;
    const result = await discoveryService.searchRestaurants(query);
    sendSuccess(res, result.restaurants, {
      message: "Restaurant discovery search results",
      pagination: result.pagination,
    });
  }

  /**
   * GET /api/v1/discovery/cuisines
   */
  async getCuisines(_req: Request, res: Response): Promise<void> {
    const cuisines = await discoveryService.getCuisines();
    sendSuccess(res, cuisines, { message: "Available cuisine types retrieved" });
  }

  /**
   * GET /api/v1/discovery/featured
   */
  async getFeaturedRestaurants(_req: Request, res: Response): Promise<void> {
    const featured = await discoveryService.getFeaturedRestaurants();
    sendSuccess(res, featured, { message: "Featured restaurants retrieved" });
  }
}

export const discoveryController = new DiscoveryController();

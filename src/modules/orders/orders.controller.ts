import type { Request, Response } from "express";
import { ordersService } from "./orders.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type { CreateOrderInput, OrderQueryInput } from "./orders.schema.js";

export class OrdersController {
  /**
   * POST /api/v1/orders
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as CreateOrderInput;
    const order = await ordersService.createOrder(req.user.id, input);
    sendSuccess(res, order, { message: "Order placed successfully", statusCode: 201 });
  }

  /**
   * GET /api/v1/orders/mine
   */
  async listUserOrders(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const query = req.validatedQuery as OrderQueryInput;
    const result = await ordersService.listUserOrders(req.user.id, query);
    sendSuccess(res, result, { message: "User orders retrieved successfully" });
  }

  /**
   * GET /api/v1/orders/restaurant/:restaurantId
   */
  async listRestaurantOrders(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { restaurantId } = req.params as { restaurantId: string };
    const query = req.validatedQuery as OrderQueryInput;
    const result = await ordersService.listRestaurantOrders(
      req.user,
      restaurantId,
      query,
    );
    sendSuccess(res, result, { message: "Restaurant orders retrieved successfully" });
  }

  /**
   * GET /api/v1/orders/:id
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const order = await ordersService.getOrderById(req.user, id);
    sendSuccess(res, order, { message: "Order details retrieved successfully" });
  }

  /**
   * POST /api/v1/orders/:id/cancel
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const order = await ordersService.cancelOrder(req.user, id);
    sendSuccess(res, order, { message: "Order cancelled successfully" });
  }
}

export const ordersController = new OrdersController();

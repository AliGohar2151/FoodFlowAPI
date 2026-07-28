import type { Request, Response } from "express";
import { cartsService } from "./carts.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type { AddToCartInput, UpdateCartItemInput } from "./carts.schema.js";

export class CartsController {
  /**
   * GET /api/v1/carts/mine
   */
  async getCart(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const cart = await cartsService.getCart(req.user.id);
    sendSuccess(res, cart, { message: "Cart retrieved successfully" });
  }

  /**
   * POST /api/v1/carts/items
   */
  async addToCart(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as AddToCartInput;
    const cart = await cartsService.addToCart(req.user.id, input);
    sendSuccess(res, cart, { message: "Item added to cart", statusCode: 201 });
  }

  /**
   * PATCH /api/v1/carts/items/:itemId
   */
  async updateCartItem(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { itemId } = req.params as { itemId: string };
    const input = req.validatedBody as UpdateCartItemInput;
    const cart = await cartsService.updateCartItem(req.user.id, itemId, input);
    sendSuccess(res, cart, { message: "Cart item updated" });
  }

  /**
   * DELETE /api/v1/carts/items/:itemId
   */
  async removeCartItem(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { itemId } = req.params as { itemId: string };
    const cart = await cartsService.removeCartItem(req.user.id, itemId);
    sendSuccess(res, cart, { message: "Item removed from cart" });
  }

  /**
   * DELETE /api/v1/carts/mine
   */
  async clearCart(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const cart = await cartsService.clearCart(req.user.id);
    sendSuccess(res, cart, { message: "Cart cleared" });
  }
}

export const cartsController = new CartsController();

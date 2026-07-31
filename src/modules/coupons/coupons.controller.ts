import type { Request, Response } from "express";
import { couponsService } from "./coupons.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type {
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
  CouponQueryInput,
} from "./coupons.schema.js";

export class CouponsController {
  /**
   * POST /api/v1/coupons
   */
  async createCoupon(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as CreateCouponInput;
    const coupon = await couponsService.createCoupon(req.user, input);
    sendSuccess(res, coupon, { message: "Coupon created successfully", statusCode: 201 });
  }

  /**
   * POST /api/v1/coupons/validate
   */
  async validateCoupon(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as ValidateCouponInput;
    const result = await couponsService.validateAndCalculateDiscount(req.user.id, input);
    sendSuccess(res, result, { message: "Coupon validated successfully" });
  }

  /**
   * PUT /api/v1/coupons/:id
   */
  async updateCoupon(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const input = req.validatedBody as UpdateCouponInput;
    const updated = await couponsService.updateCoupon(req.user, id, input);
    sendSuccess(res, updated, { message: "Coupon updated successfully" });
  }

  /**
   * PATCH /api/v1/coupons/:id/status
   */
  async toggleCouponStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const body = req.body as { isActive?: boolean } | undefined;
    const isActive = body?.isActive ?? false;
    const updated = await couponsService.toggleCouponStatus(req.user, id, isActive);
    sendSuccess(res, updated, { message: "Coupon status toggled" });
  }

  /**
   * GET /api/v1/coupons
   */
  async listCoupons(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const query = (req.validatedQuery as CouponQueryInput | undefined) ?? {
      page: 1,
      limit: 20,
    };
    const result = await couponsService.listCoupons(req.user, query);
    sendSuccess(res, result, { message: "Coupons list retrieved" });
  }
}

export const couponsController = new CouponsController();

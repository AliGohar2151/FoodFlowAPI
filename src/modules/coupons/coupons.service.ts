import { prisma } from "../../infrastructure/database/index.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";
import type {
  CreateCouponInput,
  UpdateCouponInput,
  ValidateCouponInput,
  CouponQueryInput,
} from "./coupons.schema.js";
import { DiscountType } from "../../generated/prisma/client.js";

export class CouponsService {
  /**
   * Create a new coupon (Admin for platform-wide, Owner/Admin for restaurant-specific).
   */
  async createCoupon(userContext: UserContext, input: CreateCouponInput) {
    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));

    if (input.restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: input.restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundError("Restaurant");
      }
      const isOwner = restaurant.ownerId === userContext.id;
      if (!isAdmin && !isOwner) {
        throw new ForbiddenError(
          "Only restaurant owners or admins can create restaurant coupons",
        );
      }
    } else if (!isAdmin) {
      throw new ForbiddenError("Only admins can create platform-wide coupons");
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new BadRequestError(`Coupon code '${input.code}' already exists`);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: input.code,
        description: input.description ?? null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        minOrderAmount: input.minOrderAmount,
        startDate: input.startDate ?? new Date(),
        endDate: input.endDate ?? null,
        usageLimit: input.usageLimit ?? null,
        userUsageLimit: input.userUsageLimit,
        restaurantId: input.restaurantId ?? null,
      },
    });

    return coupon;
  }

  /**
   * Validate coupon and calculate server-trusted discount amount.
   */
  async validateAndCalculateDiscount(userId: string, input: ValidateCouponInput) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: input.code },
    });

    if (!coupon?.isActive) {
      throw new BadRequestError("Invalid or inactive coupon code");
    }

    const now = new Date();
    if (now < coupon.startDate) {
      throw new BadRequestError("Coupon is not yet active");
    }
    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestError("Coupon has expired");
    }

    if (coupon.restaurantId !== null && coupon.restaurantId !== input.restaurantId) {
      throw new BadRequestError("Coupon is not valid for this restaurant");
    }

    const minAmount = Number(coupon.minOrderAmount);
    if (input.orderSubtotal < minAmount) {
      throw new BadRequestError(
        `Minimum order amount of $${minAmount.toFixed(2)} required to apply this coupon`,
      );
    }

    if (coupon.usageLimit && coupon.currentUsageCount >= coupon.usageLimit) {
      throw new BadRequestError("Coupon overall redemption limit reached");
    }

    const userUsagesCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    if (userUsagesCount >= coupon.userUsageLimit) {
      throw new BadRequestError("You have reached the redemption limit for this coupon");
    }

    const discountVal = Number(coupon.discountValue);
    let rawDiscount =
      coupon.discountType === DiscountType.PERCENTAGE
        ? (input.orderSubtotal * discountVal) / 100
        : Math.min(discountVal, input.orderSubtotal);

    if (coupon.discountType === DiscountType.PERCENTAGE && coupon.maxDiscountAmount) {
      rawDiscount = Math.min(rawDiscount, Number(coupon.maxDiscountAmount));
    }

    // Round to 2 decimal places
    const calculatedDiscount = Math.round(rawDiscount * 100) / 100;
    const finalSubtotal = Math.max(0, input.orderSubtotal - calculatedDiscount);

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: discountVal,
      calculatedDiscount,
      newSubtotal: Math.round(finalSubtotal * 100) / 100,
    };
  }

  /**
   * Update coupon details.
   */
  async updateCoupon(
    userContext: UserContext,
    couponId: string,
    input: UpdateCouponInput,
  ) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: { restaurant: true },
    });

    if (!coupon) {
      throw new NotFoundError("Coupon");
    }

    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isOwner = coupon.restaurant?.ownerId === userContext.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError("You are not authorized to update this coupon");
    }

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(input.description !== undefined && { description: input.description }),
        ...(input.discountType !== undefined && { discountType: input.discountType }),
        ...(input.discountValue !== undefined && { discountValue: input.discountValue }),
        ...(input.maxDiscountAmount !== undefined && {
          maxDiscountAmount: input.maxDiscountAmount,
        }),
        ...(input.minOrderAmount !== undefined && {
          minOrderAmount: input.minOrderAmount,
        }),
        ...(input.startDate !== undefined && { startDate: input.startDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
        ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
        ...(input.userUsageLimit !== undefined && {
          userUsageLimit: input.userUsageLimit,
        }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return updated;
  }

  /**
   * Toggle coupon active state.
   */
  async toggleCouponStatus(
    userContext: UserContext,
    couponId: string,
    isActive: boolean,
  ) {
    return this.updateCoupon(userContext, couponId, { isActive });
  }

  /**
   * List coupons with optional filtering.
   */
  async listCoupons(_userContext: UserContext, query: CouponQueryInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.restaurantId && { restaurantId: query.restaurantId }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      coupons,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}

export const couponsService = new CouponsService();

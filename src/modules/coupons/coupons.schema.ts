import { z } from "zod";
import { DiscountType } from "../../generated/prisma/client.js";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(30, "Coupon code cannot exceed 30 characters")
    .transform((val) => val.toUpperCase().trim()),
  description: z.string().max(300).optional(),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.PERCENTAGE),
  discountValue: z.number().positive("Discount value must be positive"),
  maxDiscountAmount: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).default(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  usageLimit: z.number().int().positive().optional(),
  userUsageLimit: z.number().int().positive().default(1),
  restaurantId: z.string().cuid({ message: "Invalid restaurant ID" }).optional(),
});

export const updateCouponSchema = z.object({
  description: z.string().max(300).optional(),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountValue: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  usageLimit: z.number().int().positive().optional(),
  userUsageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().transform((val) => val.toUpperCase().trim()),
  orderSubtotal: z.number().positive("Order subtotal must be positive"),
  restaurantId: z.string().cuid().optional(),
});

export const couponQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  restaurantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CouponQueryInput = z.infer<typeof couponQuerySchema>;

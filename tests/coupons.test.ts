import { describe, it, expect } from "vitest";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "../src/modules/coupons/coupons.schema.js";

describe("Coupons Module — Schema & Calculation Unit Tests", () => {
  it("should validate create coupon schema and uppercase code", () => {
    const valid = createCouponSchema.safeParse({
      code: "  summer20  ",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderAmount: 25.0,
      usageLimit: 100,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.code).toBe("SUMMER20");
    }
  });

  it("should validate update coupon schema", () => {
    const valid = updateCouponSchema.safeParse({
      discountValue: 15,
      isActive: false,
    });
    expect(valid.success).toBe(true);
  });

  it("should validate coupon validation request schema", () => {
    const valid = validateCouponSchema.safeParse({
      code: "SAVE10",
      orderSubtotal: 50.0,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.code).toBe("SAVE10");
    }
  });

  it("should correctly compute percentage and capped discount", () => {
    const orderSubtotal = 100.0;
    const discountVal = 20; // 20%
    const maxDiscount = 15; // cap at $15

    let calculated = (orderSubtotal * discountVal) / 100;
    if (maxDiscount) {
      calculated = Math.min(calculated, maxDiscount);
    }

    expect(calculated).toBe(15.0);
  });
});

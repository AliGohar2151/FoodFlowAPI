import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  orderQuerySchema,
} from "../src/modules/orders/orders.schema.js";

describe("Orders Module — Schema Validation", () => {
  it("should validate valid create order input", () => {
    const valid = createOrderSchema.safeParse({
      addressId: "cjld2cjxh0000qzrmn831i7rn",
      specialInstructions: "Ring doorbell twice",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject invalid addressId format", () => {
    const invalid = createOrderSchema.safeParse({
      addressId: "not-a-cuid",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate order query schema defaults and filters", () => {
    const validDefault = orderQuerySchema.safeParse({});
    expect(validDefault.success).toBe(true);
    if (validDefault.success) {
      expect(validDefault.data.page).toBe(1);
      expect(validDefault.data.limit).toBe(20);
    }

    const validStatus = orderQuerySchema.safeParse({
      status: "PENDING",
      page: 2,
      limit: 10,
    });
    expect(validStatus.success).toBe(true);
  });
});

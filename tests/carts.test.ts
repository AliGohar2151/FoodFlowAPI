import { describe, it, expect } from "vitest";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../src/modules/carts/carts.schema.js";

describe("Carts Module — Schema Validation", () => {
  it("should validate valid add to cart input", () => {
    const valid = addToCartSchema.safeParse({
      menuItemId: "cjld2cjxh0000qzrmn831i7rn",
      quantity: 2,
      specialInstructions: "Extra sauce please",
      clearExisting: false,
    });
    expect(valid.success).toBe(true);
  });

  it("should reject negative or zero add to cart quantity", () => {
    const invalidZero = addToCartSchema.safeParse({
      menuItemId: "cjld2cjxh0000qzrmn831i7rn",
      quantity: 0,
    });
    expect(invalidZero.success).toBe(false);
  });

  it("should validate update cart item schema", () => {
    const valid = updateCartItemSchema.safeParse({
      quantity: 3,
      specialInstructions: "No onions",
    });
    expect(valid.success).toBe(true);

    const validZeroRemoval = updateCartItemSchema.safeParse({
      quantity: 0,
    });
    expect(validZeroRemoval.success).toBe(true);
  });
});

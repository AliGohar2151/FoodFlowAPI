import { describe, it, expect } from "vitest";
import {
  createCategorySchema,
  createMenuItemSchema,
  queryMenuItemsSchema,
} from "../src/modules/menus/menus.schema.js";

describe("Menus Module — Schema Validation", () => {
  it("should validate valid category creation schema", () => {
    const valid = createCategorySchema.safeParse({
      name: "Starters & Appetizers",
      description: "Delicious starters to begin your meal",
      displayOrder: 1,
      isActive: true,
    });
    expect(valid.success).toBe(true);
  });

  it("should validate valid menu item creation schema", () => {
    const valid = createMenuItemSchema.safeParse({
      categoryId: "cjld2cjxh0000qzrmn831i7rn",
      name: "Margherita Pizza",
      description: "Classic pizza with fresh mozzarella and basil",
      price: 12.99,
      isVegetarian: true,
      isSpicy: false,
    });
    expect(valid.success).toBe(true);
  });

  it("should reject negative menu item price", () => {
    const invalid = createMenuItemSchema.safeParse({
      categoryId: "cjld2cjxh0000qzrmn831i7rn",
      name: "Free Pizza",
      price: -5,
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate menu item query input", () => {
    const valid = queryMenuItemsSchema.safeParse({
      page: 1,
      limit: 20,
      search: "pizza",
      isAvailable: true,
    });
    expect(valid.success).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  createRestaurantSchema,
  updateRestaurantStatusSchema,
  queryRestaurantsSchema,
} from "../src/modules/restaurants/restaurants.schema.js";

describe("Restaurants Module — Schema Validation", () => {
  it("should validate restaurant creation schema", () => {
    const valid = createRestaurantSchema.safeParse({
      name: "La Trattoria Italiana",
      description: "Authentic wood-fired pizza and pasta",
      cuisineTypes: ["Italian", "Pizza"],
      minOrderAmount: 15.5,
      deliveryFee: 2.99,
      estimatedDeliveryTimeMinutes: 25,
    });
    expect(valid.success).toBe(true);

    const invalidNoCuisine = createRestaurantSchema.safeParse({
      name: "Test",
      cuisineTypes: [],
    });
    expect(invalidNoCuisine.success).toBe(false);
  });

  it("should validate restaurant status update schema", () => {
    const valid = updateRestaurantStatusSchema.safeParse({
      status: "ACTIVE",
    });
    expect(valid.success).toBe(true);

    const rejectedWithReason = updateRestaurantStatusSchema.safeParse({
      status: "REJECTED",
      rejectionReason: "Incomplete food safety documentation",
    });
    expect(rejectedWithReason.success).toBe(true);
  });

  it("should validate restaurant discovery search query", () => {
    const valid = queryRestaurantsSchema.safeParse({
      page: 1,
      limit: 10,
      search: "pizza",
      cuisine: "Italian",
      status: "ACTIVE",
    });
    expect(valid.success).toBe(true);
  });
});

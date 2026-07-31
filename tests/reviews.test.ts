import { describe, it, expect } from "vitest";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../src/modules/reviews/reviews.schema.js";

describe("Reviews Module — Schema Unit Tests", () => {
  it("should validate create review schema", () => {
    const valid = createReviewSchema.safeParse({
      orderId: "cjld2cjxh0000qzrmn831i7rn",
      rating: 5,
      comment: "Delicious food, delivered hot!",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject rating less than 1 or greater than 5 stars", () => {
    const tooLow = createReviewSchema.safeParse({
      orderId: "cjld2cjxh0000qzrmn831i7rn",
      rating: 0,
    });
    expect(tooLow.success).toBe(false);

    const tooHigh = createReviewSchema.safeParse({
      orderId: "cjld2cjxh0000qzrmn831i7rn",
      rating: 6,
    });
    expect(tooHigh.success).toBe(false);
  });

  it("should validate update review schema", () => {
    const valid = updateReviewSchema.safeParse({
      rating: 4,
      comment: "Updated comment: Food was good.",
    });
    expect(valid.success).toBe(true);
  });
});

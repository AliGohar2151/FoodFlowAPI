import { describe, it, expect } from "vitest";
import {
  updateRiderProfileSchema,
  assignDeliverySchema,
  updateDeliveryStatusSchema,
} from "../src/modules/deliveries/deliveries.schema.js";

describe("Deliveries Module — Schema Unit Tests", () => {
  it("should validate update rider profile schema", () => {
    const valid = updateRiderProfileSchema.safeParse({
      isAvailable: true,
      vehicleType: "MOTORCYCLE",
      licensePlate: "ABC-1234",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate assign delivery schema", () => {
    const valid = assignDeliverySchema.safeParse({
      orderId: "cjld2cjxh0000qzrmn831i7rn",
      riderId: "cjld2cjxh0001qzrmn831i7rn",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate update delivery status schema", () => {
    const valid = updateDeliveryStatusSchema.safeParse({
      status: "PICKED_UP",
      notes: "Food picked up from restaurant counter",
    });
    expect(valid.success).toBe(true);

    const invalid = updateDeliveryStatusSchema.safeParse({
      status: "INVALID_STATUS",
    });
    expect(invalid.success).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../src/modules/addresses/addresses.schema.js";

describe("Addresses Module — Schema Validation", () => {
  it("should validate valid delivery address input", () => {
    const valid = createAddressSchema.safeParse({
      title: "Home",
      streetAddress: "123 Main Street",
      apartment: "Apt 4B",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "US",
      latitude: 37.7749,
      longitude: -122.4194,
      deliveryInstructions: "Leave at front desk",
      isDefault: true,
    });
    expect(valid.success).toBe(true);
  });

  it("should reject invalid latitude or longitude", () => {
    const invalidLat = createAddressSchema.safeParse({
      title: "Invalid",
      streetAddress: "123 Main Street",
      city: "San Francisco",
      postalCode: "94105",
      latitude: 100, // max 90
    });
    expect(invalidLat.success).toBe(false);
  });

  it("should validate update address schema", () => {
    const valid = updateAddressSchema.safeParse({
      apartment: "Suite 100",
      deliveryInstructions: "Ring bell twice",
    });
    expect(valid.success).toBe(true);
  });
});

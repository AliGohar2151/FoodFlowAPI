import { describe, it, expect } from "vitest";
import {
  addStaffSchema,
  updateStaffRoleSchema,
} from "../src/modules/restaurants/staff/staff.schema.js";

describe("Restaurant Staff Module — Schema Validation", () => {
  it("should validate valid add staff member input", () => {
    const valid = addStaffSchema.safeParse({
      userId: "cjld2cjxh0000qzrmn831i7rn",
      role: "MANAGER",
      isPrimary: true,
    });
    expect(valid.success).toBe(true);
  });

  it("should reject invalid staff role", () => {
    const invalid = addStaffSchema.safeParse({
      userId: "cjld2cjxh0000qzrmn831i7rn",
      role: "SUPER_ADMIN",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate update staff role input", () => {
    const valid = updateStaffRoleSchema.safeParse({
      role: "KITCHEN_STAFF",
    });
    expect(valid.success).toBe(true);
  });
});

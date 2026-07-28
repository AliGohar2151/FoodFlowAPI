import { describe, it, expect } from "vitest";
import { createRoleSchema } from "../src/modules/rbac/rbac.schema.js";

describe("RBAC Module — Schema & Logic", () => {
  it("should validate create role input", () => {
    const valid = createRoleSchema.safeParse({
      name: "RESTAURANT_MANAGER",
      description: "Manages a restaurant branch",
    });
    expect(valid.success).toBe(true);

    const invalidName = createRoleSchema.safeParse({
      name: "invalid-lowercase-role",
    });
    expect(invalidName.success).toBe(false);
  });
});

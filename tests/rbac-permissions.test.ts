import { describe, it, expect } from "vitest";
import {
  createRoleSchema,
  updateRolePermissionsSchema,
  assignUserRoleSchema,
} from "../src/modules/rbac/rbac.schema.js";

/**
 * RBAC — Permission System Unit Tests
 *
 * Tests the Role-Based Access Control schema validation and permission logic.
 * RBAC is the primary authorization mechanism — every test here protects
 * against misconfigurations that could grant or deny access incorrectly.
 *
 * See Memory.md §9 — RBAC Memory
 */

describe("RBAC — createRoleSchema", () => {
  it("should accept valid uppercase role names", () => {
    const roles = [
      "SUPER_ADMIN",
      "ADMIN",
      "RESTAURANT_OWNER",
      "RESTAURANT_MANAGER",
      "DELIVERY_RIDER",
      "CUSTOMER",
      "SUPPORT_AGENT",
    ];

    for (const name of roles) {
      const result = createRoleSchema.safeParse({ name });
      expect(result.success, `Expected '${name}' to be valid`).toBe(true);
    }
  });

  it("should reject lowercase role names", () => {
    const invalid = createRoleSchema.safeParse({ name: "admin" });
    expect(invalid.success).toBe(false);
  });

  it("should reject mixed-case role names", () => {
    const invalid = createRoleSchema.safeParse({ name: "Restaurant_Owner" });
    expect(invalid.success).toBe(false);
  });

  it("should reject role names with numbers", () => {
    const invalid = createRoleSchema.safeParse({ name: "ADMIN2" });
    expect(invalid.success).toBe(false);
  });

  it("should reject role names with hyphens", () => {
    const invalid = createRoleSchema.safeParse({ name: "SUPER-ADMIN" });
    expect(invalid.success).toBe(false);
  });

  it("should reject role name shorter than 2 characters", () => {
    const invalid = createRoleSchema.safeParse({ name: "A" });
    expect(invalid.success).toBe(false);
  });

  it("should accept optional description", () => {
    const result = createRoleSchema.safeParse({
      name: "KITCHEN_STAFF",
      description: "Kitchen preparation team",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Kitchen preparation team");
    }
  });

  it("should accept optional permissionIds array", () => {
    const result = createRoleSchema.safeParse({
      name: "DISPATCHER",
      permissionIds: ["perm-001", "perm-002"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permissionIds).toHaveLength(2);
    }
  });

  it("should accept empty permissionIds (role with no permissions initially)", () => {
    const result = createRoleSchema.safeParse({
      name: "VIEWER",
      permissionIds: [],
    });
    expect(result.success).toBe(true);
  });

  it("should reject description exceeding 255 characters", () => {
    const result = createRoleSchema.safeParse({
      name: "ADMIN",
      description: "A".repeat(256),
    });
    expect(result.success).toBe(false);
  });
});

describe("RBAC — updateRolePermissionsSchema", () => {
  it("should accept an array of permission IDs", () => {
    const result = updateRolePermissionsSchema.safeParse({
      permissionIds: ["perm-aaa", "perm-bbb"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty permissions array (revoke all)", () => {
    const result = updateRolePermissionsSchema.safeParse({
      permissionIds: [],
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing permissionIds field", () => {
    const result = updateRolePermissionsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject non-array value for permissionIds", () => {
    const result = updateRolePermissionsSchema.safeParse({
      permissionIds: "perm-001",
    });
    expect(result.success).toBe(false);
  });
});

describe("RBAC — assignUserRoleSchema", () => {
  it("should accept a valid role ID", () => {
    const result = assignUserRoleSchema.safeParse({ roleId: "role-123" });
    expect(result.success).toBe(true);
  });

  it("should reject empty roleId", () => {
    const result = assignUserRoleSchema.safeParse({ roleId: "" });
    expect(result.success).toBe(false);
  });

  it("should reject missing roleId", () => {
    const result = assignUserRoleSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("RBAC — Permission naming convention", () => {
  /**
   * Permissions use the format: resource.action
   * Examples: restaurants.read, orders.cancel, payments.refund
   */
  const validPermissionNames = [
    "users.read",
    "users.update",
    "users.suspend",
    "roles.read",
    "roles.create",
    "roles.update",
    "roles.delete",
    "permissions.read",
    "restaurants.create",
    "restaurants.read",
    "restaurants.update",
    "restaurants.delete",
    "restaurants.approve",
    "restaurants.suspend",
    "menus.create",
    "menus.read",
    "menus.update",
    "menus.delete",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "payments.read",
    "payments.refund",
  ];

  it("should have all expected permission names following resource.action convention", () => {
    for (const permission of validPermissionNames) {
      const parts = permission.split(".");
      expect(parts, `'${permission}' should have exactly 2 parts`).toHaveLength(2);
      expect(parts[0], `'${permission}' resource part should not be empty`).toBeTruthy();
      expect(parts[1], `'${permission}' action part should not be empty`).toBeTruthy();
    }
  });

  it("should have unique permission names (no duplicates)", () => {
    const uniqueNames = new Set(validPermissionNames);
    expect(uniqueNames.size).toBe(validPermissionNames.length);
  });
});

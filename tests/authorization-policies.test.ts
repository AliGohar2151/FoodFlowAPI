import { describe, it, expect } from "vitest";
import {
  PolicyEngine,
  orderPolicy,
  restaurantPolicy,
  userPolicy,
  type UserContext,
} from "../src/common/policies/index.js";

/**
 * Authorization — Resource Policy Deep Tests
 *
 * Tests the three core policies (UserPolicy, RestaurantPolicy, OrderPolicy)
 * for correct ownership-based access control, admin bypass, and edge cases.
 *
 * See Memory.md §10 — Vendor Isolation Memory
 */

// --- Shared test user contexts ---

const makeUser = (
  id: string,
  roles: string[],
  permissions: string[] = [],
): UserContext => ({
  id,
  roles,
  permissions,
});

const customer = makeUser("customer-001", ["CUSTOMER"], ["orders.read", "orders.cancel"]);
const otherCustomer = makeUser("customer-002", ["CUSTOMER"], []);
const admin = makeUser("admin-001", ["ADMIN"]);
const superAdmin = makeUser("super-001", ["SUPER_ADMIN"]);
const restaurantOwner = makeUser(
  "owner-001",
  ["RESTAURANT_OWNER"],
  ["restaurants.update", "menus.create"],
);
const restaurantManager = makeUser("manager-001", ["RESTAURANT_MANAGER"]);
const rider = makeUser("rider-001", ["DELIVERY_RIDER"]);

// --- Restaurant resources ---

const restaurantOwnedByA = {
  id: "rest-A",
  ownerId: "owner-001",
  staffUserIds: ["manager-001"],
};

const restaurantOwnedByB = {
  id: "rest-B",
  ownerId: "owner-B-999",
  staffUserIds: [],
};

// --- Order resources ---

const customerOrder = {
  id: "order-001",
  customerId: "customer-001",
  restaurantId: "rest-A",
  restaurantOwnerId: "owner-001",
  riderId: "rider-001",
};

describe("UserPolicy — Access Control", () => {
  it("should allow user to read their own profile", async () => {
    const allowed = await PolicyEngine.can(customer, userPolicy, "read", {
      id: "customer-001",
    });
    expect(allowed).toBe(true);
  });

  it("should allow user to update their own profile", async () => {
    const allowed = await PolicyEngine.can(customer, userPolicy, "update", {
      id: "customer-001",
    });
    expect(allowed).toBe(true);
  });

  it("should deny user from reading another user's profile", async () => {
    const allowed = await PolicyEngine.can(customer, userPolicy, "read", {
      id: "customer-002",
    });
    expect(allowed).toBe(false);
  });

  it("should deny user from updating another user's profile", async () => {
    const allowed = await PolicyEngine.can(customer, userPolicy, "update", {
      id: "customer-002",
    });
    expect(allowed).toBe(false);
  });

  it("should deny non-admin from suspending any user", async () => {
    const allowed = await PolicyEngine.can(customer, userPolicy, "suspend", {
      id: "customer-002",
    });
    expect(allowed).toBe(false);
  });

  it("should deny non-admin from deleting any user", async () => {
    const allowed = await PolicyEngine.can(customer, userPolicy, "delete", {
      id: "customer-002",
    });
    expect(allowed).toBe(false);
  });

  it("should allow ADMIN to read any user profile", async () => {
    const allowed = await PolicyEngine.can(admin, userPolicy, "read", {
      id: "customer-001",
    });
    expect(allowed).toBe(true);
  });

  it("should allow SUPER_ADMIN to suspend any user", async () => {
    const allowed = await PolicyEngine.can(superAdmin, userPolicy, "suspend", {
      id: "customer-001",
    });
    expect(allowed).toBe(true);
  });

  it("should return false when no resource is provided", async () => {
    const allowed = await PolicyEngine.can(customer, userPolicy, "read", undefined);
    expect(allowed).toBe(false);
  });
});

describe("RestaurantPolicy — Vendor Isolation", () => {
  it("should allow owner to update their own restaurant", async () => {
    const allowed = await PolicyEngine.can(
      restaurantOwner,
      restaurantPolicy,
      "update",
      restaurantOwnedByA,
    );
    expect(allowed).toBe(true);
  });

  it("should deny owner from updating another restaurant", async () => {
    const allowed = await PolicyEngine.can(
      restaurantOwner,
      restaurantPolicy,
      "update",
      restaurantOwnedByB,
    );
    expect(allowed).toBe(false);
  });

  it("should allow staff member to manage menu of their restaurant", async () => {
    const allowed = await PolicyEngine.can(
      restaurantManager,
      restaurantPolicy,
      "manage_menu",
      restaurantOwnedByA,
    );
    expect(allowed).toBe(true);
  });

  it("should deny staff member from managing another restaurant's menu", async () => {
    const allowed = await PolicyEngine.can(
      restaurantManager,
      restaurantPolicy,
      "manage_menu",
      restaurantOwnedByB,
    );
    expect(allowed).toBe(false);
  });

  it("should deny non-owner from deleting a restaurant", async () => {
    const allowed = await PolicyEngine.can(
      restaurantManager, // staff, not owner
      restaurantPolicy,
      "delete",
      restaurantOwnedByA,
    );
    expect(allowed).toBe(false);
  });

  it("should allow owner to delete their own restaurant", async () => {
    const allowed = await PolicyEngine.can(
      restaurantOwner,
      restaurantPolicy,
      "delete",
      restaurantOwnedByA,
    );
    expect(allowed).toBe(true);
  });

  it("should allow any user to read restaurants (public browsing)", async () => {
    const allowedCustomer = await PolicyEngine.can(customer, restaurantPolicy, "read");
    const allowedRider = await PolicyEngine.can(rider, restaurantPolicy, "read");
    expect(allowedCustomer).toBe(true);
    expect(allowedRider).toBe(true);
  });

  it("should allow Admin to manage any restaurant", async () => {
    const allowed = await PolicyEngine.can(
      admin,
      restaurantPolicy,
      "update",
      restaurantOwnedByB,
    );
    expect(allowed).toBe(true);
  });

  it("should deny customer from updating restaurants", async () => {
    const allowed = await PolicyEngine.can(
      customer,
      restaurantPolicy,
      "update",
      restaurantOwnedByA,
    );
    expect(allowed).toBe(false);
  });
});

describe("OrderPolicy — Ownership & Rider Access", () => {
  it("should allow customer to read their own order", async () => {
    const allowed = await PolicyEngine.can(customer, orderPolicy, "read", customerOrder);
    expect(allowed).toBe(true);
  });

  it("should allow restaurant owner to read their restaurant's order", async () => {
    const allowed = await PolicyEngine.can(
      restaurantOwner,
      orderPolicy,
      "read",
      customerOrder,
    );
    expect(allowed).toBe(true);
  });

  it("should allow assigned rider to read the order", async () => {
    const allowed = await PolicyEngine.can(rider, orderPolicy, "read", customerOrder);
    expect(allowed).toBe(true);
  });

  it("should deny unrelated customer from reading another customer's order", async () => {
    const allowed = await PolicyEngine.can(
      otherCustomer,
      orderPolicy,
      "read",
      customerOrder,
    );
    expect(allowed).toBe(false);
  });

  it("should allow customer to cancel their own order", async () => {
    const allowed = await PolicyEngine.can(
      customer,
      orderPolicy,
      "cancel",
      customerOrder,
    );
    expect(allowed).toBe(true);
  });

  it("should deny unrelated customer from cancelling an order", async () => {
    const allowed = await PolicyEngine.can(
      otherCustomer,
      orderPolicy,
      "cancel",
      customerOrder,
    );
    expect(allowed).toBe(false);
  });

  it("should allow restaurant owner to cancel their order", async () => {
    const allowed = await PolicyEngine.can(
      restaurantOwner,
      orderPolicy,
      "cancel",
      customerOrder,
    );
    expect(allowed).toBe(true);
  });

  it("should deny rider from cancelling an order", async () => {
    const allowed = await PolicyEngine.can(rider, orderPolicy, "cancel", customerOrder);
    expect(allowed).toBe(false);
  });

  it("should allow owner to update_status of their order", async () => {
    const allowed = await PolicyEngine.can(
      restaurantOwner,
      orderPolicy,
      "update_status",
      customerOrder,
    );
    expect(allowed).toBe(true);
  });

  it("should deny customer from updating order status directly", async () => {
    const allowed = await PolicyEngine.can(
      customer,
      orderPolicy,
      "update_status",
      customerOrder,
    );
    expect(allowed).toBe(false);
  });

  it("should deny unassigned rider from updating order status", async () => {
    const unassignedRider = makeUser("rider-unassigned-777", ["DELIVERY_RIDER"]);
    const allowed = await PolicyEngine.can(
      unassignedRider,
      orderPolicy,
      "update_status",
      customerOrder,
    );
    expect(allowed).toBe(false);
  });

  it("should allow ADMIN to perform any action on any order", async () => {
    const adminCanRead = await PolicyEngine.can(
      admin,
      orderPolicy,
      "read",
      customerOrder,
    );
    const adminCanCancel = await PolicyEngine.can(
      admin,
      orderPolicy,
      "cancel",
      customerOrder,
    );
    const adminCanUpdate = await PolicyEngine.can(
      admin,
      orderPolicy,
      "update_status",
      customerOrder,
    );
    expect(adminCanRead).toBe(true);
    expect(adminCanCancel).toBe(true);
    expect(adminCanUpdate).toBe(true);
  });

  it("should return false when no resource is provided", async () => {
    const allowed = await PolicyEngine.can(customer, orderPolicy, "read", undefined);
    expect(allowed).toBe(false);
  });
});

describe("PolicyEngine — enforcePolicy throws on denial", () => {
  it("should throw ForbiddenError when customer tries to modify another user", async () => {
    await expect(
      PolicyEngine.enforce(customer, userPolicy, "update", { id: "other-user-999" }),
    ).rejects.toThrow();
  });

  it("should throw UnauthorizedError when no user context is provided", async () => {
    await expect(
      PolicyEngine.enforce(undefined, userPolicy, "read", { id: "some-user" }),
    ).rejects.toThrow("Authentication required");
  });

  it("should resolve without throwing when policy is satisfied", async () => {
    await expect(
      PolicyEngine.enforce(customer, userPolicy, "read", { id: "customer-001" }),
    ).resolves.toBeUndefined();
  });
});

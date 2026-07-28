import { describe, it, expect } from "vitest";
import {
  PolicyEngine,
  userPolicy,
  restaurantPolicy,
  orderPolicy,
  type UserContext,
} from "../src/common/policies/index.js";

describe("Policy Engine — Resource Ownership & Authorization", () => {
  const customerUser: UserContext = {
    id: "user-customer-123",
    email: "customer@example.com",
    phone: null,
    firstName: "John",
    lastName: "Doe",
    avatarUrl: null,
    status: "ACTIVE",
    emailVerifiedAt: null,
    createdAt: new Date(),
    roles: ["CUSTOMER"],
    permissions: ["orders.read", "orders.cancel"],
  };

  const adminUser: UserContext = {
    id: "user-admin-999",
    email: "admin@example.com",
    phone: null,
    firstName: "Admin",
    lastName: "User",
    avatarUrl: null,
    status: "ACTIVE",
    emailVerifiedAt: null,
    createdAt: new Date(),
    roles: ["SUPER_ADMIN"],
    permissions: [],
  };

  const restaurantOwnerUser: UserContext = {
    id: "user-owner-456",
    email: "owner@restaurant.com",
    phone: null,
    firstName: "Jane",
    lastName: "Smith",
    avatarUrl: null,
    status: "ACTIVE",
    emailVerifiedAt: null,
    createdAt: new Date(),
    roles: ["RESTAURANT_OWNER"],
    permissions: ["restaurants.update"],
  };

  describe("UserPolicy", () => {
    it("should allow users to read and update their own profile", async () => {
      const allowed = await PolicyEngine.can(customerUser, userPolicy, "read", {
        id: "user-customer-123",
      });
      expect(allowed).toBe(true);
    });

    it("should deny users from modifying another user's profile", async () => {
      const allowed = await PolicyEngine.can(customerUser, userPolicy, "update", {
        id: "other-user-999",
      });
      expect(allowed).toBe(false);
    });

    it("should allow super admin to modify any user profile", async () => {
      const allowed = await PolicyEngine.can(adminUser, userPolicy, "update", {
        id: "user-customer-123",
      });
      expect(allowed).toBe(true);
    });
  });

  describe("RestaurantPolicy", () => {
    const restaurant = {
      id: "rest-1",
      ownerId: "user-owner-456",
    };

    it("should allow restaurant owner to manage their restaurant", async () => {
      const allowed = await PolicyEngine.can(
        restaurantOwnerUser,
        restaurantPolicy,
        "update",
        restaurant,
      );
      expect(allowed).toBe(true);
    });

    it("should deny non-owner customer from updating restaurant", async () => {
      const allowed = await PolicyEngine.can(
        customerUser,
        restaurantPolicy,
        "update",
        restaurant,
      );
      expect(allowed).toBe(false);
    });
  });

  describe("OrderPolicy", () => {
    const order = {
      id: "order-100",
      customerId: "user-customer-123",
      restaurantId: "rest-1",
      restaurantOwnerId: "user-owner-456",
    };

    it("should allow customer to view their own order", async () => {
      const allowed = await PolicyEngine.can(customerUser, orderPolicy, "read", order);
      expect(allowed).toBe(true);
    });

    it("should allow customer to cancel their own order", async () => {
      const allowed = await PolicyEngine.can(customerUser, orderPolicy, "cancel", order);
      expect(allowed).toBe(true);
    });

    it("should deny unrelated user from viewing an order", async () => {
      const otherUser: UserContext = {
        ...customerUser,
        id: "stranger-777",
      };
      const allowed = await PolicyEngine.can(otherUser, orderPolicy, "read", order);
      expect(allowed).toBe(false);
    });
  });
});

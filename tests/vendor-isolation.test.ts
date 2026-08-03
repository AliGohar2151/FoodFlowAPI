import { describe, it, expect } from "vitest";
import {
  OrderStateMachine,
  ALLOWED_TRANSITIONS,
} from "../src/modules/orders/order-state-machine.js";
import { OrderStatus } from "../src/generated/prisma/client.js";
import type { UserContext } from "../src/common/policies/policy.types.js";

/**
 * Vendor Isolation Tests
 *
 * Critical business requirement: A restaurant owner must NEVER be able to
 * access or modify another restaurant's resources.
 *
 * See Memory.md §10 — Vendor Isolation Memory
 */

describe("Vendor Isolation — Order State Machine", () => {
  const restaurantAOwnerId = "owner-restaurant-A";
  const restaurantBOwnerId = "owner-restaurant-B";

  const restaurantAOrder = {
    id: "order-A-100",
    userId: "customer-111",
    restaurantId: "restaurant-A",
    restaurantOwnerId: restaurantAOwnerId,
    riderId: null,
    status: OrderStatus.PENDING,
  };

  const ownerA: UserContext = {
    id: restaurantAOwnerId,
    roles: ["RESTAURANT_OWNER"],
  };

  const ownerB: UserContext = {
    id: restaurantBOwnerId,
    roles: ["RESTAURANT_OWNER"],
  };

  it("should allow Restaurant A owner to confirm Restaurant A order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        ownerA,
        restaurantAOrder,
      ),
    ).not.toThrow();
  });

  it("should prevent Restaurant B owner from confirming Restaurant A order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        ownerB,
        restaurantAOrder,
      ),
    ).toThrow();
  });

  it("should prevent Restaurant B owner from cancelling Restaurant A order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        ownerB,
        restaurantAOrder,
      ),
    ).toThrow();
  });

  it("should prevent a non-rider role (customer) from advancing delivery-phase transitions", () => {
    const customerUser: UserContext = {
      id: "customer-trying-pickup",
      roles: ["CUSTOMER"],
    };

    // A customer must not be able to mark an order as PICKED_UP
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.ASSIGNED,
        OrderStatus.PICKED_UP,
        customerUser,
        {
          ...restaurantAOrder,
          status: OrderStatus.ASSIGNED,
          riderId: "rider-different-111",
        },
      ),
    ).toThrow();
  });

  it("should allow the assigned rider to advance the order delivery status", () => {
    const assignedRider: UserContext = {
      id: "rider-assigned-777",
      roles: ["DELIVERY_RIDER"],
    };

    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.ASSIGNED,
        OrderStatus.PICKED_UP,
        assignedRider,
        {
          ...restaurantAOrder,
          status: OrderStatus.ASSIGNED,
          riderId: "rider-assigned-777",
        },
      ),
    ).not.toThrow();
  });

  it("should allow Admin to manage any order regardless of restaurant", () => {
    const superAdmin: UserContext = {
      id: "admin-global-001",
      roles: ["SUPER_ADMIN"],
    };

    // Admin can confirm Restaurant A order even though they don't own it
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        superAdmin,
        restaurantAOrder,
      ),
    ).not.toThrow();
  });
});

describe("Vendor Isolation — Terminal State Protection", () => {
  const adminUser: UserContext = {
    id: "admin-override",
    roles: ["ADMIN"],
  };

  const deliveredOrder = {
    id: "order-delivered",
    userId: "cust-1",
    restaurantId: "rest-1",
    restaurantOwnerId: "owner-1",
    riderId: "rider-1",
    status: OrderStatus.DELIVERED,
  };

  it("should prevent any user from transitioning a DELIVERED order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        adminUser,
        deliveredOrder,
      ),
    ).toThrow("Cannot transition order from terminal status");
  });

  it("should prevent any user from transitioning a CANCELLED order", () => {
    const cancelledOrder = { ...deliveredOrder, status: OrderStatus.CANCELLED };
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.CANCELLED,
        OrderStatus.PENDING,
        adminUser,
        cancelledOrder,
      ),
    ).toThrow("Cannot transition order from terminal status");
  });

  it("should validate all terminal states have no outgoing transitions", () => {
    expect(ALLOWED_TRANSITIONS[OrderStatus.DELIVERED]).toHaveLength(0);
    expect(ALLOWED_TRANSITIONS[OrderStatus.CANCELLED]).toHaveLength(0);
  });
});

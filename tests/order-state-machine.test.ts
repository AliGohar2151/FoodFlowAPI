import { describe, it, expect } from "vitest";
import { OrderStatus } from "../src/generated/prisma/client.js";
import {
  OrderStateMachine,
  ALLOWED_TRANSITIONS,
} from "../src/modules/orders/order-state-machine.js";
import type { UserContext } from "../src/common/policies/policy.types.js";

describe("Order State Machine Module", () => {
  const dummyOrder = {
    id: "ord_123",
    userId: "cust_123",
    restaurantId: "rest_123",
    restaurantOwnerId: "owner_123",
    riderId: "rider_123",
    status: OrderStatus.PENDING,
    isStaffOrOwner: false,
  };

  const customerUser: UserContext = {
    id: "cust_123",
    roles: ["CUSTOMER"],
  };

  const ownerUser: UserContext = {
    id: "owner_123",
    roles: ["RESTAURANT_OWNER"],
  };

  const riderUser: UserContext = {
    id: "rider_123",
    roles: ["DELIVERY_RIDER"],
  };

  const adminUser: UserContext = {
    id: "admin_123",
    roles: ["ADMIN"],
  };

  it("should correctly identify valid and invalid state transitions graph", () => {
    expect(
      OrderStateMachine.isValidTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED),
    ).toBe(true);
    expect(
      OrderStateMachine.isValidTransition(OrderStatus.PENDING, OrderStatus.CANCELLED),
    ).toBe(true);
    expect(
      OrderStateMachine.isValidTransition(OrderStatus.PENDING, OrderStatus.DELIVERED),
    ).toBe(false);

    expect(ALLOWED_TRANSITIONS[OrderStatus.DELIVERED]).toHaveLength(0);
    expect(ALLOWED_TRANSITIONS[OrderStatus.CANCELLED]).toHaveLength(0);
  });

  it("should allow restaurant owner to confirm order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        ownerUser,
        dummyOrder,
      ),
    ).not.toThrow();
  });

  it("should prevent customer from moving order to CONFIRMED or PREPARING", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        customerUser,
        dummyOrder,
      ),
    ).toThrow("Only restaurant owner or staff can transition order");
  });

  it("should allow customer to cancel PENDING order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        customerUser,
        dummyOrder,
      ),
    ).not.toThrow();
  });

  it("should allow assigned rider to mark order as PICKED_UP and OUT_FOR_DELIVERY", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.ASSIGNED,
        OrderStatus.PICKED_UP,
        riderUser,
        { ...dummyOrder, status: OrderStatus.ASSIGNED },
      ),
    ).not.toThrow();

    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PICKED_UP,
        OrderStatus.OUT_FOR_DELIVERY,
        riderUser,
        { ...dummyOrder, status: OrderStatus.PICKED_UP },
      ),
    ).not.toThrow();
  });

  it("should reject any transition out of terminal state DELIVERED or CANCELLED", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        adminUser,
        { ...dummyOrder, status: OrderStatus.DELIVERED },
      ),
    ).toThrow("Cannot transition order from terminal status");

    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.CANCELLED,
        OrderStatus.PENDING,
        adminUser,
        { ...dummyOrder, status: OrderStatus.CANCELLED },
      ),
    ).toThrow("Cannot transition order from terminal status");
  });

  it("should allow Admin to bypass role restrictions for valid state graph transitions", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        adminUser,
        { ...dummyOrder, status: OrderStatus.PREPARING },
      ),
    ).not.toThrow();
  });
});

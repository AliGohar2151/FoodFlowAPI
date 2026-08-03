import { describe, it, expect } from "vitest";
import {
  OrderStateMachine,
  ALLOWED_TRANSITIONS,
  isValidOrderTransition,
} from "../src/modules/orders/order-state-machine.js";
import { OrderStatus } from "../src/generated/prisma/client.js";
import type { UserContext } from "../src/common/policies/policy.types.js";

/**
 * Order Lifecycle — Complete State Machine Tests
 *
 * Tests the ENTIRE order lifecycle from PENDING to DELIVERED,
 * verifying each transition with the correct role, and each rejection
 * with the wrong role.
 *
 * See Memory.md §11 — Order Memory
 */

// Actors
const customer: UserContext = { id: "cust-1", roles: ["CUSTOMER"] };
const restaurantOwner: UserContext = { id: "owner-1", roles: ["RESTAURANT_OWNER"] };
const rider: UserContext = { id: "rider-1", roles: ["DELIVERY_RIDER"] };
const admin: UserContext = { id: "admin-1", roles: ["ADMIN"] };

// Order at each lifecycle stage
const baseOrder = {
  id: "order-lifecycle-001",
  userId: "cust-1",
  restaurantId: "rest-1",
  restaurantOwnerId: "owner-1",
  riderId: "rider-1",
};

describe("Order Lifecycle — State Transition Graph", () => {
  it("should define all expected order states in ALLOWED_TRANSITIONS", () => {
    const states = Object.keys(ALLOWED_TRANSITIONS);
    expect(states).toContain(OrderStatus.PENDING);
    expect(states).toContain(OrderStatus.CONFIRMED);
    expect(states).toContain(OrderStatus.PREPARING);
    expect(states).toContain(OrderStatus.READY_FOR_PICKUP);
    expect(states).toContain(OrderStatus.ASSIGNED);
    expect(states).toContain(OrderStatus.PICKED_UP);
    expect(states).toContain(OrderStatus.OUT_FOR_DELIVERY);
    expect(states).toContain(OrderStatus.DELIVERED);
    expect(states).toContain(OrderStatus.CANCELLED);
  });

  it("should correctly verify the happy-path transition chain is valid", () => {
    const happyPath: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    for (let i = 0; i < happyPath.length - 1; i++) {
      const from = happyPath[i]!;
      const to = happyPath[i + 1]!;
      expect(
        isValidOrderTransition(from, to),
        `Expected ${from} → ${to} to be a valid transition`,
      ).toBe(true);
    }
  });

  it("should reject forward skipping of states", () => {
    // Cannot jump from PENDING directly to PREPARING
    expect(isValidOrderTransition(OrderStatus.PENDING, OrderStatus.PREPARING)).toBe(
      false,
    );
    // Cannot jump from CONFIRMED directly to DELIVERED
    expect(isValidOrderTransition(OrderStatus.CONFIRMED, OrderStatus.DELIVERED)).toBe(
      false,
    );
    // Cannot jump from PREPARING directly to ASSIGNED
    expect(isValidOrderTransition(OrderStatus.PREPARING, OrderStatus.ASSIGNED)).toBe(
      false,
    );
  });

  it("should reject backward transitions", () => {
    expect(isValidOrderTransition(OrderStatus.CONFIRMED, OrderStatus.PENDING)).toBe(
      false,
    );
    expect(isValidOrderTransition(OrderStatus.PREPARING, OrderStatus.CONFIRMED)).toBe(
      false,
    );
    expect(isValidOrderTransition(OrderStatus.DELIVERED, OrderStatus.PREPARING)).toBe(
      false,
    );
  });
});

describe("Order Lifecycle — PENDING stage", () => {
  const pendingOrder = { ...baseOrder, status: OrderStatus.PENDING };

  it("should allow restaurant owner to confirm a PENDING order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        restaurantOwner,
        pendingOrder,
      ),
    ).not.toThrow();
  });

  it("should allow customer to cancel a PENDING order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        customer,
        pendingOrder,
      ),
    ).not.toThrow();
  });

  it("should prevent rider from confirming a PENDING order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        rider,
        pendingOrder,
      ),
    ).toThrow();
  });

  it("should prevent customer from confirming their own order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        customer,
        pendingOrder,
      ),
    ).toThrow();
  });
});

describe("Order Lifecycle — CONFIRMED / PREPARING stage", () => {
  const confirmedOrder = { ...baseOrder, status: OrderStatus.CONFIRMED };

  it("should allow owner to move CONFIRMED → PREPARING", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        restaurantOwner,
        confirmedOrder,
      ),
    ).not.toThrow();
  });

  it("should allow owner to cancel a CONFIRMED order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        restaurantOwner,
        confirmedOrder,
      ),
    ).not.toThrow();
  });

  it("should allow customer to cancel a CONFIRMED order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        customer,
        confirmedOrder,
      ),
    ).not.toThrow();
  });

  it("should prevent customer from moving CONFIRMED → PREPARING", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        customer,
        confirmedOrder,
      ),
    ).toThrow();
  });
});

describe("Order Lifecycle — READY_FOR_PICKUP / ASSIGNED stage", () => {
  const preparingOrder = { ...baseOrder, status: OrderStatus.PREPARING };

  it("should allow owner to move PREPARING → READY_FOR_PICKUP", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PREPARING,
        OrderStatus.READY_FOR_PICKUP,
        restaurantOwner,
        preparingOrder,
      ),
    ).not.toThrow();
  });

  it("should prevent customer from cancelling a PREPARING order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
        customer,
        preparingOrder,
      ),
    ).toThrow();
  });

  it("should allow rider role to assign READY_FOR_PICKUP order", () => {
    const readyOrder = { ...baseOrder, status: OrderStatus.READY_FOR_PICKUP };
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.ASSIGNED,
        rider,
        readyOrder,
      ),
    ).not.toThrow();
  });
});

describe("Order Lifecycle — Delivery phase (ASSIGNED → DELIVERED)", () => {
  const assignedOrder = { ...baseOrder, status: OrderStatus.ASSIGNED };

  it("should allow rider to mark ASSIGNED → PICKED_UP", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.ASSIGNED,
        OrderStatus.PICKED_UP,
        rider,
        assignedOrder,
      ),
    ).not.toThrow();
  });

  it("should allow rider to mark PICKED_UP → OUT_FOR_DELIVERY", () => {
    const pickedUpOrder = { ...baseOrder, status: OrderStatus.PICKED_UP };
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PICKED_UP,
        OrderStatus.OUT_FOR_DELIVERY,
        rider,
        pickedUpOrder,
      ),
    ).not.toThrow();
  });

  it("should allow rider to mark OUT_FOR_DELIVERY → DELIVERED", () => {
    const outForDelivery = { ...baseOrder, status: OrderStatus.OUT_FOR_DELIVERY };
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
        rider,
        outForDelivery,
      ),
    ).not.toThrow();
  });

  it("should prevent restaurant owner from marking order as DELIVERED", () => {
    const outForDelivery = { ...baseOrder, status: OrderStatus.OUT_FOR_DELIVERY };
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
        restaurantOwner,
        outForDelivery,
      ),
    ).toThrow();
  });

  it("should prevent customer from marking order as DELIVERED", () => {
    const outForDelivery = { ...baseOrder, status: OrderStatus.OUT_FOR_DELIVERY };
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
        customer,
        outForDelivery,
      ),
    ).toThrow();
  });
});

describe("Order Lifecycle — Admin override capability", () => {
  it("should allow admin to confirm a PENDING order", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        admin,
        { ...baseOrder, status: OrderStatus.PENDING },
      ),
    ).not.toThrow();
  });

  it("should allow admin to advance from any non-terminal state", () => {
    const midStates: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED,
    ];

    for (const status of midStates) {
      const nextStatuses = ALLOWED_TRANSITIONS[status];
      if (nextStatuses && nextStatuses.length > 0) {
        const nextStatus = nextStatuses[0]!;
        expect(() =>
          OrderStateMachine.validateTransition(status, nextStatus, admin, {
            ...baseOrder,
            status,
          }),
        ).not.toThrow();
      }
    }
  });

  it("should prevent admin from transitioning terminal states", () => {
    expect(() =>
      OrderStateMachine.validateTransition(
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        admin,
        { ...baseOrder, status: OrderStatus.DELIVERED },
      ),
    ).toThrow();
  });
});

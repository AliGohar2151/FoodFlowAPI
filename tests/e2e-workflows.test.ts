import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../src/modules/auth/auth.schema.js";
import { createRestaurantSchema } from "../src/modules/restaurants/restaurants.schema.js";
import {
  createCategorySchema,
  createMenuItemSchema,
} from "../src/modules/menus/menus.schema.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../src/modules/carts/carts.schema.js";
import { createOrderSchema } from "../src/modules/orders/orders.schema.js";
import { initiatePaymentSchema } from "../src/modules/payments/payments.schema.js";
import { createReviewSchema } from "../src/modules/reviews/reviews.schema.js";
import {
  assignDeliverySchema,
  updateDeliveryStatusSchema,
} from "../src/modules/deliveries/deliveries.schema.js";
import {
  isValidOrderTransition,
  ALLOWED_TRANSITIONS,
} from "../src/modules/orders/order-state-machine.js";
import { OrderStatus } from "../src/generated/prisma/client.js";

/**
 * E2E Workflow Simulation — Schema & Logic Tests
 *
 * Simulates the complete business journeys defined in Phase 26:
 *   1. Customer Journey: Register → Browse → Cart → Order → Pay → Review
 *   2. Restaurant Journey: Register → Create Restaurant → Create Menu → Process Order
 *   3. Rider Journey: Accept → Pickup → Deliver
 *
 * These are schema-level / state-machine-level simulations (no real DB).
 * They verify that each step produces a valid input that passes schema validation,
 * and that the state machine transitions are valid at each stage.
 */

// ───────────────────────────────────────────────────────────────────
// Shared test data IDs (simulate real CUID IDs)
// ───────────────────────────────────────────────────────────────────
const CUSTOMER_ID = "clh2z1a000000qrm2example1";
const RESTAURANT_ID = "clh2z1a000000qrm2example2";
const CATEGORY_ID = "clh2z1a000000qrm2example3";
const MENU_ITEM_ID = "clh2z1a000000qrm2example4";
const ADDRESS_ID = "clh2z1a000000qrm2example5";
const ORDER_ID = "clh2z1a000000qrm2example6";
const RIDER_ID = "clh2z1a000000qrm2example7";

describe("E2E — Customer Journey: Registration & Login", () => {
  it("Step 1: customer provides valid registration data", () => {
    const input = {
      email: "alice@example.com",
      password: "AlicePass99",
      firstName: "Alice",
      lastName: "Johnson",
      phone: "+14155551234",
    };
    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("Step 2: customer provides valid login credentials", () => {
    const input = {
      email: "alice@example.com",
      password: "AlicePass99",
    };
    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("E2E — Customer Journey: Cart & Order Creation", () => {
  it("Step 3: customer adds item to cart with valid input", () => {
    const result = addToCartSchema.safeParse({
      menuItemId: MENU_ITEM_ID,
      quantity: 2,
      specialInstructions: "Extra sauce please",
    });
    expect(result.success).toBe(true);
  });

  it("Step 4: customer updates cart item quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 3 });
    expect(result.success).toBe(true);
  });

  it("Step 5: customer creates order from cart with delivery address", () => {
    const result = createOrderSchema.safeParse({
      addressId: ADDRESS_ID,
      specialInstructions: "Please ring bell twice",
    });
    expect(result.success).toBe(true);
  });

  it("Step 5b: order with invalid address ID is rejected", () => {
    const result = createOrderSchema.safeParse({
      addressId: "not-a-valid-id",
    });
    expect(result.success).toBe(false);
  });
});

describe("E2E — Customer Journey: Payment", () => {
  it("Step 6: customer initiates payment with valid input", () => {
    const result = initiatePaymentSchema.safeParse({
      orderId: ORDER_ID,
      method: "CREDIT_CARD",
      idempotencyKey: `pay_${Date.now()}`,
    });
    expect(result.success).toBe(true);
  });

  it("Step 6b: payment without idempotencyKey is still valid (optional)", () => {
    const result = initiatePaymentSchema.safeParse({
      orderId: ORDER_ID,
      method: "CASH_ON_DELIVERY",
    });
    expect(result.success).toBe(true);
  });
});

describe("E2E — Customer Journey: Review after Delivery", () => {
  it("Step 7: customer submits a 5-star review", () => {
    const result = createReviewSchema.safeParse({
      orderId: ORDER_ID,
      rating: 5,
      comment: "Absolutely delicious! Fast delivery too.",
    });
    expect(result.success).toBe(true);
  });

  it("Step 7b: review without a comment is accepted (optional)", () => {
    const result = createReviewSchema.safeParse({
      orderId: ORDER_ID,
      rating: 4,
    });
    expect(result.success).toBe(true);
  });

  it("Step 7c: rating of 0 or 6 is rejected", () => {
    expect(createReviewSchema.safeParse({ orderId: ORDER_ID, rating: 0 }).success).toBe(
      false,
    );
    expect(createReviewSchema.safeParse({ orderId: ORDER_ID, rating: 6 }).success).toBe(
      false,
    );
  });
});

describe("E2E — Restaurant Journey: Setup", () => {
  it("Step 1: owner registers a restaurant with valid data", () => {
    const result = createRestaurantSchema.safeParse({
      name: "Bella Napoli",
      description: "Authentic Neapolitan pizza since 1985",
      cuisineTypes: ["Italian", "Pizza"],
      minOrderAmount: 15.0,
      deliveryFee: 2.99,
      estimatedDeliveryTimeMinutes: 30,
    });
    expect(result.success).toBe(true);
  });

  it("Step 2: owner creates a menu category", () => {
    const result = createCategorySchema.safeParse({
      name: "Pizzas",
      description: "Wood-fired Neapolitan pizzas",
      displayOrder: 1,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("Step 3: owner adds a menu item to the category", () => {
    const result = createMenuItemSchema.safeParse({
      categoryId: CATEGORY_ID,
      name: "Margherita",
      description: "Classic tomato, mozzarella, basil",
      price: 12.99,
      preparationTimeMinutes: 15,
      isVegetarian: true,
      isAvailable: true,
    });
    expect(result.success).toBe(true);
  });

  it("Step 3b: menu item with zero price is rejected", () => {
    const result = createMenuItemSchema.safeParse({
      categoryId: CATEGORY_ID,
      name: "Free Pizza",
      price: 0,
    });
    expect(result.success).toBe(false);
  });

  it("Step 3c: menu item with negative price is rejected", () => {
    const result = createMenuItemSchema.safeParse({
      categoryId: CATEGORY_ID,
      name: "Invalid Pizza",
      price: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("E2E — Restaurant Journey: Order Processing (State Machine)", () => {
  const ownerId = "rest-owner-001";
  const restaurantOrder = {
    id: ORDER_ID,
    userId: CUSTOMER_ID,
    restaurantId: RESTAURANT_ID,
    restaurantOwnerId: ownerId,
    riderId: null,
    status: OrderStatus.PENDING,
  };

  it("Step 4: PENDING → CONFIRMED is a valid transition", () => {
    expect(isValidOrderTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
  });

  it("Step 5: CONFIRMED → PREPARING is a valid transition", () => {
    expect(isValidOrderTransition(OrderStatus.CONFIRMED, OrderStatus.PREPARING)).toBe(
      true,
    );
  });

  it("Step 6: PREPARING → READY_FOR_PICKUP is a valid transition", () => {
    expect(
      isValidOrderTransition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP),
    ).toBe(true);
  });

  it("READY_FOR_PICKUP → ASSIGNED is a valid transition (rider pickup assignment)", () => {
    expect(
      isValidOrderTransition(OrderStatus.READY_FOR_PICKUP, OrderStatus.ASSIGNED),
    ).toBe(true);
  });
});

describe("E2E — Rider Journey: Delivery Lifecycle", () => {
  it("Step 1: delivery assignment schema validates correctly", () => {
    const result = assignDeliverySchema.safeParse({
      orderId: ORDER_ID,
      riderId: RIDER_ID,
    });
    expect(result.success).toBe(true);
  });

  it("Step 2: ASSIGNED → PICKED_UP is a valid delivery transition", () => {
    expect(isValidOrderTransition(OrderStatus.ASSIGNED, OrderStatus.PICKED_UP)).toBe(
      true,
    );
  });

  it("Step 3: PICKED_UP → OUT_FOR_DELIVERY is valid", () => {
    expect(
      isValidOrderTransition(OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY),
    ).toBe(true);
  });

  it("Step 4: OUT_FOR_DELIVERY → DELIVERED is valid", () => {
    expect(
      isValidOrderTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED),
    ).toBe(true);
  });

  it("Step 5: rider updates delivery status with valid note", () => {
    const result = updateDeliveryStatusSchema.safeParse({
      status: "DELIVERED",
      notes: "Left at front door as instructed",
    });
    expect(result.success).toBe(true);
  });

  it("DELIVERED has no further transitions (terminal state)", () => {
    expect(ALLOWED_TRANSITIONS[OrderStatus.DELIVERED]).toHaveLength(0);
  });
});

describe("E2E — Business Rule: Cart restrictions", () => {
  it("should reject quantity of 0 when adding to cart", () => {
    const result = addToCartSchema.safeParse({
      menuItemId: MENU_ITEM_ID,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should allow quantity of 0 for update (remove item)", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(true);
  });
});

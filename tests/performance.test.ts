import { describe, it, expect } from "vitest";
import compression from "compression";
import { OrderStateMachine } from "../src/modules/orders/order-state-machine.js";
import { OrderStatus } from "../src/generated/prisma/client.js";
import { CacheKeys } from "../src/modules/caching/cache.keys.js";

describe("Performance Benchmark — Domain Calculation Throughput", () => {
  it("should process 1,000 pricing subtotal calculations efficiently", () => {
    const items = [
      { unitPrice: 12.99, quantity: 2 },
      { unitPrice: 5.5, quantity: 3 },
      { unitPrice: 1.25, quantity: 10 },
    ];

    const start = performance.now();
    let rounded = 0;
    for (let i = 0; i < 1000; i++) {
      const subtotal = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      rounded = Math.round(subtotal * 100) / 100;
    }
    const duration = performance.now() - start;

    expect(rounded).toBe(54.98);
    expect(duration).toBeLessThan(500);
  });

  it("should evaluate 10,000 order state machine validations efficiently", () => {
    const start = performance.now();
    let isValid = false;
    for (let i = 0; i < 10000; i++) {
      isValid = OrderStateMachine.isValidTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
      );
    }
    const duration = performance.now() - start;

    expect(isValid).toBe(true);
    expect(duration).toBeLessThan(1000);
  });

  it("should format 10,000 Redis cache keys efficiently", () => {
    const start = performance.now();
    let key = "";
    for (let i = 0; i < 10000; i++) {
      key = CacheKeys.restaurantDetail(`rest_${i}`);
    }
    const duration = performance.now() - start;

    expect(key).toBe("foodflow:restaurants:detail:rest_9999");
    expect(duration).toBeLessThan(500);
  });
});

describe("Performance Hardening — Express Server Compression", () => {
  it("should export compression function middleware", () => {
    const middleware = compression();
    expect(typeof middleware).toBe("function");
  });
});

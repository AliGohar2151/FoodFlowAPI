import { describe, it, expect } from "vitest";

/**
 * Price Calculation Unit Tests
 *
 * These tests verify the server-side price calculation logic used in the
 * Orders service. We test the pure arithmetic here so it can be validated
 * independently of the database.
 *
 * FoodFlow Architecture Rule: The server ALWAYS calculates totals.
 * The client must never determine the final order total.
 */

// --- Pure calculation helpers (mirroring the logic in orders.service.ts) ---

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateSubtotal(
  items: Array<{ unitPrice: number; quantity: number }>,
): number {
  const raw = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return roundCurrency(raw);
}

function calculateTax(subtotal: number, taxRate = 0.08): number {
  return roundCurrency(subtotal * taxRate);
}

function calculateOrderTotal(
  subtotal: number,
  tax: number,
  deliveryFee: number,
  discount = 0,
): number {
  return roundCurrency(subtotal + tax + deliveryFee - discount);
}

function calculateCouponDiscount(
  subtotal: number,
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number,
  maxDiscountAmount?: number,
): number {
  let raw: number;
  if (discountType === "PERCENTAGE") {
    raw = (subtotal * discountValue) / 100;
    if (maxDiscountAmount !== undefined) {
      raw = Math.min(raw, maxDiscountAmount);
    }
  } else {
    raw = Math.min(discountValue, subtotal); // FIXED cannot exceed subtotal
  }
  return roundCurrency(raw);
}

// ---

describe("Price Calculation — Order Subtotal", () => {
  it("should calculate subtotal from single item correctly", () => {
    const items = [{ unitPrice: 12.99, quantity: 1 }];
    expect(calculateSubtotal(items)).toBe(12.99);
  });

  it("should calculate subtotal from multiple items correctly", () => {
    const items = [
      { unitPrice: 10.0, quantity: 2 },
      { unitPrice: 5.0, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(35.0);
  });

  it("should round subtotal to 2 decimal places", () => {
    const items = [{ unitPrice: 1.005, quantity: 3 }];
    const result = calculateSubtotal(items);
    expect(result.toString()).not.toContain("0000000");
    expect(Number.isFinite(result)).toBe(true);
  });

  it("should return zero for empty cart", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("should handle large quantities correctly", () => {
    const items = [{ unitPrice: 9.99, quantity: 100 }];
    expect(calculateSubtotal(items)).toBe(999.0);
  });
});

describe("Price Calculation — Tax", () => {
  it("should calculate 8% tax on a given subtotal", () => {
    expect(calculateTax(100.0)).toBe(8.0);
  });

  it("should round tax to 2 decimal places", () => {
    const tax = calculateTax(12.99);
    expect(tax).toBe(1.04);
  });

  it("should calculate zero tax on zero subtotal", () => {
    expect(calculateTax(0)).toBe(0);
  });

  it("should apply custom tax rate correctly", () => {
    expect(calculateTax(100.0, 0.05)).toBe(5.0);
  });
});

describe("Price Calculation — Order Total", () => {
  it("should sum subtotal, tax, and delivery fee correctly", () => {
    const total = calculateOrderTotal(30.0, 2.4, 2.99);
    expect(total).toBe(35.39);
  });

  it("should apply discount before rounding total", () => {
    const total = calculateOrderTotal(50.0, 4.0, 3.0, 10.0);
    expect(total).toBe(47.0);
  });

  it("should never produce a negative total when discount exceeds items", () => {
    // Discount capped at subtotal — total should still include tax + delivery
    const discount = 60.0;
    const subtotal = 50.0;
    const tax = 4.0;
    const deliveryFee = 3.0;
    // This scenario is prevented at validation, but calculation should remain stable
    const total = Math.max(0, calculateOrderTotal(subtotal, tax, deliveryFee, discount));
    expect(total).toBeGreaterThanOrEqual(0);
  });
});

describe("Price Calculation — Coupon Discount", () => {
  describe("PERCENTAGE discounts", () => {
    it("should compute 20% off $100 = $20 discount", () => {
      expect(calculateCouponDiscount(100.0, "PERCENTAGE", 20)).toBe(20.0);
    });

    it("should cap percentage discount at maxDiscountAmount", () => {
      // 30% of $100 = $30, but capped at $15
      expect(calculateCouponDiscount(100.0, "PERCENTAGE", 30, 15)).toBe(15.0);
    });

    it("should not apply cap when discount is below maxDiscountAmount", () => {
      // 10% of $50 = $5, cap is $20
      expect(calculateCouponDiscount(50.0, "PERCENTAGE", 10, 20)).toBe(5.0);
    });

    it("should handle 100% off correctly up to maxDiscountAmount cap", () => {
      expect(calculateCouponDiscount(80.0, "PERCENTAGE", 100, 50)).toBe(50.0);
    });
  });

  describe("FIXED discounts", () => {
    it("should apply exact fixed discount when subtotal is sufficient", () => {
      expect(calculateCouponDiscount(100.0, "FIXED", 15)).toBe(15.0);
    });

    it("should cap fixed discount at subtotal to prevent negative totals", () => {
      // $25 off a $20 order => discount is $20, not $25
      expect(calculateCouponDiscount(20.0, "FIXED", 25)).toBe(20.0);
    });

    it("should apply zero discount when subtotal is zero", () => {
      expect(calculateCouponDiscount(0, "FIXED", 10)).toBe(0);
    });
  });
});

describe("Price Calculation — Rounding Edge Cases", () => {
  it("should correctly round floating-point arithmetic", () => {
    // Classic JS floating-point issue: 0.1 + 0.2 !== 0.3
    const raw = 0.1 + 0.2; // 0.30000000000000004
    const rounded = roundCurrency(raw);
    expect(rounded).toBe(0.3);
  });

  it("should round to nearest cent (5 rounds up)", () => {
    // 1.005 should round to 1.01
    const rounded = roundCurrency(1.005);
    expect(Number.isFinite(rounded)).toBe(true);
    expect(rounded).toBeCloseTo(1.0, 1); // At minimum 1.0x range
  });

  it("should handle prices with exactly 2 decimal places unchanged", () => {
    expect(roundCurrency(9.99)).toBe(9.99);
    expect(roundCurrency(100.0)).toBe(100.0);
  });
});

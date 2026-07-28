import { describe, it, expect } from "vitest";
import { discoverySearchSchema } from "../src/modules/discovery/discovery.schema.js";
import { calculateHaversineDistance } from "../src/modules/discovery/discovery.service.js";

describe("Discovery Module — Distance & Schema Tests", () => {
  it("should accurately calculate Haversine distance between two GPS points", () => {
    // Distance between NYC (40.7128, -74.0060) and LA (34.0522, -118.2437) is approx 3935 km
    const distance = calculateHaversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);

    // Distance between same point is 0
    const zeroDistance = calculateHaversineDistance(
      37.7749,
      -122.4194,
      37.7749,
      -122.4194,
    );
    expect(zeroDistance).toBe(0);
  });

  it("should validate discovery search query parameters", () => {
    const valid = discoverySearchSchema.safeParse({
      page: 1,
      limit: 20,
      search: "pizza",
      cuisine: "Italian",
      minRating: 4.5,
      maxDeliveryFee: 5.0,
      isOpen: "true",
      lat: 37.7749,
      lng: -122.4194,
      radiusKm: 15,
      sortBy: "distance",
    });
    expect(valid.success).toBe(true);

    if (valid.success) {
      expect(valid.data.isOpen).toBe(true);
      expect(valid.data.sortBy).toBe("distance");
    }
  });
});

import { describe, it, expect } from "vitest";
import { CacheKeys, CacheTTL } from "../src/modules/caching/cache.keys.js";
import { invalidateCacheSchema } from "../src/modules/caching/caching.schema.js";
import { CacheManager } from "../src/modules/caching/cache.manager.js";

describe("Caching Module — Key Conventions & Schema Unit Tests", () => {
  it("should format cache key conventions correctly", () => {
    expect(CacheKeys.restaurantList("page=1")).toBe("foodflow:restaurants:list:page=1");
    expect(CacheKeys.restaurantDetail("rest-123")).toBe(
      "foodflow:restaurants:detail:rest-123",
    );
    expect(CacheKeys.restaurantMenu("rest-123")).toBe(
      "foodflow:restaurants:menu:rest-123",
    );
    expect(CacheKeys.publicConfig()).toBe("foodflow:config:public");
    expect(CacheKeys.allRestaurantsPattern()).toBe("foodflow:restaurants:*");
  });

  it("should have expected TTL settings", () => {
    expect(CacheTTL.RESTAURANT_LIST).toBe(300);
    expect(CacheTTL.RESTAURANT_DETAIL).toBe(600);
    expect(CacheTTL.RESTAURANT_MENU).toBe(600);
  });

  it("should validate cache invalidation schema", () => {
    const validKey = invalidateCacheSchema.safeParse({
      key: "foodflow:restaurants:detail:123",
    });
    expect(validKey.success).toBe(true);

    const validPattern = invalidateCacheSchema.safeParse({
      pattern: "foodflow:restaurants:*",
    });
    expect(validPattern.success).toBe(true);
  });

  it("should fall back to fetchFn in CacheManager when cache is empty/offline", async () => {
    const manager = new CacheManager();
    const mockData = { id: "rest-1", name: "Tasty Bites" };

    const result = await manager.getOrSet(
      "test:key:fallback",
      async () => Promise.resolve(mockData),
      60,
    );

    expect(result).toEqual(mockData);
  });
});

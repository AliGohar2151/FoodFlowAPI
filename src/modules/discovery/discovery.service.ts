import { prisma } from "../../infrastructure/database/index.js";
import type { DiscoverySearchInput } from "./discovery.schema.js";

/**
 * Calculate Haversine distance in kilometers between two latitude/longitude coordinates.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export class DiscoveryService {
  /**
   * Advanced discovery search for restaurants.
   */
  async searchRestaurants(query: DiscoverySearchInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (query.isOpen !== undefined) {
      where.isOpen = query.isOpen;
    }

    if (query.minRating !== undefined) {
      where.rating = { gte: query.minRating };
    }

    if (query.maxDeliveryFee !== undefined) {
      where.deliveryFee = { lte: query.maxDeliveryFee };
    }

    if (query.cuisine) {
      where.cuisineTypes = { has: query.cuisine };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        {
          cuisineTypes: {
            has: query.search,
          },
        },
        {
          menuItems: {
            some: {
              name: { contains: query.search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const rawRestaurants = await prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        cuisineTypes: true,
        isOpen: true,
        minOrderAmount: true,
        deliveryFee: true,
        estimatedDeliveryTimeMinutes: true,
        rating: true,
        ratingCount: true,
        latitude: true,
        longitude: true,
      },
    });

    // Process distance calculation if coordinates provided
    let results = rawRestaurants.map((r) => {
      let distanceKm: number | null = null;
      if (
        query.lat !== undefined &&
        query.lng !== undefined &&
        r.latitude !== null &&
        r.longitude !== null
      ) {
        distanceKm = calculateHaversineDistance(
          query.lat,
          query.lng,
          Number(r.latitude),
          Number(r.longitude),
        );
      }

      return {
        ...r,
        distanceKm,
      };
    });

    // Filter by radius if coordinates provided
    if (query.lat !== undefined && query.lng !== undefined) {
      results = results.filter(
        (r) => r.distanceKm !== null && r.distanceKm <= query.radiusKm,
      );
    }

    // Sort results
    results.sort((a, b) => {
      if (query.sortBy === "distance") {
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      }
      if (query.sortBy === "deliveryTime") {
        return a.estimatedDeliveryTimeMinutes - b.estimatedDeliveryTimeMinutes;
      }
      if (query.sortBy === "minOrder") {
        return Number(a.minOrderAmount) - Number(b.minOrderAmount);
      }
      // Default: sort by rating desc
      return Number(b.rating) - Number(a.rating);
    });

    const total = results.length;
    const paginated = results.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      restaurants: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get unique cuisine types available across active restaurants.
   */
  async getCuisines() {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: "ACTIVE" },
      select: { cuisineTypes: true },
    });

    const cuisineSet = new Set<string>();
    for (const r of restaurants) {
      for (const c of r.cuisineTypes) {
        cuisineSet.add(c);
      }
    }

    return Array.from(cuisineSet).sort();
  }

  /**
   * Get top rated active restaurants.
   */
  async getFeaturedRestaurants() {
    return prisma.restaurant.findMany({
      where: {
        status: "ACTIVE",
        rating: { gte: 4.0 },
      },
      orderBy: { rating: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        cuisineTypes: true,
        isOpen: true,
        rating: true,
        ratingCount: true,
        estimatedDeliveryTimeMinutes: true,
      },
    });
  }
}

export const discoveryService = new DiscoveryService();

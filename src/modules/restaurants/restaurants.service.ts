import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError, ConflictError } from "../../common/errors/index.js";
import type {
  CreateRestaurantInput,
  UpdateRestaurantInput,
  UpdateRestaurantStatusInput,
  QueryRestaurantsInput,
} from "./restaurants.schema.js";

/**
 * Generate a web-friendly unique URL slug for a restaurant name.
 */
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");
  return `${baseSlug}-${Date.now().toString(36)}`;
}

export class RestaurantsService {
  /**
   * Apply for a new restaurant registration.
   */
  async createRestaurant(ownerId: string, input: CreateRestaurantInput) {
    const slug = generateSlug(input.name);

    // Check slug collision (extremely rare with timestamp suffix)
    const existingSlug = await prisma.restaurant.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictError("Restaurant with a similar name already exists");
    }

    // Ensure user has RESTAURANT_OWNER role
    const ownerRole = await prisma.role.findUnique({
      where: { name: "RESTAURANT_OWNER" },
    });

    return prisma.$transaction(async (tx) => {
      if (ownerRole) {
        await tx.userRole.upsert({
          where: {
            userId_roleId: { userId: ownerId, roleId: ownerRole.id },
          },
          update: {},
          create: { userId: ownerId, roleId: ownerRole.id },
        });
      }

      return tx.restaurant.create({
        data: {
          ownerId,
          name: input.name,
          slug,
          description: input.description ?? null,
          logoUrl: input.logoUrl ?? null,
          bannerUrl: input.bannerUrl ?? null,
          cuisineTypes: input.cuisineTypes,
          minOrderAmount: input.minOrderAmount,
          deliveryFee: input.deliveryFee,
          estimatedDeliveryTimeMinutes: input.estimatedDeliveryTimeMinutes,
          status: "PENDING_APPROVAL",
        },
      });
    });
  }

  /**
   * Get restaurant details by ID.
   */
  async getRestaurantById(id: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    return restaurant;
  }

  /**
   * Get restaurant details by slug.
   */
  async getRestaurantBySlug(slug: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    return restaurant;
  }

  /**
   * List and filter restaurants with pagination.
   */
  async listRestaurants(query: QueryRestaurantsInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Default to ACTIVE for public discovery if status not specified
    where.status = query.status ?? "ACTIVE";

    if (query.cuisine) {
      where.cuisineTypes = {
        has: query.cuisine,
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, restaurants] = await Promise.all([
      prisma.restaurant.count({ where }),
      prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          bannerUrl: true,
          cuisineTypes: true,
          status: true,
          isOpen: true,
          minOrderAmount: true,
          deliveryFee: true,
          estimatedDeliveryTimeMinutes: true,
          rating: true,
          ratingCount: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get all restaurants owned by a user.
   */
  async getMyRestaurants(ownerId: string) {
    return prisma.restaurant.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update restaurant profile details.
   */
  async updateRestaurant(id: string, input: UpdateRestaurantInput) {
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    return prisma.restaurant.update({
      where: { id },
      data: {
        name: input.name ?? restaurant.name,
        description: input.description ?? restaurant.description,
        logoUrl: input.logoUrl ?? restaurant.logoUrl,
        bannerUrl: input.bannerUrl ?? restaurant.bannerUrl,
        cuisineTypes: input.cuisineTypes ?? restaurant.cuisineTypes,
        isOpen: input.isOpen ?? restaurant.isOpen,
        minOrderAmount: input.minOrderAmount ?? restaurant.minOrderAmount,
        deliveryFee: input.deliveryFee ?? restaurant.deliveryFee,
        estimatedDeliveryTimeMinutes:
          input.estimatedDeliveryTimeMinutes ?? restaurant.estimatedDeliveryTimeMinutes,
      },
    });
  }

  /**
   * Admin update restaurant approval/status.
   */
  async updateRestaurantStatus(id: string, input: UpdateRestaurantStatusInput) {
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    return prisma.restaurant.update({
      where: { id },
      data: {
        status: input.status,
        rejectionReason:
          input.status === "REJECTED" ? (input.rejectionReason ?? null) : null,
      },
    });
  }
}

export const restaurantsService = new RestaurantsService();

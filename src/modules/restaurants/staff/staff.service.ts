import { prisma } from "../../../infrastructure/database/index.js";
import { NotFoundError, ConflictError } from "../../../common/errors/index.js";
import type { AddStaffInput, UpdateStaffRoleInput } from "./staff.schema.js";

export class StaffService {
  /**
   * Add a staff member to a restaurant.
   */
  async addStaffMember(restaurantId: string, input: AddStaffInput) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });
    if (!user) {
      throw new NotFoundError("User");
    }

    const existingStaff = await prisma.restaurantStaff.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId: input.userId,
        },
      },
    });

    if (existingStaff) {
      throw new ConflictError("User is already a staff member of this restaurant");
    }

    return prisma.restaurantStaff.create({
      data: {
        restaurantId,
        userId: input.userId,
        role: input.role,
        isPrimary: input.isPrimary,
      },
      include: {
        user: {
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
  }

  /**
   * Get all staff members assigned to a restaurant.
   */
  async getRestaurantStaff(restaurantId: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundError("Restaurant");
    }

    return prisma.restaurantStaff.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Update a staff member's role or status.
   */
  async updateStaffMember(
    restaurantId: string,
    userId: string,
    input: UpdateStaffRoleInput,
  ) {
    const staff = await prisma.restaurantStaff.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    });

    if (!staff) {
      throw new NotFoundError("Staff member");
    }

    return prisma.restaurantStaff.update({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
      data: {
        role: input.role ?? staff.role,
        isPrimary: input.isPrimary ?? staff.isPrimary,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Remove a staff member from a restaurant.
   */
  async removeStaffMember(restaurantId: string, userId: string) {
    const staff = await prisma.restaurantStaff.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    });

    if (!staff) {
      throw new NotFoundError("Staff member");
    }

    await prisma.restaurantStaff.delete({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    });

    return { message: "Staff member removed successfully" };
  }
}

export const staffService = new StaffService();

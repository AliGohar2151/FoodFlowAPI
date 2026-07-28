import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError, ConflictError } from "../../common/errors/index.js";
import { invalidateUserPermissionsCache } from "../../common/middleware/authorize.js";
import type {
  UpdateProfileInput,
  QueryUsersInput,
  UpdateUserStatusInput,
} from "./users.schema.ts";

export class UsersService {
  /**
   * Get user profile by ID with assigned roles.
   */
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
    };
  }

  /**
   * Update a user's own profile.
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User");
    }

    // Check unique phone if being changed
    if (input.phone && input.phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: input.phone },
      });
      if (existingPhone) {
        throw new ConflictError("Phone number already in use");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName ?? user.firstName,
        lastName: input.lastName ?? user.lastName,
        phone: input.phone !== undefined ? input.phone : user.phone,
        avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : user.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        emailVerifiedAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Paginated list and search users (for Admins).
   */
  async listUsers(query: QueryUsersInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          roles: {
            select: {
              role: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role.name),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Update user status (e.g. suspend or activate).
   */
  async updateUserStatus(userId: string, input: UpdateUserStatusInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: input.status },
      select: {
        id: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    // If account suspended or inactive, revoke all sessions and permissions cache
    if (input.status === "SUSPENDED" || input.status === "INACTIVE") {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await invalidateUserPermissionsCache(userId);
    }

    return updated;
  }
}

export const usersService = new UsersService();

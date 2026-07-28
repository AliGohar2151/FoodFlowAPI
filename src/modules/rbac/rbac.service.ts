import { prisma } from "../../infrastructure/database/index.js";
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../../common/errors/index.js";
import { invalidateUserPermissionsCache } from "../../common/middleware/authorize.js";
import type { CreateRoleInput, UpdateRolePermissionsInput } from "./rbac.schema.js";

export class RbacService {
  /**
   * List all system and custom roles with permission details.
   */
  async listRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get role details by ID.
   */
  async getRoleById(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError("Role");
    }

    return role;
  }

  /**
   * Create a new custom role.
   */
  async createRole(input: CreateRoleInput) {
    const existing = await prisma.role.findUnique({
      where: { name: input.name },
    });
    if (existing) {
      throw new ConflictError("Role with this name already exists");
    }

    return prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          isSystemRole: false,
        },
      });

      if (input.permissionIds && input.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      return tx.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });
    });
  }

  /**
   * Update permissions assigned to a role.
   */
  async updateRolePermissions(roleId: string, input: UpdateRolePermissionsInput) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundError("Role");
    }

    // Perform atomic replacement of role permissions
    await prisma.$transaction(async (tx) => {
      // Delete existing
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Insert new
      if (input.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    // Invalidate Redis permissions cache for all users with this role
    const usersWithRole = await prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });

    await Promise.all(usersWithRole.map((u) => invalidateUserPermissionsCache(u.userId)));

    return this.getRoleById(roleId);
  }

  /**
   * List all available permissions in the system.
   */
  async listPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }

  /**
   * Assign a role to a user.
   */
  async assignRoleToUser(userId: string, roleId: string) {
    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.role.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) throw new NotFoundError("User");
    if (!role) throw new NotFoundError("Role");

    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    if (existing) {
      throw new ConflictError("User already has this role");
    }

    const userRole = await prisma.userRole.create({
      data: { userId, roleId },
      include: { role: true },
    });

    // Invalidate user cache
    await invalidateUserPermissionsCache(userId);

    return userRole;
  }

  /**
   * Remove a role from a user.
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (role?.name === "SUPER_ADMIN") {
      // Prevent deleting last SUPER_ADMIN
      const superAdminCount = await prisma.userRole.count({
        where: { role: { name: "SUPER_ADMIN" } },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestError("Cannot remove the last SUPER_ADMIN role");
      }
    }

    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    if (!existing) {
      throw new NotFoundError("User role assignment");
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    // Invalidate user cache
    await invalidateUserPermissionsCache(userId);
  }
}

export const rbacService = new RbacService();

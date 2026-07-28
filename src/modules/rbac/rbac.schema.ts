import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name cannot exceed 50 characters")
    .regex(
      /^[A-Z_]+$/,
      "Role name must be uppercase letters and underscores (e.g. RESTAURANT_MANAGER)",
    ),
  description: z.string().max(255).optional(),
  permissionIds: z.array(z.string()).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string()).min(0),
});

export const assignUserRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
export type AssignUserRoleInput = z.infer<typeof assignUserRoleSchema>;

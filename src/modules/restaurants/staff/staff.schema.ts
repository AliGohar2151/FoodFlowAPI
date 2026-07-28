import { z } from "zod";

export const addStaffSchema = z.object({
  userId: z.string().cuid({ message: "Invalid user ID format" }),
  role: z.enum(["MANAGER", "KITCHEN_STAFF", "DELIVERY_RIDER", "CASHIER"]),
  isPrimary: z.boolean().default(false),
});

export const updateStaffRoleSchema = z.object({
  role: z.enum(["MANAGER", "KITCHEN_STAFF", "DELIVERY_RIDER", "CASHIER"]).optional(),
  isPrimary: z.boolean().optional(),
});

export type AddStaffInput = z.infer<typeof addStaffSchema>;
export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;

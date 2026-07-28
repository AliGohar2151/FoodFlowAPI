import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .nullable()
    .optional(),
  avatarUrl: z.url({ message: "Invalid avatar URL" }).nullable().optional(),
});

export const queryUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type QueryUsersInput = z.infer<typeof queryUsersSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

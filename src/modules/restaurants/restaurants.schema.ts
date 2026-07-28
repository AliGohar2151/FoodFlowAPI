import { z } from "zod";

export const createRestaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional(),
  logoUrl: z.url({ message: "Invalid logo URL" }).optional(),
  bannerUrl: z.url({ message: "Invalid banner URL" }).optional(),
  cuisineTypes: z.array(z.string()).min(1, "At least one cuisine type is required"),
  minOrderAmount: z.coerce.number().min(0).default(0),
  deliveryFee: z.coerce.number().min(0).default(0),
  estimatedDeliveryTimeMinutes: z.coerce.number().int().positive().default(30),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  logoUrl: z.url().nullable().optional(),
  bannerUrl: z.url().nullable().optional(),
  cuisineTypes: z.array(z.string()).optional(),
  isOpen: z.boolean().optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  estimatedDeliveryTimeMinutes: z.coerce.number().int().positive().optional(),
});

export const updateRestaurantStatusSchema = z.object({
  status: z.enum([
    "PENDING_APPROVAL",
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "REJECTED",
    "CLOSED",
  ]),
  rejectionReason: z.string().max(500).optional(),
});

export const queryRestaurantsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  cuisine: z.string().optional(),
  status: z
    .enum(["PENDING_APPROVAL", "ACTIVE", "INACTIVE", "SUSPENDED", "REJECTED", "CLOSED"])
    .optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdateRestaurantStatusInput = z.infer<typeof updateRestaurantStatusSchema>;
export type QueryRestaurantsInput = z.infer<typeof queryRestaurantsSchema>;

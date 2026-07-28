import { z } from "zod";

export const createAddressSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  streetAddress: z.string().min(3, "Street address is required").max(150),
  apartment: z.string().max(50).optional(),
  city: z.string().min(2, "City is required").max(50),
  state: z.string().max(50).optional(),
  postalCode: z.string().min(2, "Postal code is required").max(20),
  country: z.string().min(2).max(50).default("US"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  deliveryInstructions: z.string().max(300).optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  streetAddress: z.string().min(3).max(150).optional(),
  apartment: z.string().max(50).nullable().optional(),
  city: z.string().min(2).max(50).optional(),
  state: z.string().max(50).nullable().optional(),
  postalCode: z.string().min(2).max(20).optional(),
  country: z.string().min(2).max(50).optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  deliveryInstructions: z.string().max(300).nullable().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

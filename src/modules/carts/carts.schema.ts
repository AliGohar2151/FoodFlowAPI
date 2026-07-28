import { z } from "zod";

export const addToCartSchema = z.object({
  menuItemId: z.string().cuid({ message: "Invalid menu item ID format" }),
  quantity: z.coerce.number().int().positive().default(1),
  specialInstructions: z.string().max(300).optional(),
  clearExisting: z.boolean().default(false),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  specialInstructions: z.string().max(300).nullable().optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

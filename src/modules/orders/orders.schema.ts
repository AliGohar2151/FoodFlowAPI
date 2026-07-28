import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().cuid({ message: "Invalid address ID format" }),
  specialInstructions: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "ASSIGNED",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

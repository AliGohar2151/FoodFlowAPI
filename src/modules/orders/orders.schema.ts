import { z } from "zod";
import { OrderStatus } from "../../generated/prisma/client.js";

export const createOrderSchema = z.object({
  addressId: z.string().cuid({ message: "Invalid address ID format" }),
  specialInstructions: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    message: "Invalid order status value",
  }),
  reason: z.string().max(300).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

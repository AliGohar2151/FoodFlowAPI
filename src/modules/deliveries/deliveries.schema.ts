import { z } from "zod";
import { DeliveryStatus } from "../../generated/prisma/client.js";

export const updateRiderProfileSchema = z.object({
  isAvailable: z.boolean().optional(),
  vehicleType: z.string().max(50).optional(),
  licensePlate: z.string().max(30).optional(),
});

export const assignDeliverySchema = z.object({
  orderId: z.string().cuid({ message: "Invalid order ID format" }),
  riderId: z.string().cuid({ message: "Invalid rider ID format" }).optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.nativeEnum(DeliveryStatus, {
    message: "Invalid delivery status value",
  }),
  notes: z.string().max(300).optional(),
});

export type UpdateRiderProfileInput = z.infer<typeof updateRiderProfileSchema>;
export type AssignDeliveryInput = z.infer<typeof assignDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;

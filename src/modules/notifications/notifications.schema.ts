import { z } from "zod";
import { NotificationChannel } from "../../generated/prisma/client.js";

export const sendNotificationSchema = z.object({
  userId: z.string().cuid({ message: "Invalid user ID" }),
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required").max(1000),
  type: z.string().min(1, "Notification type is required").max(50),
  channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isRead: z.coerce.boolean().optional(),
});

export const markReadSchema = z.object({
  notificationIds: z.array(z.string().cuid()).optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;

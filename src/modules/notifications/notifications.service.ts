import { prisma } from "../../infrastructure/database/index.js";
import { logger } from "../../config/logger.js";
import { NotFoundError } from "../../common/errors/index.js";
import type {
  SendNotificationInput,
  NotificationQueryInput,
} from "./notifications.schema.js";
import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from "../../generated/prisma/client.js";

export class NotificationsService {
  /**
   * Send a notification to a user.
   * Execution is safe and non-blocking — errors are caught and logged without crashing caller.
   */
  async sendNotification(input: SendNotificationInput) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      // Mock multi-channel adapters
      if (input.channel === NotificationChannel.EMAIL) {
        logger.info(
          `[Notification Engine - MOCK EMAIL] To: ${user.email} | Subject: ${input.title}`,
        );
      } else if (input.channel === NotificationChannel.PUSH) {
        logger.info(
          `[Notification Engine - MOCK PUSH] User: ${user.id} | Title: ${input.title}`,
        );
      } else if (input.channel === NotificationChannel.SMS) {
        logger.info(
          `[Notification Engine - MOCK SMS] User: ${user.id} | Message: ${input.message}`,
        );
      }

      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type,
          channel: input.channel,
          status: NotificationStatus.SENT,
          metadata: input.metadata
            ? (input.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      return notification;
    } catch (err) {
      logger.error(
        `[Notification Engine] Failed to dispatch notification: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Get user's notifications (paginated with optional read filter).
   */
  async getUserNotifications(userId: string, query: NotificationQueryInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.isRead !== undefined && {
        readAt: query.isRead ? { not: null } : null,
      }),
    };

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError("Notification");
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Mark all unread notifications for user as read.
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }

  /**
   * Get unread notification count.
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return { unreadCount: count };
  }
}

export const notificationsService = new NotificationsService();

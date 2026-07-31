import type { Request, Response } from "express";
import { notificationsService } from "./notifications.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type {
  SendNotificationInput,
  NotificationQueryInput,
} from "./notifications.schema.js";

export class NotificationsController {
  /**
   * POST /api/v1/notifications/send (Admin / System)
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as SendNotificationInput;
    const notification = await notificationsService.sendNotification(input);
    sendSuccess(res, notification, {
      message: "Notification dispatched",
      statusCode: 201,
    });
  }

  /**
   * GET /api/v1/notifications
   */
  async getMyNotifications(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const query = (req.validatedQuery as NotificationQueryInput | undefined) ?? {
      page: 1,
      limit: 20,
    };
    const result = await notificationsService.getUserNotifications(req.user.id, query);
    sendSuccess(res, result, { message: "Notifications retrieved" });
  }

  /**
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const result = await notificationsService.getUnreadCount(req.user.id);
    sendSuccess(res, result, { message: "Unread notification count retrieved" });
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const updated = await notificationsService.markAsRead(req.user.id, id);
    sendSuccess(res, updated, { message: "Notification marked as read" });
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const result = await notificationsService.markAllAsRead(req.user.id);
    sendSuccess(res, result, { message: "All notifications marked as read" });
  }
}

export const notificationsController = new NotificationsController();

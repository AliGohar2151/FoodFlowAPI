import { Router, type IRouter } from "express";
import { notificationsController } from "./notifications.controller.js";
import {
  sendNotificationSchema,
  notificationQuerySchema,
} from "./notifications.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All notification endpoints require authentication
router.use(asyncHandler(authenticate));

router.post(
  "/send",
  validate({ body: sendNotificationSchema }),
  asyncHandler((req, res) => notificationsController.sendNotification(req, res)),
);

router.get(
  "/",
  validate({ query: notificationQuerySchema }),
  asyncHandler((req, res) => notificationsController.getMyNotifications(req, res)),
);

router.get(
  "/unread-count",
  asyncHandler((req, res) => notificationsController.getUnreadCount(req, res)),
);

router.patch(
  "/read-all",
  asyncHandler((req, res) => notificationsController.markAllAsRead(req, res)),
);

router.patch(
  "/:id/read",
  asyncHandler((req, res) => notificationsController.markAsRead(req, res)),
);

export default router;

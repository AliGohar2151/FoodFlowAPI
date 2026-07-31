import type { Request, Response } from "express";
import { deliveriesService } from "./deliveries.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type {
  UpdateRiderProfileInput,
  AssignDeliveryInput,
  UpdateDeliveryStatusInput,
} from "./deliveries.schema.js";

export class DeliveriesController {
  /**
   * PUT /api/v1/deliveries/rider-profile
   */
  async updateRiderProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as UpdateRiderProfileInput;
    const profile = await deliveriesService.updateRiderProfile(req.user, input);
    sendSuccess(res, profile, { message: "Rider profile updated" });
  }

  /**
   * POST /api/v1/deliveries/assign
   */
  async assignDelivery(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as AssignDeliveryInput;
    const delivery = await deliveriesService.assignDelivery(req.user, input);
    sendSuccess(res, delivery, { message: "Delivery assigned successfully" });
  }

  /**
   * PATCH /api/v1/deliveries/:id/status
   */
  async updateDeliveryStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params as { id: string };
    const input = req.validatedBody as UpdateDeliveryStatusInput;
    const updated = await deliveriesService.updateDeliveryStatus(req.user, id, input);
    sendSuccess(res, updated, { message: "Delivery status updated" });
  }

  /**
   * GET /api/v1/deliveries/order/:orderId
   */
  async getDeliveryByOrderId(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { orderId } = req.params as { orderId: string };
    const delivery = await deliveriesService.getDeliveryByOrderId(req.user, orderId);
    sendSuccess(res, delivery, { message: "Delivery details retrieved" });
  }

  /**
   * GET /api/v1/deliveries/queue
   */
  async getAvailableDeliveriesQueue(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const queue = await deliveriesService.getAvailableDeliveriesQueue(req.user);
    sendSuccess(res, queue, { message: "Available delivery queue retrieved" });
  }

  /**
   * GET /api/v1/deliveries/mine
   */
  async getMyAssignedDeliveries(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const deliveries = await deliveriesService.getMyAssignedDeliveries(req.user);
    sendSuccess(res, deliveries, { message: "Assigned deliveries retrieved" });
  }
}

export const deliveriesController = new DeliveriesController();

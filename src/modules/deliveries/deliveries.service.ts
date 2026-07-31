import { prisma } from "../../infrastructure/database/index.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";
import type {
  UpdateRiderProfileInput,
  AssignDeliveryInput,
  UpdateDeliveryStatusInput,
} from "./deliveries.schema.js";
import { DeliveryStatus, OrderStatus } from "../../generated/prisma/client.js";

const ALLOWED_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.ASSIGNED]: [DeliveryStatus.ACCEPTED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.ACCEPTED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.OUT_FOR_DELIVERY, DeliveryStatus.CANCELLED],
  [DeliveryStatus.OUT_FOR_DELIVERY]: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.CANCELLED]: [],
};

export class DeliveriesService {
  /**
   * Upsert rider profile (availability & vehicle details).
   */
  async updateRiderProfile(userContext: UserContext, input: UpdateRiderProfileInput) {
    const isRider = Boolean(userContext.roles?.includes("DELIVERY_RIDER"));
    if (!isRider) {
      throw new ForbiddenError(
        "Only users with the DELIVERY_RIDER role can manage rider profiles",
      );
    }

    const profile = await prisma.riderProfile.upsert({
      where: { userId: userContext.id },
      create: {
        userId: userContext.id,
        isAvailable: input.isAvailable ?? true,
        vehicleType: input.vehicleType ?? null,
        licensePlate: input.licensePlate ?? null,
      },
      update: {
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
        ...(input.vehicleType !== undefined && { vehicleType: input.vehicleType }),
        ...(input.licensePlate !== undefined && { licensePlate: input.licensePlate }),
      },
    });

    return profile;
  }

  /**
   * Assign a rider to a delivery / order.
   */
  async assignDelivery(userContext: UserContext, input: AssignDeliveryInput) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundError("Order");
    }

    const targetRiderId = input.riderId ?? userContext.id;

    // Check target rider exists
    const rider = await prisma.user.findUnique({
      where: { id: targetRiderId },
    });

    if (!rider) {
      throw new NotFoundError("Rider user");
    }

    // Permission check
    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isOwner = userContext.id === order.restaurant.ownerId;
    const isSelfAssigningRider = userContext.id === targetRiderId;

    if (!isAdmin && !isOwner && !isSelfAssigningRider) {
      throw new ForbiddenError("You are not authorized to assign this delivery");
    }

    const delivery = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          riderId: targetRiderId,
          status: OrderStatus.ASSIGNED,
        },
      });

      const upsertedDelivery = await tx.delivery.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          riderId: targetRiderId,
          status: DeliveryStatus.ASSIGNED,
        },
        update: {
          riderId: targetRiderId,
          status: DeliveryStatus.ASSIGNED,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.ASSIGNED,
          changedById: userContext.id,
          reason: `Rider ${targetRiderId} assigned to delivery`,
        },
      });

      return { delivery: upsertedDelivery, order: updatedOrder };
    });

    return delivery;
  }

  /**
   * Advance delivery lifecycle state (ACCEPTED -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED).
   */
  async updateDeliveryStatus(
    userContext: UserContext,
    deliveryId: string,
    input: UpdateDeliveryStatusInput,
  ) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundError("Delivery");
    }

    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isAssignedRider = delivery.riderId === userContext.id;

    if (!isAdmin && !isAssignedRider) {
      throw new ForbiddenError(
        "Only the assigned rider or admin can update delivery status",
      );
    }

    const allowedNextStates = ALLOWED_DELIVERY_TRANSITIONS[delivery.status];
    if (!allowedNextStates.includes(input.status)) {
      throw new BadRequestError(
        `Invalid delivery state transition from '${delivery.status}' to '${input.status}'`,
      );
    }

    // Map DeliveryStatus to OrderStatus equivalent where appropriate
    let targetOrderStatus: OrderStatus | undefined;
    if (input.status === DeliveryStatus.PICKED_UP) {
      targetOrderStatus = OrderStatus.PICKED_UP;
    } else if (input.status === DeliveryStatus.OUT_FOR_DELIVERY) {
      targetOrderStatus = OrderStatus.OUT_FOR_DELIVERY;
    } else if (input.status === DeliveryStatus.DELIVERED) {
      targetOrderStatus = OrderStatus.DELIVERED;
    } else if (input.status === DeliveryStatus.CANCELLED) {
      targetOrderStatus = OrderStatus.CANCELLED;
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: input.status,
          notes: input.notes ?? delivery.notes,
          ...(input.status === DeliveryStatus.PICKED_UP && { pickupTime: now }),
          ...(input.status === DeliveryStatus.DELIVERED && { deliveryTime: now }),
        },
      });

      if (targetOrderStatus) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: targetOrderStatus },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: delivery.orderId,
            fromStatus: delivery.order.status,
            toStatus: targetOrderStatus,
            changedById: userContext.id,
            reason: `Delivery status set to ${input.status}`,
          },
        });
      }

      return updatedDelivery;
    });

    return updated;
  }

  /**
   * Get delivery status by order ID.
   */
  async getDeliveryByOrderId(userContext: UserContext, orderId: string) {
    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            riderProfile: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundError("Delivery for this order");
    }

    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isCustomer = userContext.id === delivery.order.userId;
    const isOwner = userContext.id === delivery.order.restaurant.ownerId;
    const isRider = userContext.id === delivery.riderId;

    if (!isAdmin && !isCustomer && !isOwner && !isRider) {
      throw new ForbiddenError("You are not authorized to view this delivery");
    }

    return delivery;
  }

  /**
   * Query queue of unassigned or pending deliveries available for riders.
   */
  async getAvailableDeliveriesQueue(userContext: UserContext) {
    const isRider =
      Boolean(userContext.roles?.includes("DELIVERY_RIDER")) ||
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));

    if (!isRider) {
      throw new ForbiddenError("Only riders or admins can view the delivery queue");
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        OR: [
          { status: DeliveryStatus.PENDING },
          { status: DeliveryStatus.ASSIGNED, riderId: null },
        ],
      },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return deliveries;
  }

  /**
   * Query active deliveries assigned to requesting rider.
   */
  async getMyAssignedDeliveries(userContext: UserContext) {
    const deliveries = await prisma.delivery.findMany({
      where: {
        riderId: userContext.id,
        status: {
          notIn: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
        },
      },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return deliveries;
  }
}

export const deliveriesService = new DeliveriesService();

import { OrderStatus } from "../../generated/prisma/client.js";
import { BadRequestError, ForbiddenError } from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export interface OrderContextForStateTransition {
  id: string;
  userId: string; // customer ID
  restaurantId: string;
  restaurantOwnerId: string;
  riderId?: string | null;
  status: OrderStatus;
  isStaffOrOwner?: boolean;
}

/**
 * Validate if status transition from currentStatus to targetStatus is valid.
 */
export function isValidOrderTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed.includes(targetStatus);
}

/**
 * Enforce transition validity and role authorization.
 */
export function validateOrderTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  user: UserContext,
  order: OrderContextForStateTransition,
): void {
  // 1. Check if current status is terminal
  if (
    currentStatus === OrderStatus.DELIVERED ||
    currentStatus === OrderStatus.CANCELLED
  ) {
    throw new BadRequestError(
      `Cannot transition order from terminal status '${currentStatus}'`,
    );
  }

  // 2. Check state transition graph validity
  if (!isValidOrderTransition(currentStatus, targetStatus)) {
    throw new BadRequestError(
      `Invalid status transition from '${currentStatus}' to '${targetStatus}'`,
    );
  }

  // 3. Admin bypass
  const isAdmin =
    Boolean(user.roles?.includes("SUPER_ADMIN")) ||
    Boolean(user.roles?.includes("ADMIN"));
  if (isAdmin) {
    return;
  }

  const isCustomer = user.id === order.userId;
  const isRestaurantOwner = user.id === order.restaurantOwnerId;
  const isStaff = Boolean(order.isStaffOrOwner);
  const isAssignedRider = Boolean(order.riderId && user.id === order.riderId);
  const isRiderRole = Boolean(user.roles?.includes("DELIVERY_RIDER"));

  // 4. Role-based transition authorization
  if (targetStatus === OrderStatus.CANCELLED) {
    if (
      isCustomer &&
      (currentStatus === OrderStatus.PENDING || currentStatus === OrderStatus.CONFIRMED)
    ) {
      return;
    }
    if (isRestaurantOwner || isStaff) {
      return;
    }
    throw new ForbiddenError("You are not authorized to cancel this order at this stage");
  }

  if (
    targetStatus === OrderStatus.CONFIRMED ||
    targetStatus === OrderStatus.PREPARING ||
    targetStatus === OrderStatus.READY_FOR_PICKUP
  ) {
    if (isRestaurantOwner || isStaff) {
      return;
    }
    throw new ForbiddenError(
      `Only restaurant owner or staff can transition order to '${targetStatus}'`,
    );
  }

  if (targetStatus === OrderStatus.ASSIGNED) {
    if (isRestaurantOwner || isStaff || isRiderRole) {
      return;
    }
    throw new ForbiddenError("Only restaurant staff or riders can assign an order");
  }

  if (
    targetStatus === OrderStatus.PICKED_UP ||
    targetStatus === OrderStatus.OUT_FOR_DELIVERY ||
    targetStatus === OrderStatus.DELIVERED
  ) {
    if (isAssignedRider || isRiderRole) {
      return;
    }
    throw new ForbiddenError(
      `Only the assigned delivery rider can transition order to '${targetStatus}'`,
    );
  }

  throw new ForbiddenError(
    `You are not authorized to perform transition '${currentStatus}' -> '${targetStatus}'`,
  );
}

export const OrderStateMachine = {
  isValidTransition: isValidOrderTransition,
  validateTransition: validateOrderTransition,
};

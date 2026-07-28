import type { Policy, PolicyAction, UserContext } from "./policy.types.js";

export interface OrderResource {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantOwnerId?: string;
  riderId?: string | null;
}

export class OrderPolicy implements Policy<OrderResource> {
  can(user: UserContext, action: PolicyAction, resource?: OrderResource): boolean {
    const isSuperAdminOrAdmin =
      Boolean(user.roles?.includes("SUPER_ADMIN")) ||
      Boolean(user.roles?.includes("ADMIN"));

    if (isSuperAdminOrAdmin) {
      return true;
    }

    if (!resource) {
      return false;
    }

    const isCustomer = user.id === resource.customerId;
    const isRestaurantOwner = user.id === resource.restaurantOwnerId;
    const isAssignedRider = resource.riderId === user.id;

    switch (action) {
      case "read":
        return isCustomer || isRestaurantOwner || isAssignedRider;
      case "cancel":
        return isCustomer || isRestaurantOwner;
      case "update_status":
        return isRestaurantOwner || isAssignedRider;
      default:
        return false;
    }
  }
}

export const orderPolicy = new OrderPolicy();

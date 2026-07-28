import type { Policy, PolicyAction, UserContext } from "./policy.types.js";

export interface RestaurantResource {
  id: string;
  ownerId: string;
  staffUserIds?: string[];
}

export class RestaurantPolicy implements Policy<RestaurantResource> {
  can(user: UserContext, action: PolicyAction, resource?: RestaurantResource): boolean {
    const isSuperAdminOrAdmin =
      Boolean(user.roles?.includes("SUPER_ADMIN")) ||
      Boolean(user.roles?.includes("ADMIN"));

    if (isSuperAdminOrAdmin) {
      return true;
    }

    if (action === "read") {
      return true; // Public restaurant browsing
    }

    if (!resource) {
      return false;
    }

    const isOwner = user.id === resource.ownerId;
    const isStaff = resource.staffUserIds?.includes(user.id) ?? false;

    switch (action) {
      case "update":
      case "manage_menu":
      case "manage_orders":
        return isOwner || isStaff;
      case "delete":
      case "transfer_ownership":
        return isOwner;
      default:
        return false;
    }
  }
}

export const restaurantPolicy = new RestaurantPolicy();

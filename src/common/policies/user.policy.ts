import type { Policy, PolicyAction, UserContext } from "./policy.types.js";

export interface UserResource {
  id: string;
}

export class UserPolicy implements Policy<UserResource> {
  can(user: UserContext, action: PolicyAction, resource?: UserResource): boolean {
    const isSuperAdminOrAdmin =
      Boolean(user.roles?.includes("SUPER_ADMIN")) ||
      Boolean(user.roles?.includes("ADMIN"));

    if (isSuperAdminOrAdmin) {
      return true;
    }

    if (!resource) {
      return false;
    }

    const isSelf = user.id === resource.id;

    switch (action) {
      case "read":
      case "update":
        return isSelf;
      case "delete":
      case "suspend":
        return false; // Only admins can suspend/delete
      default:
        return false;
    }
  }
}

export const userPolicy = new UserPolicy();

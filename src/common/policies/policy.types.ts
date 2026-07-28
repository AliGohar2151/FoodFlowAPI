import type { UserResponse } from "../../modules/auth/auth.types.js";

export interface UserContext extends UserResponse {
  roles?: string[];
  permissions?: string[];
}

export type PolicyAction = string;

export interface Policy<TResource = unknown> {
  can(
    user: UserContext,
    action: PolicyAction,
    resource?: TResource,
  ): boolean | Promise<boolean>;
}

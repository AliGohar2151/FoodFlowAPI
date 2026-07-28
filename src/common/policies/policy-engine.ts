import { ForbiddenError, UnauthorizedError } from "../errors/index.js";
import type { Policy, PolicyAction, UserContext } from "./policy.types.js";

/**
 * Evaluate if a user can perform an action on a resource under a policy.
 */
export async function canPolicy<TResource>(
  user: UserContext | undefined,
  policy: Policy<TResource>,
  action: PolicyAction,
  resource?: TResource,
): Promise<boolean> {
  if (!user) return false;
  return policy.can(user, action, resource);
}

/**
 * Enforce policy — throws ForbiddenError if permission is denied.
 */
export async function enforcePolicy<TResource>(
  user: UserContext | undefined,
  policy: Policy<TResource>,
  action: PolicyAction,
  resource?: TResource,
  failureMessage?: string,
): Promise<void> {
  if (!user) {
    throw new UnauthorizedError("Authentication required to access resource");
  }

  const allowed = await policy.can(user, action, resource);
  if (!allowed) {
    throw new ForbiddenError(
      failureMessage ?? `Access denied — unauthorized action '${action}' on resource`,
    );
  }
}

export const PolicyEngine = {
  can: canPolicy,
  enforce: enforcePolicy,
};

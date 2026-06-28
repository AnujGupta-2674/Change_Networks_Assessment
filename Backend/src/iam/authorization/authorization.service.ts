import { collectUserIAMContext } from './policy.resolver';
import { resolvePermission } from './permission.resolver';
import { extractAllowActions } from './authorization.helpers';
import type { Action } from '../constants/actions.constants';
import { ApiError } from '../../utils/ApiError';

/**
 * The central IAM Authorization Service.
 *
 * This is the SINGLE entry point for all permission checks in the system.
 * Every `authorize()` middleware, every delegation bypass check, and every
 * effective permissions summary goes through this service — no duplication.
 *
 * Implements the full evaluation algorithm:
 *   Step 0: Root bypass      → always ALLOW
 *   Step 1: Collect context  → via policy.resolver (single DB query)
 *   Step 2: Explicit Deny    → DENY immediately
 *   Step 3: Explicit Allow   → DENY if none found (implicit deny)
 *   Step 4: Boundary check   → DENY if boundary doesn't Allow
 */
export class AuthorizationService {
  /**
   * Determines if a user is allowed to perform the given action.
   *
   * @param userId - The user's UUID (from the JWT / req.user.id)
   * @param action - The action to check (e.g. 'reports:List')
   * @returns true if ALLOWED, false if DENIED for any reason
   */
  async canPerform(userId: string, action: Action): Promise<boolean> {
    const context = await collectUserIAMContext(userId);

    // User not found → deny (defensive — shouldn't happen after authMiddleware)
    if (!context) return false;

    // ── Step 0: Root bypass ──────────────────────────────────────────────────
    // The root user is not subject to IAM checks. Always allowed.
    if (context.isRoot) return true;

    // ── Steps 2–4: Evaluate ──────────────────────────────────────────────────
    // Combine identity + group statements into a single effective list.
    const effectiveStatements = [
      ...context.identityStatements,
      ...context.groupStatements,
    ];

    const decision = resolvePermission(
      effectiveStatements,
      action,
      context.boundary,
    );

    return decision === 'ALLOW';
  }

  /**
   * Asserts the user CAN perform the action.
   * Throws ApiError(403) if they cannot.
   *
   * Convenience method for service-layer delegation bypass checks
   * where we want to throw rather than return a boolean.
   *
   * @param userId - The acting user's UUID
   * @param action - The action to require
   */
  async requirePermission(userId: string, action: Action): Promise<void> {
    const allowed = await this.canPerform(userId, action);
    if (!allowed) {
      throw new ApiError(
        403,
        `Access denied: you do not have permission to perform '${action}'`,
      );
    }
  }

  /**
   * Delegation Bypass Prevention check.
   *
   * Extracts every Allow action from the given policy statements and verifies
   * the acting user currently holds all of them. If ANY Allow action is missing,
   * throws 403.
   *
   * Called before: createPolicy, updatePolicy (statements changed), attachPolicy to group/user.
   *
   * Root users bypass this check entirely (they bypass all IAM checks).
   *
   * @param actorId    - The user performing the create/update/attach operation
   * @param statements - The policy statements being created or attached
   */
  async checkDelegationBypass(
    actorId: string,
    statements: { Effect: string; Action: string[]; Resource: string[] }[],
  ): Promise<void> {
    // Extract isRoot to skip delegation check for root
    const context = await collectUserIAMContext(actorId);
    if (!context) throw new ApiError(401, 'Unauthorized');
    if (context.isRoot) return; // Root bypasses delegation checks

    // Get all Allow actions from the statements being created/attached
    const allowActions = extractAllowActions(
      statements as { Effect: 'Allow' | 'Deny'; Action: string[]; Resource: string[] }[],
    );

    // The actor must individually hold every Allow action in the policy
    for (const action of allowActions) {
      const allowed = await this.canPerform(actorId, action);
      if (!allowed) {
        throw new ApiError(
          403,
          `Delegation bypass prevention: you do not have permission to perform '${action}'. ` +
            `You cannot create or attach a policy that grants permissions you do not hold.`,
        );
      }
    }
  }
}

/**
 * Application-wide singleton.
 * Import this instance — do not instantiate AuthorizationService directly.
 */
export const authorizationService = new AuthorizationService();

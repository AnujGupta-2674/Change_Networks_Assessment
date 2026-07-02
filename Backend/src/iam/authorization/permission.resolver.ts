import type { PolicyStatement } from '../types/iam.types';
import type { Action } from '../constants/actions.constants';
import { hasExplicitDeny, hasExplicitAllow, boundaryAllows } from './authorization.helpers';

export type PermissionDecision = 'ALLOW' | 'DENY';

/**
 *
 * This is a PURE FUNCTION — no database calls, no side effects.
 * All data collection (Step 1) and root bypass (Step 0) happen in AuthorizationService.
 *
 *   Step 2 — Explicit Deny:
 *     If ANY effective statement has Effect:"Deny" and includes the requested action
 *     → DENY immediately. No further checks. This is final.
 *
 *   Step 3 — Explicit Allow:
 *     If NO effective statement has Effect:"Allow" for the requested action
 *     → DENY (implicit deny). The user simply doesn't have permission.
 *     If an Allow is found → proceed to Step 4.
 *
 *   Step 4 — Boundary check:
 *     If no boundary is set → ALLOW.
 *     If a boundary is set:
 *       If the boundary has Effect:"Allow" for the action → ALLOW.
 *       Otherwise → DENY. The boundary caps the user's permissions.
 *
 * @param effectiveStatements - Combined identity + group policy statements (Step 1 output)
 * @param action              - The action being requested
 * @param boundaryStatements  - Boundary policy statements, or null if no boundary set
 * @returns 'ALLOW' or 'DENY'
 */
export function resolvePermission(
  effectiveStatements: PolicyStatement[],
  action: Action,
  boundaryStatements: PolicyStatement[] | null,
): PermissionDecision {
  // ── Step 2: Explicit Deny check ──────────────────────────────────────────
  // An explicit Deny always wins. No exceptions. Check this FIRST.
  if (hasExplicitDeny(effectiveStatements, action)) {
    return 'DENY';
  }

  // ── Step 3: Explicit Allow check ─────────────────────────────────────────
  // If there is no Allow for this action → implicit deny.
  if (!hasExplicitAllow(effectiveStatements, action)) {
    return 'DENY';
  }

  // An Allow was found. Proceed to boundary check.

  // ── Step 4: Boundary check ───────────────────────────────────────────────
  // If no boundary is set, the Allow stands.
  if (boundaryStatements === null) {
    return 'ALLOW';
  }

  // Boundary is set. The boundary MUST also Allow this action.
  // If the boundary doesn't Allow it → DENY (boundary caps the permission).
  // NOTE: Deny entries in the boundary are irrelevant — only Allow in boundary matters.
  if (!boundaryAllows(boundaryStatements, action)) {
    return 'DENY';
  }

  // Both identity/group Allow AND boundary Allow — full permission granted.
  return 'ALLOW';
}

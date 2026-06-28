import type { PolicyStatement } from '../types/iam.types';
import type { Action } from '../constants/actions.constants';
import { isValidAction } from '../constants/actions.constants';

/**
 * Returns true if any statement explicitly DENIES the given action.
 * Implements Step 2 of the IAM evaluation algorithm.
 * An explicit Deny always wins — checked before Allows.
 */
export function hasExplicitDeny(statements: PolicyStatement[], action: Action): boolean {
  return statements.some(
    (stmt) => stmt.Effect === 'Deny' && stmt.Action.includes(action),
  );
}

/**
 * Returns true if any statement explicitly ALLOWS the given action.
 * Implements Step 3 of the IAM evaluation algorithm.
 * Only reaches this check after confirming no Deny is present.
 */
export function hasExplicitAllow(statements: PolicyStatement[], action: Action): boolean {
  return statements.some(
    (stmt) => stmt.Effect === 'Allow' && stmt.Action.includes(action),
  );
}

/**
 * Returns true if the boundary policy explicitly ALLOWS the given action.
 * Implements Step 4 of the IAM evaluation algorithm.
 *
 * Key rule: boundary NEVER grants permissions — it only caps them.
 * This function is only called after an Allow has already been confirmed in Step 3.
 */
export function boundaryAllows(boundaryStatements: PolicyStatement[], action: Action): boolean {
  return boundaryStatements.some(
    (stmt) => stmt.Effect === 'Allow' && stmt.Action.includes(action),
  );
}

/**
 * Extracts every unique valid Action that appears in an Allow statement.
 * Used by delegation bypass prevention:
 *   before creating/updating/attaching a policy, the acting user must
 *   themselves hold permission to perform every action listed here.
 *
 * Only returns actions that exist in the known valid action list.
 * Unknown strings from malformed policies are silently ignored.
 */
export function extractAllowActions(statements: PolicyStatement[]): Action[] {
  const actions = new Set<Action>();
  for (const stmt of statements) {
    if (stmt.Effect === 'Allow') {
      for (const action of stmt.Action) {
        if (isValidAction(action)) {
          actions.add(action);
        }
      }
    }
  }
  return Array.from(actions);
}

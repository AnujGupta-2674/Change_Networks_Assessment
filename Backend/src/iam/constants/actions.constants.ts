/**
 * All valid IAM action strings in the system.
 * This is the single source of truth — all validators and resolvers import from here.
 *
 * Format: namespace:ActionName
 * Namespaces: reports, alerts, settings, audit, iam
 */
export const ACTIONS = [
  // ── Reports ─────────────────────────────────────────
  'reports:List',
  'reports:Read',
  'reports:Create',
  'reports:Update',
  'reports:Delete',

  // ── Alerts ──────────────────────────────────────────
  'alerts:List',
  'alerts:Read',
  'alerts:Create',
  'alerts:Acknowledge',
  'alerts:Delete',

  // ── Settings ────────────────────────────────────────
  'settings:Read',
  'settings:Update',

  // ── Audit ───────────────────────────────────────────
  'audit:List',
  'audit:Read',

  // ── IAM — Policies ──────────────────────────────────
  'iam:ListPolicies',
  'iam:GetPolicy',
  'iam:CreatePolicy',
  'iam:UpdatePolicy',
  'iam:DeletePolicy',

  // ── IAM — Groups ────────────────────────────────────
  'iam:ListGroups',
  'iam:GetGroup',
  'iam:CreateGroup',
  'iam:UpdateGroup',
  'iam:DeleteGroup',
  'iam:AddUserToGroup',
  'iam:RemoveUserFromGroup',
  'iam:AttachGroupPolicy',
  'iam:DetachGroupPolicy',

  // ── IAM — Users ─────────────────────────────────────
  'iam:ListUsers',
  'iam:GetUser',
  'iam:AttachUserPolicy',
  'iam:DetachUserPolicy',
  'iam:PutUserBoundary',
  'iam:DeleteUserBoundary',
] as const;

/** The union type of every valid action string */
export type Action = (typeof ACTIONS)[number];

/** Fast O(1) lookup set — use this instead of ACTIONS.includes() */
export const ACTION_SET: ReadonlySet<string> = new Set<string>(ACTIONS);

/**
 * Type-guard: returns true and narrows type to Action if the string is a valid action.
 */
export function isValidAction(action: string): action is Action {
  return ACTION_SET.has(action);
}

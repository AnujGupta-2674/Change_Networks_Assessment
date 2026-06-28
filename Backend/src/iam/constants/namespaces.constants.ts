import type { Action } from './actions.constants';

/**
 * All action namespaces in the system.
 */
export const NAMESPACES = ['reports', 'alerts', 'settings', 'audit', 'iam'] as const;
export type Namespace = (typeof NAMESPACES)[number];

/**
 * Every action grouped by its namespace.
 * Used by the Effective Permissions Summary to display results grouped by resource.
 */
export const ACTIONS_BY_NAMESPACE: Record<Namespace, Action[]> = {
  reports: [
    'reports:List',
    'reports:Read',
    'reports:Create',
    'reports:Update',
    'reports:Delete',
  ],
  alerts: [
    'alerts:List',
    'alerts:Read',
    'alerts:Create',
    'alerts:Acknowledge',
    'alerts:Delete',
  ],
  settings: ['settings:Read', 'settings:Update'],
  audit: ['audit:List', 'audit:Read'],
  iam: [
    'iam:ListPolicies',
    'iam:GetPolicy',
    'iam:CreatePolicy',
    'iam:UpdatePolicy',
    'iam:DeletePolicy',
    'iam:ListGroups',
    'iam:GetGroup',
    'iam:CreateGroup',
    'iam:UpdateGroup',
    'iam:DeleteGroup',
    'iam:AddUserToGroup',
    'iam:RemoveUserFromGroup',
    'iam:AttachGroupPolicy',
    'iam:DetachGroupPolicy',
    'iam:ListUsers',
    'iam:GetUser',
    'iam:AttachUserPolicy',
    'iam:DetachUserPolicy',
    'iam:PutUserBoundary',
    'iam:DeleteUserBoundary',
  ],
};

/**
 * Extracts the namespace prefix from an action string.
 * e.g., 'reports:List' → 'reports'
 */
export function getNamespace(action: Action): Namespace {
  const colon = action.indexOf(':');
  return action.substring(0, colon) as Namespace;
}

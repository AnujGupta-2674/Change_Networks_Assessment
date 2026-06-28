export const VALID_ACTIONS = [
  'reports:List', 'reports:Read', 'reports:Create', 'reports:Update', 'reports:Delete',
  'alerts:List', 'alerts:Read', 'alerts:Create', 'alerts:Acknowledge', 'alerts:Delete',
  'settings:Read', 'settings:Update',
  'audit:List', 'audit:Read',
  'iam:ListPolicies', 'iam:GetPolicy', 'iam:CreatePolicy', 'iam:UpdatePolicy', 'iam:DeletePolicy',
  'iam:ListGroups', 'iam:GetGroup', 'iam:CreateGroup', 'iam:UpdateGroup', 'iam:DeleteGroup',
  'iam:AddUserToGroup', 'iam:RemoveUserFromGroup',
  'iam:AttachGroupPolicy', 'iam:DetachGroupPolicy',
  'iam:ListUsers', 'iam:GetUser',
  'iam:AttachUserPolicy', 'iam:DetachUserPolicy',
  'iam:PutUserBoundary', 'iam:DeleteUserBoundary',
];

export const ACTIONS_BY_NAMESPACE = {
  reports:  VALID_ACTIONS.filter(a => a.startsWith('reports:')),
  alerts:   VALID_ACTIONS.filter(a => a.startsWith('alerts:')),
  settings: VALID_ACTIONS.filter(a => a.startsWith('settings:')),
  audit:    VALID_ACTIONS.filter(a => a.startsWith('audit:')),
  iam:      VALID_ACTIONS.filter(a => a.startsWith('iam:')),
};

export const ACTION_ROUTES = {
  'reports:List':       { method: 'GET',    url: '/reports' },
  'reports:Read':       { method: 'GET',    url: '/reports/sample-id' },
  'reports:Create':     { method: 'POST',   url: '/reports' },
  'reports:Update':     { method: 'PUT',    url: '/reports/sample-id' },
  'reports:Delete':     { method: 'DELETE', url: '/reports/sample-id' },
  'alerts:List':        { method: 'GET',    url: '/alerts' },
  'alerts:Read':        { method: 'GET',    url: '/alerts/sample-id' },
  'alerts:Create':      { method: 'POST',   url: '/alerts' },
  'alerts:Acknowledge': { method: 'PATCH',  url: '/alerts/sample-id/acknowledge' },
  'alerts:Delete':      { method: 'DELETE', url: '/alerts/sample-id' },
  'settings:Read':      { method: 'GET',    url: '/settings' },
  'settings:Update':    { method: 'PUT',    url: '/settings' },
  'audit:List':         { method: 'GET',    url: '/audit' },
  'audit:Read':         { method: 'GET',    url: '/audit/sample-id' },
};

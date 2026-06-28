import { z } from 'zod';

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
  'iam:PutUserBoundary', 'iam:DeleteUserBoundary'
] as const;

const statementSchema = z.object({
  Effect: z.enum(['Allow', 'Deny']),
  Action: z.array(z.enum(VALID_ACTIONS)).min(1, 'Action must be a non-empty array'),
  Resource: z.array(z.literal('*')).length(1, 'Resource must be ["*"]'),
});

export const createPolicySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.enum(['MANAGED', 'INLINE']),
    statements: z.array(statementSchema).min(1, 'At least one statement is required'),
  }),
});

export const updatePolicySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    statements: z.array(statementSchema).min(1, 'At least one statement is required').optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field to update must be provided',
  }),
});

import { z } from 'zod';
import { ACTIONS } from '../iam/constants/actions.constants';

/**
 * Re-export ACTIONS for any validator-level callers that still need the list.
 * The authoritative definition lives in src/iam/constants/actions.constants.ts.
 */
export { ACTIONS as VALID_ACTIONS };

const statementSchema = z.object({
  Effect: z.enum(['Allow', 'Deny']),
  Action: z
    .array(z.enum(ACTIONS))
    .min(1, 'Action must be a non-empty array'),
  Resource: z
    .array(z.literal('*'))
    .length(1, 'Resource must be ["*"]'),
});

export const createPolicySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.enum(['MANAGED', 'INLINE']),
    statements: z
      .array(statementSchema)
      .min(1, 'At least one statement is required'),
  }),
});

export const updatePolicySchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Name is required').optional(),
      description: z.string().optional(),
      statements: z
        .array(statementSchema)
        .min(1, 'At least one statement is required')
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field to update must be provided',
    }),
});

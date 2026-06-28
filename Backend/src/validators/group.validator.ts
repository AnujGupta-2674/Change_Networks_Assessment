import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
  }),
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field to update must be provided',
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid userId format'),
  }),
});

export const attachGroupPolicySchema = z.object({
  body: z.object({
    policyId: z.string().uuid('Invalid policyId format'),
  }),
});

import { z } from 'zod';

export const attachUserPolicySchema = z.object({
  body: z.object({
    policyId: z.string().uuid('Invalid policyId format'),
  }),
});

export const putUserBoundarySchema = z.object({
  body: z.object({
    policyId: z.string().uuid('Invalid policyId format'),
  }),
});

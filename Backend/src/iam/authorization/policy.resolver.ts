import prisma from '../../config/database';
import type { UserIAMContext } from '../types/iam.types';
import { parseStatements } from '../types/iam.types';

/**
 * Collects all IAM data required to evaluate permissions for a given user.
 * This implements Step 1 of the IAM evaluation algorithm.
 *
 * Performance: Uses a single Prisma query with deep includes to load:
 *   - The user's directly attached identity policies
 *   - All groups the user belongs to, and each group's attached policies
 *   - The user's boundary policy (if any)
 *
 * @param userId - The user's UUID
 * @returns UserIAMContext, or null if the user does not exist
 */
export async function collectUserIAMContext(userId: string): Promise<UserIAMContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isRoot: true,
      policyAttachments: {
        include: {
          policy: {
            select: { statements: true },
          },
        },
      },
      memberships: {
        include: {
          group: {
            include: {
              policyAttachments: {
                include: {
                  policy: {
                    select: { statements: true },
                  },
                },
              },
            },
          },
        },
      },
      boundary: {
        include: {
          policy: {
            select: { statements: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  // ── Identity statements ─────────────────────────────────────────────────
  // Statements from all policies directly attached to this user.
  const identityStatements = user.policyAttachments.flatMap((attachment) =>
    parseStatements(attachment.policy.statements),
  );

  // ── Group statements ────────────────────────────────────────────────────
  // Statements from all policies attached to every group this user belongs to.
  const groupStatements = user.memberships.flatMap((membership) =>
    membership.group.policyAttachments.flatMap((groupAttachment) =>
      parseStatements(groupAttachment.policy.statements),
    ),
  );

  // ── Boundary statements ─────────────────────────────────────────────────
  // If a boundary is set, parse its statements. Otherwise null.
  const boundary = user.boundary
    ? parseStatements(user.boundary.policy.statements)
    : null;

  return {
    isRoot: user.isRoot,
    identityStatements,
    groupStatements,
    boundary,
  };
}

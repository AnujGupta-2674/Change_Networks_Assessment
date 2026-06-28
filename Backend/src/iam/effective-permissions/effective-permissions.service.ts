import prisma from '../../config/database';
import { collectUserIAMContext } from '../authorization/policy.resolver';
import { resolvePermission } from '../authorization/permission.resolver';
import { ACTIONS, type Action } from '../constants/actions.constants';
import { ACTIONS_BY_NAMESPACE, NAMESPACES, type Namespace } from '../constants/namespaces.constants';
import { extractAllowActions } from '../authorization/authorization.helpers';
import type { PolicyStatement } from '../types/iam.types';
import { ApiError } from '../../utils/ApiError';

type PermissionStatus = 'ALLOW' | 'DENY';

export interface EffectivePermissionsResult {
  userId: string;
  userName: string;
  isRoot: boolean;
  /** Actions explicitly Allowed by identity (direct) policies */
  identityAllows: Action[];
  /** Actions explicitly Denied by identity (direct) policies */
  identityDenies: Action[];
  /** Actions explicitly Allowed by group policies */
  groupAllows: Action[];
  /** Actions explicitly Denied by group policies */
  groupDenies: Action[];
  /** Boundary policy info (null if no boundary set) */
  boundaryPolicy: {
    policyId: string;
    policyName: string;
    /** Actions the boundary Allows */
    allows: Action[];
  } | null;
  /**
   * Final computed permission per action, grouped by namespace.
   * This is the authoritative result — computed by the same algorithm
   * used by the authorize() middleware (zero duplication).
   */
  effectivePermissions: Record<Namespace, Record<string, PermissionStatus>>;
}

/**
 * Computes the full effective permission summary for a user.
 *
 * This service reuses the SAME authorization engine (collectUserIAMContext +
 * resolvePermission) used by the authorize() middleware — no separate logic,
 * no risk of divergence.
 *
 * For root users, all actions are ALLOW.
 *
 * @param targetUserId - The user whose permissions to summarize
 * @returns EffectivePermissionsResult
 */
export async function getEffectivePermissionsForUser(
  targetUserId: string,
  organizationId: string
): Promise<EffectivePermissionsResult> {
  // Load user display info
  const userRecord = await prisma.user.findFirst({
    where: { id: targetUserId, organizationId },
    select: { id: true, name: true, isRoot: true },
  });
  if (!userRecord) throw new ApiError(404, 'User not found');

  // Load IAM context (same single query used by authorize())
  const context = await collectUserIAMContext(targetUserId);
  if (!context) throw new ApiError(404, 'User not found');

  // ── Root user — all actions ALLOW ─────────────────────────────────────
  if (context.isRoot) {
    const effectivePermissions = buildPermissionsMap(() => 'ALLOW');
    return {
      userId: userRecord.id,
      userName: userRecord.name,
      isRoot: true,
      identityAllows: [...ACTIONS],
      identityDenies: [],
      groupAllows: [],
      groupDenies: [],
      boundaryPolicy: null,
      effectivePermissions,
    };
  }

  // ── Extract categorized allows/denies ──────────────────────────────────
  const identityAllows = extractAllowActions(context.identityStatements);
  const identityDenies = extractDenyActions(context.identityStatements);
  const groupAllows = extractAllowActions(context.groupStatements);
  const groupDenies = extractDenyActions(context.groupStatements);

  // ── Boundary info ──────────────────────────────────────────────────────
  let boundaryPolicy: EffectivePermissionsResult['boundaryPolicy'] = null;

  if (context.boundary !== null) {
    // We need the boundary policy name — do an extra targeted query
    const boundaryRecord = await prisma.userBoundary.findUnique({
      where: { userId: targetUserId },
      include: { policy: { select: { id: true, name: true } } },
    });
    if (boundaryRecord) {
      const boundaryAllowActions = extractAllowActions(context.boundary);
      boundaryPolicy = {
        policyId: boundaryRecord.policy.id,
        policyName: boundaryRecord.policy.name,
        allows: boundaryAllowActions,
      };
    }
  }

  // ── Compute final effective permissions ───────────────────────────────
  // Reuse the EXACT same resolvePermission() function used by authorize().
  // This guarantees the summary matches what the middleware actually enforces.
  const effectiveStatements = [
    ...context.identityStatements,
    ...context.groupStatements,
  ];

  const effectivePermissions = buildPermissionsMap((action) =>
    resolvePermission(effectiveStatements, action, context.boundary),
  );

  return {
    userId: userRecord.id,
    userName: userRecord.name,
    isRoot: false,
    identityAllows,
    identityDenies,
    groupAllows,
    groupDenies,
    boundaryPolicy,
    effectivePermissions,
  };
}

// ── Private helpers ─────────────────────────────────────────────────────────

function extractDenyActions(statements: PolicyStatement[]): Action[] {
  const actions = new Set<Action>();
  for (const stmt of statements) {
    if (stmt.Effect === 'Deny') {
      for (const action of stmt.Action) {
        // Validate it's a known action before adding
        if (ACTIONS.includes(action as Action)) {
          actions.add(action as Action);
        }
      }
    }
  }
  return Array.from(actions);
}

function buildPermissionsMap(
  resolver: (action: Action) => PermissionStatus,
): Record<Namespace, Record<string, PermissionStatus>> {
  const result = {} as Record<Namespace, Record<string, PermissionStatus>>;
  for (const ns of NAMESPACES) {
    result[ns] = {};
    const nsActions = ACTIONS_BY_NAMESPACE[ns];
    for (const action of nsActions) {
      result[ns][action] = resolver(action);
    }
  }
  return result;
}

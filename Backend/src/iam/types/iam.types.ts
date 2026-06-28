/**
 * Represents a single IAM policy statement.
 * This is the runtime representation of the JSON stored in the Policy.statements field.
 *
 * We define it here (not in Prisma types) because Prisma exposes `statements` as
 * opaque `JsonValue`. This interface is the authoritative typed shape.
 */
export interface PolicyStatement {
  Effect: 'Allow' | 'Deny';
  /** Array of action strings, e.g. ['reports:List', 'reports:Read'] */
  Action: string[];
  /** Always ['*'] in this system */
  Resource: string[];
}

/**
 * The complete IAM context for a user, collected in a single DB round-trip.
 * Separates identity vs group statements so the Effective Permissions
 * summary can show them independently.
 */
export interface UserIAMContext {
  isRoot: boolean;
  /** Statements from policies directly attached to the user */
  identityStatements: PolicyStatement[];
  /** Statements from policies attached to the user's groups */
  groupStatements: PolicyStatement[];
  /** Boundary policy statements, or null if no boundary is set */
  boundary: PolicyStatement[] | null;
}

/**
 * Safely parses a Prisma JsonValue into an array of PolicyStatements.
 * Returns an empty array if the value is malformed rather than throwing.
 */
export function parseStatements(rawStatements: unknown): PolicyStatement[] {
  if (!Array.isArray(rawStatements)) return [];

  const result: PolicyStatement[] = [];
  for (const item of rawStatements) {
    if (typeof item !== 'object' || item === null) continue;
    const stmt = item as Record<string, unknown>;

    const effect = stmt['Effect'];
    const action = stmt['Action'];
    const resource = stmt['Resource'];

    if (
      (effect === 'Allow' || effect === 'Deny') &&
      Array.isArray(action) &&
      Array.isArray(resource)
    ) {
      result.push({
        Effect: effect,
        Action: action as string[],
        Resource: resource as string[],
      });
    }
  }
  return result;
}

/**
 * Phase 2 Verification Script — Pure IAM Engine Tests
 *
 * Tests the authorization engine without hitting the database.
 * Validates every evaluation scenario from the assessment specification.
 *
 * Run with:  npx ts-node src/iam/verify.ts
 */

import { resolvePermission } from './authorization/permission.resolver';
import { extractAllowActions } from './authorization/authorization.helpers';
import type { PolicyStatement } from './types/iam.types';
import type { Action } from './constants/actions.constants';

// ── Test Infrastructure ────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(
  description: string,
  actual: string | boolean,
  expected: string | boolean,
): void {
  if (actual === expected) {
    console.log(`  ✅ PASS — ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${description}`);
    console.error(`       Expected: ${String(expected)}`);
    console.error(`       Actual:   ${String(actual)}`);
    failed++;
  }
}

function suite(name: string, fn: () => void): void {
  console.log(`\n📋 ${name}`);
  fn();
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const allowReportsList: PolicyStatement = {
  Effect: 'Allow',
  Action: ['reports:List'],
  Resource: ['*'],
};

const allowReportsRead: PolicyStatement = {
  Effect: 'Allow',
  Action: ['reports:Read'],
  Resource: ['*'],
};

const allowReportsAll: PolicyStatement = {
  Effect: 'Allow',
  Action: ['reports:List', 'reports:Read', 'reports:Create', 'reports:Update', 'reports:Delete'],
  Resource: ['*'],
};

const denyReportsDelete: PolicyStatement = {
  Effect: 'Deny',
  Action: ['reports:Delete'],
  Resource: ['*'],
};

const denyAlerts: PolicyStatement = {
  Effect: 'Deny',
  Action: ['alerts:List', 'alerts:Read'],
  Resource: ['*'],
};

const boundaryReadOnly: PolicyStatement = {
  Effect: 'Allow',
  Action: ['reports:List', 'reports:Read', 'alerts:List', 'alerts:Read', 'audit:List', 'audit:Read'],
  Resource: ['*'],
};

const boundaryNarrow: PolicyStatement = {
  Effect: 'Allow',
  Action: ['reports:List'],
  Resource: ['*'],
};

// ── Suite 1: Root Bypass (tested at service level, but verify no statement logic needed) ──

suite('Scenario 1 — Implicit Deny (no matching Allow)', () => {
  const statements: PolicyStatement[] = [];

  assert(
    'No statements → DENY (implicit)',
    resolvePermission(statements, 'reports:List', null),
    'DENY',
  );

  assert(
    'Allow for different action → DENY for requested action',
    resolvePermission([allowReportsRead], 'reports:List', null),
    'DENY',
  );

  assert(
    'Empty statements, boundary set → still DENY (implicit)',
    resolvePermission(statements, 'reports:List', [boundaryReadOnly]),
    'DENY',
  );
});

suite('Scenario 2 — Explicit Allow (no boundary)', () => {
  assert(
    'Single Allow matching action → ALLOW',
    resolvePermission([allowReportsList], 'reports:List', null),
    'ALLOW',
  );

  assert(
    'Allow with multiple actions, checking one of them → ALLOW',
    resolvePermission([allowReportsAll], 'reports:Delete', null),
    'ALLOW',
  );

  assert(
    'Multiple Allow statements, one matches → ALLOW',
    resolvePermission([allowReportsList, allowReportsRead], 'reports:Read', null),
    'ALLOW',
  );
});

suite('Scenario 3 — Explicit Deny overrides Allow', () => {
  assert(
    'Allow + Deny for same action → DENY (Deny wins)',
    resolvePermission([allowReportsAll, denyReportsDelete], 'reports:Delete', null),
    'DENY',
  );

  assert(
    'Deny listed first, then Allow → DENY (order irrelevant)',
    resolvePermission([denyReportsDelete, allowReportsAll], 'reports:Delete', null),
    'DENY',
  );

  assert(
    'Deny for action A, Allow for action B — check action A → DENY',
    resolvePermission([allowReportsList, denyReportsDelete], 'reports:Delete', null),
    'DENY',
  );

  assert(
    'Deny for action A, Allow for action B — check action B → ALLOW',
    resolvePermission([allowReportsList, denyReportsDelete], 'reports:List', null),
    'ALLOW',
  );
});

suite('Scenario 4 — Boundary allows (boundary does not restrict)', () => {
  assert(
    'Allow + boundary also allows → ALLOW',
    resolvePermission([allowReportsList], 'reports:List', [boundaryReadOnly]),
    'ALLOW',
  );

  assert(
    'Multiple Allows + boundary covers action → ALLOW',
    resolvePermission([allowReportsAll], 'reports:List', [boundaryReadOnly]),
    'ALLOW',
  );
});

suite('Scenario 5 — Boundary restricts (boundary caps permissions)', () => {
  assert(
    'Allow exists but boundary does NOT allow → DENY',
    resolvePermission([allowReportsAll], 'reports:Delete', [boundaryReadOnly]),
    'DENY',
  );

  assert(
    'Allow exists + boundary allows reports:List only, check reports:Read → DENY',
    resolvePermission([allowReportsAll], 'reports:Read', [boundaryNarrow]),
    'DENY',
  );

  assert(
    'Allow exists + boundary allows reports:List only, check reports:List → ALLOW',
    resolvePermission([allowReportsAll], 'reports:List', [boundaryNarrow]),
    'ALLOW',
  );
});

suite('Scenario 6 — Boundary does NOT grant (boundary alone is not enough)', () => {
  // Critical: boundary only caps — it does not grant
  assert(
    'No Allow in identity/group, boundary has Allow → still DENY (boundary cannot grant)',
    resolvePermission([], 'reports:List', [boundaryReadOnly]),
    'DENY',
  );

  assert(
    'Only Deny in identity, boundary has Allow → still DENY (Deny wins first)',
    resolvePermission([denyReportsDelete], 'reports:Delete', [boundaryReadOnly]),
    'DENY',
  );
});

suite('Scenario 7 — Multiple groups, multiple policies (flatten all statements)', () => {
  // Simulate: identity has nothing, group 1 has Allow, group 2 has Deny → Deny wins
  const groupOneStatements: PolicyStatement[] = [allowReportsList];
  const groupTwoStatements: PolicyStatement[] = [denyReportsDelete];
  const identityStatements: PolicyStatement[] = [];

  const allEffective = [
    ...identityStatements,
    ...groupOneStatements,
    ...groupTwoStatements,
  ];

  assert(
    'Group 1 allows List, Group 2 denies Delete — check List → ALLOW',
    resolvePermission(allEffective, 'reports:List', null),
    'ALLOW',
  );

  assert(
    'Group 1 allows List, Group 2 denies Delete — check Delete → DENY',
    resolvePermission(allEffective, 'reports:Delete', null),
    'DENY',
  );
});

suite('Scenario 8 — Conflicting Allow + Deny across groups', () => {
  const groupOneAllows: PolicyStatement = {
    Effect: 'Allow',
    Action: ['reports:List', 'reports:Delete'],
    Resource: ['*'],
  };
  const groupTwoDenies: PolicyStatement = {
    Effect: 'Deny',
    Action: ['reports:Delete'],
    Resource: ['*'],
  };

  assert(
    'Group 1 allows Delete, Group 2 denies Delete → DENY (Deny always wins)',
    resolvePermission([groupOneAllows, groupTwoDenies], 'reports:Delete', null),
    'DENY',
  );

  assert(
    'Group 1 allows List (no conflict) → ALLOW',
    resolvePermission([groupOneAllows, groupTwoDenies], 'reports:List', null),
    'ALLOW',
  );
});

suite('Scenario 9 — extractAllowActions (delegation bypass helper)', () => {
  const statements: PolicyStatement[] = [
    {
      Effect: 'Allow',
      Action: ['reports:List', 'reports:Read'],
      Resource: ['*'],
    },
    {
      Effect: 'Deny',
      Action: ['reports:Delete'],
      Resource: ['*'],
    },
    {
      Effect: 'Allow',
      Action: ['alerts:List'],
      Resource: ['*'],
    },
  ];

  const allowActions = extractAllowActions(statements);
  const allowSet = new Set<string>(allowActions);

  assert(
    'extractAllowActions includes reports:List (from Allow stmt)',
    allowSet.has('reports:List'),
    true,
  );
  assert(
    'extractAllowActions includes reports:Read (from Allow stmt)',
    allowSet.has('reports:Read'),
    true,
  );
  assert(
    'extractAllowActions includes alerts:List (from Allow stmt)',
    allowSet.has('alerts:List'),
    true,
  );
  assert(
    'extractAllowActions does NOT include reports:Delete (from Deny stmt)',
    allowSet.has('reports:Delete'),
    false,
  );
  assert(
    'extractAllowActions returns 3 unique actions',
    allowActions.length === 3,
    true,
  );
});

suite('Scenario 10 — Deny + no Allow + boundary (all three combined)', () => {
  // Explicit Deny + boundary has Allow → Deny still wins (Step 2 before Step 4)
  assert(
    'Explicit Deny present + boundary allows → DENY (Deny wins in Step 2)',
    resolvePermission(
      [denyReportsDelete, allowReportsAll],
      'reports:Delete',
      [boundaryReadOnly], // boundary also has Allow for reports via separate scenarios
    ),
    'DENY',
  );
});

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Phase 2 Verification: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('✅ ALL SCENARIOS PASS — Phase 2 authorization engine is correct.');
} else {
  console.error(`❌ ${failed} SCENARIO(S) FAILED — review the authorization engine.`);
  process.exit(1);
}

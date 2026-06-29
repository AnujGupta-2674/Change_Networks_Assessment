/**
 * seed-policies.ts
 * 
 * Seeds additional managed policies via the backend API.
 * Run with: npx ts-node seed-policies.ts
 * 
 * Prerequisites:
 * - Backend must be running on port 4000
 * - ROOT credentials must match the seed (root@org.local / root1234)
 */

const BASE_URL = 'http://localhost:3000/api';

const POLICIES = [
  {
    name: 'IAMReadOnly',
    description: 'Read-only access to IAM resources. Can list and view users, groups, and policies.',
    type: 'MANAGED',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'iam:ListUsers',
          'iam:GetUser',
          'iam:ListGroups',
          'iam:GetGroup',
          'iam:ListPolicies',
          'iam:GetPolicy',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    name: 'IAMFullAccess',
    description: 'Full access to all IAM management operations including users, groups, policies, and boundaries.',
    type: 'MANAGED',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'iam:ListUsers',
          'iam:GetUser',
          'iam:ListGroups',
          'iam:GetGroup',
          'iam:CreateGroup',
          'iam:UpdateGroup',
          'iam:DeleteGroup',
          'iam:AddUserToGroup',
          'iam:RemoveUserFromGroup',
          'iam:ListPolicies',
          'iam:GetPolicy',
          'iam:CreatePolicy',
          'iam:UpdatePolicy',
          'iam:DeletePolicy',
          'iam:AttachGroupPolicy',
          'iam:DetachGroupPolicy',
          'iam:AttachUserPolicy',
          'iam:DetachUserPolicy',
          'iam:PutUserBoundary',
          'iam:DeleteUserBoundary',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    name: 'AlertsManager',
    description: 'Full management access to alerts including create, acknowledge, and delete.',
    type: 'MANAGED',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'alerts:List',
          'alerts:Read',
          'alerts:Create',
          'alerts:Acknowledge',
          'alerts:Delete',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    name: 'ReportsManager',
    description: 'Full management access to reports including create, update, and delete.',
    type: 'MANAGED',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'reports:List',
          'reports:Read',
          'reports:Create',
          'reports:Update',
          'reports:Delete',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    name: 'AuditReadOnly',
    description: 'Read-only access to audit logs and audit records.',
    type: 'MANAGED',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'audit:List',
          'audit:Read',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    name: 'SettingsManager',
    description: 'Full access to view and update system settings.',
    type: 'MANAGED',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'settings:Read',
          'settings:Update',
        ],
        Resource: ['*'],
      },
    ],
  },
];

async function seedPolicies() {
  console.log('🌱 Starting policy seed...\n');

  // Step 1: Login as root
  console.log('🔐 Logging in as root...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'root@org.local', password: 'root1234' }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.json();
    console.error('❌ Login failed:', err.message);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;

  if (!token) {
    console.error('❌ No token received. Check login response.');
    process.exit(1);
  }

  console.log('✅ Logged in successfully\n');

  // Step 2: Create each policy
  let created = 0;
  let skipped = 0;

  for (const policy of POLICIES) {
    process.stdout.write(`📋 Creating "${policy.name}"... `);

    const res = await fetch(`${BASE_URL}/iam/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(policy),
    });

    if (res.status === 201) {
      console.log('✅ Created');
      created++;
    } else if (res.status === 409) {
      console.log('⏭️  Already exists (skipped)');
      skipped++;
    } else {
      const err = await res.json();
      console.log(`❌ Failed: ${err.message}`);
    }
  }

  console.log(`\n🏁 Done! Created: ${created}, Skipped: ${skipped}`);
}

seedPolicies().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});

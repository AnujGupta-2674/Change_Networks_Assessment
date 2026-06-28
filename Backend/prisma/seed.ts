import { PrismaClient, PolicyType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Hash passwords
  const rootPassword = await bcrypt.hash('root1234', 10);
  const alicePassword = await bcrypt.hash('alice1234', 10);
  const bobPassword = await bcrypt.hash('bob1234', 10);
  const charliePassword = await bcrypt.hash('charlie1234', 10);

  // Users
  const rootUser = await prisma.user.upsert({
    where: { email: 'root@org.local' },
    update: {},
    create: {
      name: 'Root',
      email: 'root@org.local',
      passwordHash: rootPassword,
      isRoot: true,
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@org.local' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@org.local',
      passwordHash: alicePassword,
      isRoot: false,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@org.local' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@org.local',
      passwordHash: bobPassword,
      isRoot: false,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@org.local' },
    update: {},
    create: {
      name: 'Charlie',
      email: 'charlie@org.local',
      passwordHash: charliePassword,
      isRoot: false,
    },
  });

  // Policies
  const readOnlyPolicy = await prisma.policy.upsert({
    where: { name: 'ReadOnlyAccess' },
    update: {},
    create: {
      name: 'ReadOnlyAccess',
      type: PolicyType.MANAGED,
      statements: [
        {
          Effect: 'Allow',
          Action: [
            'reports:List',
            'reports:Read',
            'alerts:List',
            'alerts:Read',
            'audit:List',
            'audit:Read',
          ],
          Resource: ['*'],
        },
      ],
    },
  });

  const reportsFullPolicy = await prisma.policy.upsert({
    where: { name: 'ReportsFullAccess' },
    update: {},
    create: {
      name: 'ReportsFullAccess',
      type: PolicyType.MANAGED,
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
  });

  // Group
  const viewersGroup = await prisma.group.upsert({
    where: { name: 'Viewers' },
    update: {},
    create: {
      name: 'Viewers',
      description: 'Users with read-only access to most resources',
    },
  });

  // Attachments & Memberships
  // Attach ReadOnlyAccess to Viewers group
  await prisma.groupPolicyAttachment.upsert({
    where: {
      groupId_policyId: {
        groupId: viewersGroup.id,
        policyId: readOnlyPolicy.id,
      },
    },
    update: {},
    create: {
      groupId: viewersGroup.id,
      policyId: readOnlyPolicy.id,
    },
  });

  // Add Alice to Viewers group
  await prisma.userGroupMembership.upsert({
    where: {
      userId_groupId: {
        userId: alice.id,
        groupId: viewersGroup.id,
      },
    },
    update: {},
    create: {
      userId: alice.id,
      groupId: viewersGroup.id,
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

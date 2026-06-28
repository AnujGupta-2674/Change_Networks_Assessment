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

  // Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Change Networks',
    }
  });

  // Users
  const rootUser = await prisma.user.upsert({
    where: { email: 'root@org.local' },
    update: {},
    create: {
      name: 'Root',
      email: 'root@org.local',
      passwordHash: rootPassword,
      isRoot: true,
      organizationId: org.id,
    },
  });

  await prisma.organization.update({
    where: { id: org.id },
    data: { ownerId: rootUser.id },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@org.local' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@org.local',
      passwordHash: alicePassword,
      isRoot: false,
      organizationId: org.id,
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
      organizationId: org.id,
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
      organizationId: org.id,
    },
  });

  // Policies
  const readOnlyPolicy = await prisma.policy.create({
    data: {
      name: 'ReadOnlyAccess',
      type: PolicyType.MANAGED,
      organizationId: org.id,
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
      createdBy: rootUser.id,
    },
  });

  const reportsFullPolicy = await prisma.policy.create({
    data: {
      name: 'ReportsFullAccess',
      type: PolicyType.MANAGED,
      organizationId: org.id,
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
      createdBy: rootUser.id,
    },
  });

  // Group
  const viewersGroup = await prisma.group.create({
    data: {
      name: 'Viewers',
      description: 'Users with read-only access to most resources',
      organizationId: org.id,
      createdBy: rootUser.id,
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

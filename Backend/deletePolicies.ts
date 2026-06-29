import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Deleting all policies...');
  await prisma.policy.deleteMany();
  console.log('All policies deleted.');
}
main().finally(() => prisma.$disconnect());

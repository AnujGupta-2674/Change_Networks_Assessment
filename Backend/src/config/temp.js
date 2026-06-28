import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log(prisma.group);
console.log(prisma.policy);
console.log(prisma.userGroupMembership);
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return await prisma.user.create({
      data,
    });
  }

  async findAll() {
    return await prisma.user.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            policyAttachments: true,
          },
        },
        boundary: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdWithIAM(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isRoot: true,
        policyAttachments: {
          include: {
            policy: true,
          },
        },
        memberships: {
          include: {
            group: {
              include: {
                policyAttachments: {
                  include: {
                    policy: true,
                  },
                },
              },
            },
          },
        },
        boundary: {
          include: {
            policy: true,
          },
        },
      },
    });
  }

  async attachPolicy(userId: string, policyId: string) {
    return await prisma.userPolicyAttachment.create({
      data: { userId, policyId },
    });
  }

  async detachPolicy(userId: string, policyId: string) {
    return await prisma.userPolicyAttachment.delete({
      where: {
        userId_policyId: { userId, policyId },
      },
    });
  }

  async findPolicyAttachment(userId: string, policyId: string) {
    return await prisma.userPolicyAttachment.findUnique({
      where: {
        userId_policyId: { userId, policyId },
      },
    });
  }

  async setBoundary(userId: string, policyId: string) {
    return await prisma.userBoundary.upsert({
      where: { userId },
      update: { policyId },
      create: { userId, policyId },
    });
  }

  async removeBoundary(userId: string) {
    return await prisma.userBoundary.delete({
      where: { userId },
    });
  }
}

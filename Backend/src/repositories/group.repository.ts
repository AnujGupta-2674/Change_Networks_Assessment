import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class GroupRepository {
  async create(data: Prisma.GroupCreateInput) {
    return await prisma.group.create({ data });
  }

  async findByName(name: string) {
    return await prisma.group.findUnique({ where: { name } });
  }

  async findAll() {
    return await prisma.group.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            policyAttachments: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string) {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        policyAttachments: {
          include: {
            policy: {
              select: { id: true, name: true, type: true }
            }
          }
        }
      }
    });
  }

  async update(id: string, data: Prisma.GroupUpdateInput) {
    return await prisma.group.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await prisma.group.delete({ where: { id } });
  }

  async addMember(groupId: string, userId: string) {
    return await prisma.userGroupMembership.create({
      data: { groupId, userId }
    });
  }

  async removeMember(groupId: string, userId: string) {
    return await prisma.userGroupMembership.delete({
      where: {
        userId_groupId: { userId, groupId }
      }
    });
  }

  async attachPolicy(groupId: string, policyId: string) {
    return await prisma.groupPolicyAttachment.create({
      data: { groupId, policyId }
    });
  }

  async detachPolicy(groupId: string, policyId: string) {
    return await prisma.groupPolicyAttachment.delete({
      where: {
        groupId_policyId: { groupId, policyId }
      }
    });
  }

  async findMembership(groupId: string, userId: string) {
    return await prisma.userGroupMembership.findUnique({
      where: {
        userId_groupId: { userId, groupId }
      }
    });
  }

  async findPolicyAttachment(groupId: string, policyId: string) {
    return await prisma.groupPolicyAttachment.findUnique({
      where: {
        groupId_policyId: { groupId, policyId }
      }
    });
  }
}

import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class GroupRepository {
  async create(data: Prisma.GroupCreateInput) {
    return await prisma.group.create({ data });
  }

  async findByName(name: string, organizationId: string) {
    return await prisma.group.findUnique({ where: { name_organizationId: { name, organizationId } } });
  }

  async findAll(organizationId: string) {
    return await prisma.group.findMany({
      where: { organizationId },
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

  async findById(id: string, organizationId: string) {
    return await prisma.group.findFirst({
      where: { id, organizationId },
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

  async update(id: string, organizationId: string, data: Prisma.GroupUpdateInput) {
    // We only update if it belongs to the org
    return await prisma.group.updateMany({
      where: { id, organizationId },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    return await prisma.group.deleteMany({ where: { id, organizationId } });
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

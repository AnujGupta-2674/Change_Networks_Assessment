import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class PolicyRepository {
  async create(data: Prisma.PolicyCreateInput) {
    return await prisma.policy.create({ data });
  }

  async findByName(name: string, organizationId: string) {
    return await prisma.policy.findUnique({ where: { name_organizationId: { name, organizationId } } });
  }

  async findAll(organizationId: string) {
    return await prisma.policy.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string, organizationId: string) {
    return await prisma.policy.findFirst({ where: { id, organizationId } });
  }

  async update(id: string, organizationId: string, data: Prisma.PolicyUpdateInput) {
    return await prisma.policy.updateMany({
      where: { id, organizationId },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    return await prisma.policy.deleteMany({ where: { id, organizationId } });
  }

  async findGroupAttachments(policyId: string) {
    return await prisma.groupPolicyAttachment.findMany({ where: { policyId } });
  }

  async findUserAttachments(policyId: string) {
    return await prisma.userPolicyAttachment.findMany({ where: { policyId } });
  }
}

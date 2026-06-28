import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class PolicyRepository {
  async create(data: Prisma.PolicyCreateInput) {
    return await prisma.policy.create({ data });
  }

  async findByName(name: string) {
    return await prisma.policy.findUnique({ where: { name } });
  }

  async findAll() {
    return await prisma.policy.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string) {
    return await prisma.policy.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.PolicyUpdateInput) {
    return await prisma.policy.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await prisma.policy.delete({ where: { id } });
  }

  async findGroupAttachments(policyId: string) {
    return await prisma.groupPolicyAttachment.findMany({ where: { policyId } });
  }

  async findUserAttachments(policyId: string) {
    return await prisma.userPolicyAttachment.findMany({ where: { policyId } });
  }
}

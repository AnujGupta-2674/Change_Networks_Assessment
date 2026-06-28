import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class OrganizationRepository {
  async create(data: Prisma.OrganizationCreateInput) {
    return await prisma.organization.create({
      data,
    });
  }

  async findById(id: string) {
    return await prisma.organization.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.OrganizationUpdateInput) {
    return await prisma.organization.update({
      where: { id },
      data,
    });
  }
}

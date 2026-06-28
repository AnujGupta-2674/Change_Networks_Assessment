import { UserRepository } from '../repositories/user.repository';
import { PolicyRepository } from '../repositories/policy.repository';
import { ApiError } from '../utils/ApiError';
import { User } from '@prisma/client';

export class UserService {
  private userRepo = new UserRepository();
  private policyRepo = new PolicyRepository();

  async listUsers() {
    const users = await this.userRepo.findAll();
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isRoot: user.isRoot,
      groupCount: user._count.memberships,
      directPolicyCount: user._count.policyAttachments,
      boundary: user.boundary ? true : false
    }));
  }

  async getUser(id: string) {
    const user = await this.userRepo.findByIdWithIAM(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async attachPolicy(userId: string, policyId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const policy = await this.policyRepo.findById(policyId);
    if (!policy) throw new ApiError(404, 'Policy not found');

    if (policy.type !== 'MANAGED') {
      throw new ApiError(400, 'Only MANAGED policies can be attached this way');
    }

    const existing = await this.userRepo.findPolicyAttachment(userId, policyId);
    if (existing) throw new ApiError(409, 'Policy already attached to user');

    await this.userRepo.attachPolicy(userId, policyId);
    return { success: true };
  }

  async detachPolicy(userId: string, policyId: string) {
    const attachment = await this.userRepo.findPolicyAttachment(userId, policyId);
    if (!attachment) throw new ApiError(404, 'Policy attachment not found');

    await this.userRepo.detachPolicy(userId, policyId);
    return { success: true };
  }

  async setBoundary(userId: string, policyId: string, currentUser: User) {
    if (!currentUser.isRoot) {
      throw new ApiError(403, 'Only the root user can set a boundary on a user');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const policy = await this.policyRepo.findById(policyId);
    if (!policy) throw new ApiError(404, 'Policy not found');
    if (policy.type !== 'MANAGED') {
      throw new ApiError(400, 'Boundary policy must be a MANAGED policy');
    }

    await this.userRepo.setBoundary(userId, policyId);
    return { success: true };
  }

  async removeBoundary(userId: string, currentUser: User) {
    if (!currentUser.isRoot) {
      throw new ApiError(403, 'Only the root user can remove a boundary from a user');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    try {
      await this.userRepo.removeBoundary(userId);
    } catch (error) {
      // Ignore if no boundary existed
    }
    return { success: true };
  }
}

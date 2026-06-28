import { UserRepository } from '../repositories/user.repository';
import { PolicyRepository } from '../repositories/policy.repository';
import { ApiError } from '../utils/ApiError';
import { authorizationService } from '../iam/authorization/authorization.service';
import type { User } from '@prisma/client';

import { PolicyType } from '@prisma/client';
import bcrypt from 'bcrypt';

export class UserService {
  private userRepo = new UserRepository();
  private policyRepo = new PolicyRepository();

  async createUser(data: any, organizationId: string) {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.userRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      isRoot: data.isRoot || false,
      organizationId,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async listUsers(organizationId: string) {
    const users = await this.userRepo.findAll(organizationId);
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isRoot: user.isRoot,
      groupCount: user._count.memberships,
      directPolicyCount: user._count.policyAttachments,
      boundary: user.boundary ? true : false,
    }));
  }

  async getUser(id: string, organizationId: string) {
    const user = await this.userRepo.findByIdWithIAM(id, organizationId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  /**
   * Attaches a MANAGED policy directly to a user.
   *
   * Delegation Bypass Prevention: the actor must hold all Allow actions
   * defined in the policy being attached.
   */
  async attachPolicy(userId: string, policyId: string, actorId: string, organizationId: string) {
    const user = await this.userRepo.findById(userId, organizationId);
    if (!user) throw new ApiError(404, 'User not found');

    const policy = await this.policyRepo.findById(policyId, organizationId);
    if (!policy) throw new ApiError(404, 'Policy not found');

    if (policy.type !== 'MANAGED') {
      throw new ApiError(400, 'Only MANAGED policies can be attached directly to users');
    }

    const existing = await this.userRepo.findPolicyAttachment(userId, policyId);
    if (existing) throw new ApiError(409, 'Policy already attached to user');

    // Delegation bypass prevention
    const statements = policy.statements as { Effect: string; Action: string[]; Resource: string[] }[];
    await authorizationService.checkDelegationBypass(actorId, statements);

    await this.userRepo.attachPolicy(userId, policyId);
    return { success: true };
  }

  async detachPolicy(userId: string, policyId: string, organizationId: string) {
    const user = await this.userRepo.findById(userId, organizationId);
    if (!user) throw new ApiError(404, 'User not found');

    const attachment = await this.userRepo.findPolicyAttachment(userId, policyId);
    if (!attachment) throw new ApiError(404, 'Policy attachment not found');

    await this.userRepo.detachPolicy(userId, policyId);
    return { success: true };
  }

  /**
   * Sets a boundary policy on a user.
   *
   * Rules:
   * - Only root can perform this operation
   * - Target must be an existing, non-root user (root cannot be restricted)
   * - Policy must be MANAGED
   * - Replaces any existing boundary (one boundary per user)
   */
  async setBoundary(userId: string, policyId: string, currentUser: User) {
    // Root-only operation
    if (!currentUser.isRoot) {
      throw new ApiError(403, 'Only the root user can set a boundary on a user');
    }

    const user = await this.userRepo.findById(userId, currentUser.organizationId);
    if (!user) throw new ApiError(404, 'User not found');

    // Cannot set boundary on the root user
    if (user.isRoot) {
      throw new ApiError(400, 'Cannot set a boundary on the root user');
    }

    const policy = await this.policyRepo.findById(policyId, currentUser.organizationId);
    if (!policy) throw new ApiError(404, 'Policy not found');
    if (policy.type !== 'MANAGED') {
      throw new ApiError(400, 'Boundary policy must be a MANAGED policy');
    }

    await this.userRepo.setBoundary(userId, policyId);
    return { success: true };
  }

  /**
   * Removes a boundary from a user.
   *
   * Rules:
   * - Only root can perform this operation
   * - Target must be an existing user
   */
  async removeBoundary(userId: string, currentUser: User) {
    // Root-only operation
    if (!currentUser.isRoot) {
      throw new ApiError(403, 'Only the root user can remove a boundary from a user');
    }

    const user = await this.userRepo.findById(userId, currentUser.organizationId);
    if (!user) throw new ApiError(404, 'User not found');

    // Cannot remove boundary from root (they cannot have one anyway, but defensive)
    if (user.isRoot) {
      throw new ApiError(400, 'The root user cannot have a boundary');
    }

    try {
      await this.userRepo.removeBoundary(userId);
    } catch {
      // Ignore — no boundary existed, which is fine
    }
    return { success: true };
  }
}

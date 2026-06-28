import { PolicyRepository } from '../repositories/policy.repository';
import { ApiError } from '../utils/ApiError';
import { authorizationService } from '../iam/authorization/authorization.service';
import type { User } from '@prisma/client';

export class PolicyService {
  private policyRepo = new PolicyRepository();

  /**
   * Creates a new policy.
   *
   * Delegation Bypass Prevention: if the caller is not root, verify they hold
   * every Allow action in the new policy's statements.
   */
  async createPolicy(data: any, actorId: string) {
    const existing = await this.policyRepo.findByName(data.name, data.organizationId);
    if (existing) {
      throw new ApiError(409, 'Policy with this name already exists');
    }

    // Delegation bypass prevention
    await authorizationService.checkDelegationBypass(actorId, data.statements);

    return await this.policyRepo.create(data);
  }

  async listPolicies(organizationId: string) {
    return await this.policyRepo.findAll(organizationId);
  }

  async getPolicy(id: string, organizationId: string) {
    const policy = await this.policyRepo.findById(id, organizationId);
    if (!policy) throw new ApiError(404, 'Policy not found');
    return policy;
  }

  /**
   * Updates a policy.
   *
   * Delegation Bypass Prevention: if statements are being changed, verify the
   * actor holds every Allow action in the NEW statements.
   */
  async updatePolicy(id: string, organizationId: string, data: any, actorId: string) {
    const policy = await this.policyRepo.findById(id, organizationId);
    if (!policy) throw new ApiError(404, 'Policy not found');

    if (data.name && data.name !== policy.name) {
      const existing = await this.policyRepo.findByName(data.name, organizationId);
      if (existing) throw new ApiError(409, 'Policy with this name already exists');
    }

    // Delegation bypass prevention — only triggered when statements are being updated
    if (data.statements) {
      await authorizationService.checkDelegationBypass(actorId, data.statements);
    }

    return await this.policyRepo.update(id, organizationId, data);
  }

  /**
   * Deletes a policy.
   *
   * Rules:
   * - MANAGED policies still attached to users or groups → 400 (unless actor is root)
   * - INLINE policies → always deletable
   * - Root bypasses the attachment restriction
   */
  async deletePolicy(id: string, actor: User) {
    const policy = await this.policyRepo.findById(id, actor.organizationId);
    if (!policy) throw new ApiError(404, 'Policy not found');

    if (policy.type === 'MANAGED' && !actor.isRoot) {
      const groupAttachments = await this.policyRepo.findGroupAttachments(id);
      const userAttachments = await this.policyRepo.findUserAttachments(id);

      if (groupAttachments.length > 0 || userAttachments.length > 0) {
        const groupNames = groupAttachments.map((a) => `group:${a.groupId}`).join(', ');
        const userNames = userAttachments.map((a) => `user:${a.userId}`).join(', ');
        const attached = [groupNames, userNames].filter(Boolean).join(', ');
        throw new ApiError(
          400,
          `Cannot delete a MANAGED policy that is still attached to: ${attached}. Detach it first.`,
        );
      }
    }

    await this.policyRepo.delete(id, actor.organizationId);
    return { success: true };
  }
}

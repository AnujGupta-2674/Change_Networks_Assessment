import { GroupRepository } from '../repositories/group.repository';
import { PolicyRepository } from '../repositories/policy.repository';
import { UserRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { authorizationService } from '../iam/authorization/authorization.service';

export class GroupService {
  private groupRepo = new GroupRepository();
  private policyRepo = new PolicyRepository();
  private userRepo = new UserRepository();

  async createGroup(data: any) {
    const existing = await this.groupRepo.findByName(data.name);
    if (existing) throw new ApiError(409, 'Group with this name already exists');
    return await this.groupRepo.create(data);
  }

  async listGroups() {
    return await this.groupRepo.findAll();
  }

  async getGroup(id: string) {
    const group = await this.groupRepo.findById(id);
    if (!group) throw new ApiError(404, 'Group not found');
    return group;
  }

  async updateGroup(id: string, data: any) {
    const group = await this.groupRepo.findById(id);
    if (!group) throw new ApiError(404, 'Group not found');

    if (data.name && data.name !== group.name) {
      const existing = await this.groupRepo.findByName(data.name);
      if (existing) throw new ApiError(409, 'Group with this name already exists');
    }

    return await this.groupRepo.update(id, data);
  }

  async deleteGroup(id: string) {
    const group = await this.groupRepo.findById(id);
    if (!group) throw new ApiError(404, 'Group not found');

    // Delete INLINE policies attached to this group before deleting the group
    // (Cascade will delete the join table rows, but not the INLINE policy documents themselves)
    const attachments = group.policyAttachments || [];
    for (const attachment of attachments) {
      if (attachment.policy.type === 'INLINE') {
        await this.policyRepo.delete(attachment.policy.id);
      }
    }

    await this.groupRepo.delete(id);
    return { success: true };
  }

  async addMember(groupId: string, userId: string) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new ApiError(404, 'Group not found');

    const user = await this.userRepo.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const existing = await this.groupRepo.findMembership(groupId, userId);
    if (existing) throw new ApiError(409, 'User is already a member of this group');

    await this.groupRepo.addMember(groupId, userId);
    return { success: true };
  }

  async removeMember(groupId: string, userId: string) {
    const membership = await this.groupRepo.findMembership(groupId, userId);
    if (!membership) throw new ApiError(404, 'Membership not found');
    await this.groupRepo.removeMember(groupId, userId);
    return { success: true };
  }

  /**
   * Attaches a MANAGED policy to a group.
   *
   * Delegation Bypass Prevention: the actor must hold all Allow actions
   * defined in the policy being attached.
   */
  async attachPolicy(groupId: string, policyId: string, actorId: string) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new ApiError(404, 'Group not found');

    const policy = await this.policyRepo.findById(policyId);
    if (!policy) throw new ApiError(404, 'Policy not found');

    if (policy.type !== 'MANAGED') {
      throw new ApiError(400, 'Only MANAGED policies can be attached to groups');
    }

    const existing = await this.groupRepo.findPolicyAttachment(groupId, policyId);
    if (existing) throw new ApiError(409, 'Policy already attached to group');

    // Delegation bypass prevention
    const statements = policy.statements as { Effect: string; Action: string[]; Resource: string[] }[];
    await authorizationService.checkDelegationBypass(actorId, statements);

    await this.groupRepo.attachPolicy(groupId, policyId);
    return { success: true };
  }

  async detachPolicy(groupId: string, policyId: string) {
    const attachment = await this.groupRepo.findPolicyAttachment(groupId, policyId);
    if (!attachment) throw new ApiError(404, 'Policy attachment not found');
    await this.groupRepo.detachPolicy(groupId, policyId);
    return { success: true };
  }
}

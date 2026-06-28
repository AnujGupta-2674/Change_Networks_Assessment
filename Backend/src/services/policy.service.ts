import { PolicyRepository } from '../repositories/policy.repository';
import { ApiError } from '../utils/ApiError';

export class PolicyService {
  private policyRepo = new PolicyRepository();

  async createPolicy(data: any) {
    const existing = await this.policyRepo.findByName(data.name);
    if (existing) {
      throw new ApiError(409, 'Policy with this name already exists');
    }
    return await this.policyRepo.create(data);
  }

  async listPolicies() {
    return await this.policyRepo.findAll();
  }

  async getPolicy(id: string) {
    const policy = await this.policyRepo.findById(id);
    if (!policy) throw new ApiError(404, 'Policy not found');
    return policy;
  }

  async updatePolicy(id: string, data: any) {
    const policy = await this.policyRepo.findById(id);
    if (!policy) throw new ApiError(404, 'Policy not found');

    if (data.name && data.name !== policy.name) {
      const existing = await this.policyRepo.findByName(data.name);
      if (existing) throw new ApiError(409, 'Policy with this name already exists');
    }

    return await this.policyRepo.update(id, data);
  }

  async deletePolicy(id: string) {
    const policy = await this.policyRepo.findById(id);
    if (!policy) throw new ApiError(404, 'Policy not found');

    if (policy.type === 'MANAGED') {
      const groupAttachments = await this.policyRepo.findGroupAttachments(id);
      const userAttachments = await this.policyRepo.findUserAttachments(id);

      if (groupAttachments.length > 0 || userAttachments.length > 0) {
        throw new ApiError(400, 'Cannot delete a MANAGED policy that is still attached to users or groups');
      }
    }

    await this.policyRepo.delete(id);
    return { success: true };
  }
}

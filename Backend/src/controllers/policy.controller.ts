import { Request, Response } from 'express';
import { PolicyService } from '../services/policy.service';
import { createPolicySchema, updatePolicySchema } from '../validators/policy.validator';

const policyService = new PolicyService();

export const createPolicy = async (req: Request, res: Response) => {
  const data = createPolicySchema.parse(req).body;
  const policy = await policyService.createPolicy(data);
  res.status(201).json({ success: true, data: policy });
};

export const listPolicies = async (req: Request, res: Response) => {
  const policies = await policyService.listPolicies();
  res.status(200).json({ success: true, data: policies });
};

export const getPolicy = async (req: Request, res: Response) => {
  const policy = await policyService.getPolicy(req.params.id as string);
  res.status(200).json({ success: true, data: policy });
};

export const updatePolicy = async (req: Request, res: Response) => {
  const data = updatePolicySchema.parse(req).body;
  const policy = await policyService.updatePolicy(req.params.id as string, data);
  res.status(200).json({ success: true, data: policy });
};

export const deletePolicy = async (req: Request, res: Response) => {
  await policyService.deletePolicy(req.params.id as string);
  res.status(200).json({ success: true, message: 'Policy deleted successfully' });
};

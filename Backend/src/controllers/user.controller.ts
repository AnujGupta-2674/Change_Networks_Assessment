import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { attachUserPolicySchema, putUserBoundarySchema } from '../validators/user.validator';
import { ApiError } from '../utils/ApiError';

const userService = new UserService();

export const listUsers = async (req: Request, res: Response) => {
  const users = await userService.listUsers();
  res.status(200).json({ success: true, data: users });
};

export const getUser = async (req: Request, res: Response) => {
  const user = await userService.getUser(req.params.id as string);
  res.status(200).json({ success: true, data: user });
};

export const attachPolicy = async (req: Request, res: Response) => {
  const { policyId } = attachUserPolicySchema.parse(req).body;
  await userService.attachPolicy(req.params.id as string, policyId);
  res.status(200).json({ success: true, message: 'Policy attached to user' });
};

export const detachPolicy = async (req: Request, res: Response) => {
  await userService.detachPolicy(req.params.id as string, req.params.policyId as string);
  res.status(200).json({ success: true, message: 'Policy detached from user' });
};

export const setBoundary = async (req: Request, res: Response) => {
  const { policyId } = putUserBoundarySchema.parse(req).body;
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  await userService.setBoundary(req.params.id as string, policyId, req.user);
  res.status(200).json({ success: true, message: 'Boundary set successfully' });
};

export const removeBoundary = async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  await userService.removeBoundary(req.params.id as string, req.user);
  res.status(200).json({ success: true, message: 'Boundary removed successfully' });
};

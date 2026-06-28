import { Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { createGroupSchema, updateGroupSchema, addMemberSchema, attachGroupPolicySchema } from '../validators/group.validator';
import { ApiError } from '../utils/ApiError';

const groupService = new GroupService();

export const createGroup = async (req: Request, res: Response) => {
  const data = createGroupSchema.parse(req).body;
  const group = await groupService.createGroup(data);
  res.status(201).json({ success: true, data: group });
};

export const listGroups = async (req: Request, res: Response) => {
  const groups = await groupService.listGroups();
  res.status(200).json({ success: true, data: groups });
};

export const getGroup = async (req: Request, res: Response) => {
  const group = await groupService.getGroup(req.params.id as string);
  res.status(200).json({ success: true, data: group });
};

export const updateGroup = async (req: Request, res: Response) => {
  const data = updateGroupSchema.parse(req).body;
  const group = await groupService.updateGroup(req.params.id as string, data);
  res.status(200).json({ success: true, data: group });
};

export const deleteGroup = async (req: Request, res: Response) => {
  await groupService.deleteGroup(req.params.id as string);
  res.status(200).json({ success: true, message: 'Group deleted successfully' });
};

export const addMember = async (req: Request, res: Response) => {
  const { userId } = addMemberSchema.parse(req).body;
  await groupService.addMember(req.params.id as string, userId);
  res.status(200).json({ success: true, message: 'User added to group' });
};

export const removeMember = async (req: Request, res: Response) => {
  await groupService.removeMember(req.params.id as string, req.params.userId as string);
  res.status(200).json({ success: true, message: 'User removed from group' });
};

export const attachPolicy = async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const { policyId } = attachGroupPolicySchema.parse(req).body;
  await groupService.attachPolicy(req.params.id as string, policyId, req.user.id);
  res.status(200).json({ success: true, message: 'Policy attached to group' });
};

export const detachPolicy = async (req: Request, res: Response) => {
  await groupService.detachPolicy(req.params.id as string, req.params.policyId as string);
  res.status(200).json({ success: true, message: 'Policy detached from group' });
};

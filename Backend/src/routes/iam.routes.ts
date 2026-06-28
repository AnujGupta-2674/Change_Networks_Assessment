import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';
import * as groupController from '../controllers/group.controller';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createPolicySchema, updatePolicySchema } from '../validators/policy.validator';
import { createGroupSchema, updateGroupSchema, addMemberSchema, attachGroupPolicySchema } from '../validators/group.validator';
import { attachUserPolicySchema, putUserBoundarySchema, createUserSchema } from '../validators/user.validator';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Authentication guard — applies to all IAM routes
router.use(authMiddleware);

// ── Policies ───────────────────────────────────────────────────────────────
router.get('/policies', authorize('iam:ListPolicies'), catchAsync(policyController.listPolicies));
router.get('/policies/:id', authorize('iam:GetPolicy'), catchAsync(policyController.getPolicy));
router.post('/policies', authorize('iam:CreatePolicy'), validate(createPolicySchema), catchAsync(policyController.createPolicy));
router.put('/policies/:id', authorize('iam:UpdatePolicy'), validate(updatePolicySchema), catchAsync(policyController.updatePolicy));
router.delete('/policies/:id', authorize('iam:DeletePolicy'), catchAsync(policyController.deletePolicy));

// ── Groups ─────────────────────────────────────────────────────────────────
router.get('/groups', authorize('iam:ListGroups'), catchAsync(groupController.listGroups));
router.get('/groups/:id', authorize('iam:GetGroup'), catchAsync(groupController.getGroup));
router.post('/groups', authorize('iam:CreateGroup'), validate(createGroupSchema), catchAsync(groupController.createGroup));
router.put('/groups/:id', authorize('iam:UpdateGroup'), validate(updateGroupSchema), catchAsync(groupController.updateGroup));
router.delete('/groups/:id', authorize('iam:DeleteGroup'), catchAsync(groupController.deleteGroup));
router.post('/groups/:id/members', authorize('iam:AddUserToGroup'), validate(addMemberSchema), catchAsync(groupController.addMember));
router.delete('/groups/:id/members/:userId', authorize('iam:RemoveUserFromGroup'), catchAsync(groupController.removeMember));
router.post('/groups/:id/policies', authorize('iam:AttachGroupPolicy'), validate(attachGroupPolicySchema), catchAsync(groupController.attachPolicy));
router.delete('/groups/:id/policies/:policyId', authorize('iam:DetachGroupPolicy'), catchAsync(groupController.detachPolicy));

// ── Users ──────────────────────────────────────────────────────────────────
router.get('/users', authorize('iam:ListUsers'), catchAsync(userController.listUsers));
router.post('/users', validate(createUserSchema), catchAsync(userController.createUser));
router.get('/users/:id', authorize('iam:GetUser'), catchAsync(userController.getUser));
router.get('/users/:id/effective-permissions', authorize('iam:GetUser'), catchAsync(userController.getEffectivePermissions));
router.post('/users/:id/policies', authorize('iam:AttachUserPolicy'), validate(attachUserPolicySchema), catchAsync(userController.attachPolicy));
router.delete('/users/:id/policies/:policyId', authorize('iam:DetachUserPolicy'), catchAsync(userController.detachPolicy));

// ── Boundaries (root-only — enforced in service layer as defense-in-depth) ─
// These routes are authenticated but boundary routes are enforced in service (isRoot check).
// authorize() is still added so they appear in the IAM route matrix correctly.
// Root always bypasses authorize() → no functional impact on root users.
router.put('/users/:id/boundary', authorize('iam:PutUserBoundary'), validate(putUserBoundarySchema), catchAsync(userController.setBoundary));
router.delete('/users/:id/boundary', authorize('iam:DeleteUserBoundary'), catchAsync(userController.removeBoundary));

export default router;

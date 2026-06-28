import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';
import * as groupController from '../controllers/group.controller';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Apply auth middleware to all IAM routes
router.use(authMiddleware);

// Policies
router.post('/policies', policyController.createPolicy);
router.get('/policies', policyController.listPolicies);
router.get('/policies/:id', policyController.getPolicy);
router.put('/policies/:id', policyController.updatePolicy);
router.delete('/policies/:id', policyController.deletePolicy);

// Groups
router.post('/groups', groupController.createGroup);
router.get('/groups', groupController.listGroups);
router.get('/groups/:id', groupController.getGroup);
router.put('/groups/:id', groupController.updateGroup);
router.delete('/groups/:id', groupController.deleteGroup);
router.post('/groups/:id/members', groupController.addMember);
router.delete('/groups/:id/members/:userId', groupController.removeMember);
router.post('/groups/:id/policies', groupController.attachPolicy);
router.delete('/groups/:id/policies/:policyId', groupController.detachPolicy);

// Users
router.get('/users', userController.listUsers);
router.get('/users/:id', userController.getUser);
router.post('/users/:id/policies', userController.attachPolicy);
router.delete('/users/:id/policies/:policyId', userController.detachPolicy);
router.put('/users/:id/boundary', userController.setBoundary);
router.delete('/users/:id/boundary', userController.removeBoundary);

export default router;

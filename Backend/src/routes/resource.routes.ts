import { Router } from 'express';
import { dummyAction } from '../controllers/resource.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Reports
router.get('/reports', dummyAction);
router.get('/reports/:id', dummyAction);
router.post('/reports', dummyAction);
router.put('/reports/:id', dummyAction);
router.delete('/reports/:id', dummyAction);

// Alerts
router.get('/alerts', dummyAction);
router.get('/alerts/:id', dummyAction);
router.post('/alerts', dummyAction);
router.patch('/alerts/:id/acknowledge', dummyAction);
router.delete('/alerts/:id', dummyAction);

// Settings
router.get('/settings', dummyAction);
router.put('/settings', dummyAction);

// Audit
router.get('/audit', dummyAction);
router.get('/audit/:id', dummyAction);

export default router;

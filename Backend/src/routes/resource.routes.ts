import { Router } from 'express';
import { dummyAction } from '../controllers/resource.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Authentication guard — runs before authorize() on every resource route
router.use(authMiddleware);

// ── Reports ────────────────────────────────────────────────────────────────
router.get('/reports', authorize('reports:List'), dummyAction);
router.get('/reports/:id', authorize('reports:Read'), dummyAction);
router.post('/reports', authorize('reports:Create'), dummyAction);
router.put('/reports/:id', authorize('reports:Update'), dummyAction);
router.delete('/reports/:id', authorize('reports:Delete'), dummyAction);

// ── Alerts ─────────────────────────────────────────────────────────────────
router.get('/alerts', authorize('alerts:List'), dummyAction);
router.get('/alerts/:id', authorize('alerts:Read'), dummyAction);
router.post('/alerts', authorize('alerts:Create'), dummyAction);
router.patch('/alerts/:id/acknowledge', authorize('alerts:Acknowledge'), dummyAction);
router.delete('/alerts/:id', authorize('alerts:Delete'), dummyAction);

// ── Settings ───────────────────────────────────────────────────────────────
router.get('/settings', authorize('settings:Read'), dummyAction);
router.put('/settings', authorize('settings:Update'), dummyAction);

// ── Audit ──────────────────────────────────────────────────────────────────
router.get('/audit', authorize('audit:List'), dummyAction);
router.get('/audit/:id', authorize('audit:Read'), dummyAction);

export default router;

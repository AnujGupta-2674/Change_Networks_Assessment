import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { catchAsync } from '../utils/catchAsync';

const router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), catchAsync(authController.register));
router.post('/login', validate(loginSchema), catchAsync(authController.login));
router.post('/logout', authMiddleware, catchAsync(authController.logout));
router.get('/me', authMiddleware, catchAsync(authController.getMe));
router.post('/refresh-token', catchAsync(authController.refreshToken));

export default router;

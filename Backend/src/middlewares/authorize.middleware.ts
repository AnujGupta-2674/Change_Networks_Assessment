import { Request, Response, NextFunction } from 'express';
import { authorizationService } from '../iam/authorization/authorization.service';
import type { Action } from '../iam/constants/actions.constants';
import { ApiError } from '../utils/ApiError';

/**
 * Authorization middleware factory.
 *
 * Usage:
 *   router.get('/reports', authMiddleware, authorize('reports:List'), controller);
 *
 * The `authMiddleware` MUST run before `authorize()` — it populates `req.user`.
 * If `req.user` is missing, authorize() returns 401 (should not normally happen
 * if middleware order is correct, but acts as defense-in-depth).
 *
 * HTTP status codes:
 *   401 — Not authenticated (no user on request)
 *   403 — Authenticated but lacks the required permission
 *
 * Controllers remain completely unaware of authorization logic.
 * No controller changes are ever required to add route protection.
 *
 * @param action - The IAM action required to access this route (e.g. 'reports:List')
 * @returns Express middleware function
 */
export const authorize = (action: Action) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Unauthorized: authentication required'));
      }

      const allowed = await authorizationService.canPerform(req.user.id, action);

      if (!allowed) {
        return next(
          new ApiError(
            403,
            `Forbidden: you do not have permission to perform '${action}'`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

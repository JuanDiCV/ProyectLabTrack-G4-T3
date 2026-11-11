import type { Request, Response } from 'express';
import { getAuthUser } from '../../middlewares/auth.middleware';
import type { AuthService } from './auth.service';

export function createAuthController(service: AuthService) {
  return {
    /** POST /api/auth/login → 200 | 400 | 401 | 423 */
    async login(req: Request, res: Response): Promise<void> {
      const result = await service.login(req.body);
      res.status(200).json(result);
    },

    /** GET /api/auth/me → 200 */
    me(req: Request, res: Response): void {
      res.status(200).json({ user: getAuthUser(req) });
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;

import type { AuthUser } from '../shared/domain';

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado, establecido por el middleware `authenticate`. */
      user?: AuthUser;
    }
  }
}

export {};

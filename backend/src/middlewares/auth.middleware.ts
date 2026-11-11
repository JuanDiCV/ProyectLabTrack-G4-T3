import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AuthUser, Role } from '../shared/domain';
import { forbidden, unauthorized } from '../shared/errors';
import { MESSAGES } from '../shared/messages';
import type { TokenService } from '../shared/security';

const BEARER_PREFIX = 'Bearer ';

/** Verifica el JWT del encabezado Authorization y adjunta `req.user`. */
export function createAuthenticate(tokens: TokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      next(unauthorized(MESSAGES.TOKEN_REQUIRED, 'TOKEN_REQUIRED'));
      return;
    }
    try {
      req.user = tokens.verify(header.slice(BEARER_PREFIX.length));
      next();
    } catch {
      next(unauthorized(MESSAGES.TOKEN_INVALID, 'TOKEN_INVALID'));
    }
  };
}

/** Restringe la ruta a los roles indicados. Debe usarse después de `authenticate`. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized(MESSAGES.TOKEN_REQUIRED, 'TOKEN_REQUIRED'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden(MESSAGES.FORBIDDEN));
      return;
    }
    next();
  };
}

/** Obtiene el usuario autenticado o lanza 401 (para controladores). */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw unauthorized(MESSAGES.TOKEN_REQUIRED, 'TOKEN_REQUIRED');
  }
  return req.user;
}

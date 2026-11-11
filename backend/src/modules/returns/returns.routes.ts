import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../middlewares/auth.middleware';
import { ROLES } from '../../shared/domain';
import type { ReturnController } from './returns.controller';

/** Rutas del encargado de laboratorio: /api/returns */
export function createReturnRouter(controller: ReturnController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate, requireRole(ROLES.ADMIN));
  router.get('/active', controller.searchActive);
  router.post('/:id', controller.markReturn);
  return router;
}

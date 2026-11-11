import { Router, type RequestHandler } from 'express';
import { requireRole } from '../../middlewares/auth.middleware';
import { ROLES } from '../../shared/domain';
import type { ReservationController } from './reservations.controller';

/** Rutas del estudiante: /api/reservations */
export function createReservationRouter(controller: ReservationController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate, requireRole(ROLES.STUDENT));
  router.post('/', controller.create);
  router.get('/me', controller.listMine);
  return router;
}

/** Rutas del encargado de laboratorio: /api/admin/reservations */
export function createAdminReservationRouter(
  controller: ReservationController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.use(authenticate, requireRole(ROLES.ADMIN));
  router.get('/pending', controller.listPending);
  router.patch('/:id/approve', controller.approve);
  router.patch('/:id/reject', controller.reject);
  return router;
}

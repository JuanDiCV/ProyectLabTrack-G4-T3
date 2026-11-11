import type { Request, Response } from 'express';
import { getAuthUser } from '../../middlewares/auth.middleware';
import { MESSAGES } from '../../shared/messages';
import type { ReservationService } from './reservations.service';

export function createReservationController(service: ReservationService) {
  return {
    /** POST /api/reservations → 201 | 400 | 403 | 404 | 409 */
    async create(req: Request, res: Response): Promise<void> {
      const user = getAuthUser(req);
      const reservation = await service.create(user.id, req.body);
      res.status(201).json({ message: MESSAGES.RESERVATION_CREATED, reservation });
    },

    /** GET /api/reservations/me → 200 */
    async listMine(req: Request, res: Response): Promise<void> {
      const user = getAuthUser(req);
      res.status(200).json(await service.listMine(user.id));
    },

    /** GET /api/admin/reservations/pending → 200 */
    async listPending(_req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.listPending());
    },

    /** PATCH /api/admin/reservations/:id/approve → 200 | 404 | 409 */
    async approve(req: Request, res: Response): Promise<void> {
      const reservation = await service.approve(req.params.id);
      res.status(200).json({ message: MESSAGES.RESERVATION_APPROVED, reservation });
    },

    /** PATCH /api/admin/reservations/:id/reject → 200 | 400 | 404 | 409 */
    async reject(req: Request, res: Response): Promise<void> {
      const reservation = await service.reject(req.params.id, req.body);
      res.status(200).json({ message: MESSAGES.RESERVATION_REJECTED, reservation });
    },
  };
}

export type ReservationController = ReturnType<typeof createReservationController>;

import type { PrismaClient } from '@prisma/client';
import { EQUIPMENT_STATUS, RESERVATION_STATUS, USER_STATUS, type ReservationDetail } from '../../shared/domain';
import { reservationInclude, toReservationDetail } from '../../shared/mappers';

export interface CompleteReturnCommand {
  reservationId: number;
  equipmentId: number;
  userId: number;
  returnedAt: Date;
  penalize: boolean;
}

export interface ReturnRepository {
  /** Reservas "Aprobada" (activas) filtradas por nombre o código de estudiante. */
  findActive(term: string): Promise<ReservationDetail[]>;
  findDetailById(id: number): Promise<ReservationDetail | null>;
  /** Finaliza la reserva, libera el equipo y (si aplica) penaliza al estudiante en una transacción. */
  completeReturn(command: CompleteReturnCommand): Promise<void>;
}

export class PrismaReturnRepository implements ReturnRepository {
  constructor(private readonly db: PrismaClient) {}

  async findActive(term: string): Promise<ReservationDetail[]> {
    const studentFilter = term
      ? { user: { OR: [{ name: { contains: term } }, { studentCode: { contains: term } }] } }
      : {};
    const rows = await this.db.reservation.findMany({
      where: { status: RESERVATION_STATUS.APPROVED, ...studentFilter },
      include: reservationInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map(toReservationDetail);
  }

  async findDetailById(id: number): Promise<ReservationDetail | null> {
    const row = await this.db.reservation.findUnique({ where: { id }, include: reservationInclude });
    return row ? toReservationDetail(row) : null;
  }

  async completeReturn(command: CompleteReturnCommand): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: command.reservationId },
        data: { status: RESERVATION_STATUS.FINISHED, returnedAt: command.returnedAt },
      });
      await tx.equipment.update({
        where: { id: command.equipmentId },
        data: { status: EQUIPMENT_STATUS.AVAILABLE },
      });
      if (command.penalize) {
        await tx.user.update({ where: { id: command.userId }, data: { status: USER_STATUS.PENALIZED } });
      }
    });
  }
}

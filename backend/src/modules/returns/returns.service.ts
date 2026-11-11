import type { Clock } from '../../shared/clock';
import {
  EQUIPMENT_STATUS,
  RESERVATION_STATUS,
  USER_STATUS,
  type EquipmentStatus,
  type ReservationDetail,
  type ReservationStatus,
  type UserStatus,
} from '../../shared/domain';
import { conflict, notFound } from '../../shared/errors';
import { MESSAGES } from '../../shared/messages';
import { toDateTime } from '../../shared/time';
import { parseOrThrow } from '../../shared/validation';
import type { ReturnRepository } from './returns.repository';
import { activeSearchSchema, idParamSchema } from './returns.schema';

export interface ReturnServiceDeps {
  returns: ReturnRepository;
  clock: Clock;
  onInventoryChange?: () => void;
}

export interface ReturnResult {
  reservationId: number;
  reservationStatus: ReservationStatus;
  equipmentId: number;
  equipmentStatus: EquipmentStatus;
  studentId: number;
  studentStatus: UserStatus;
  agreedEndTime: Date;
  returnedAt: Date;
  penalized: boolean;
  message: string;
}

/**
 * HU-05: devolución de equipos y penalización automática.
 * Penaliza solo si currentTime > agreedEndTime (estrictamente posterior).
 */
export class ReturnService {
  constructor(private readonly deps: ReturnServiceDeps) {}

  searchActive(rawQuery: unknown = {}): Promise<ReservationDetail[]> {
    const { q } = parseOrThrow(activeSearchSchema, rawQuery);
    return this.deps.returns.findActive(q);
  }

  async markReturn(rawId: unknown): Promise<ReturnResult> {
    const id = parseOrThrow(idParamSchema, rawId);
    const reservation = await this.deps.returns.findDetailById(id);
    if (!reservation) {
      throw notFound(MESSAGES.RESERVATION_NOT_FOUND);
    }
    if (reservation.status !== RESERVATION_STATUS.APPROVED) {
      throw conflict(MESSAGES.ONLY_ACTIVE_RETURN, 'INVALID_STATUS');
    }

    const returnedAt = this.deps.clock.now();
    const agreedEndTime = toDateTime(reservation.date, reservation.endTime);
    const penalize = isLateReturn(returnedAt, agreedEndTime);

    await this.deps.returns.completeReturn({
      reservationId: reservation.id,
      equipmentId: reservation.equipmentId,
      userId: reservation.userId,
      returnedAt,
      penalize,
    });
    this.deps.onInventoryChange?.();

    return {
      reservationId: reservation.id,
      reservationStatus: RESERVATION_STATUS.FINISHED,
      equipmentId: reservation.equipmentId,
      equipmentStatus: EQUIPMENT_STATUS.AVAILABLE,
      studentId: reservation.userId,
      studentStatus: penalize ? USER_STATUS.PENALIZED : reservation.student.status,
      agreedEndTime,
      returnedAt,
      penalized: penalize,
      message: penalize ? MESSAGES.RETURN_LATE : MESSAGES.RETURN_ON_TIME,
    };
  }
}

/** currentTime > agreedEndTime → tardía. Devolver exactamente a la hora límite NO penaliza. */
export function isLateReturn(currentTime: Date, agreedEndTime: Date): boolean {
  return currentTime.getTime() > agreedEndTime.getTime();
}

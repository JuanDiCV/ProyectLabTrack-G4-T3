import type { PrismaClient } from '@prisma/client';
import {
  EQUIPMENT_STATUS,
  RESERVATION_STATUS,
  type ReservationDetail,
  type ReservationEntity,
  type ReservationStatus,
} from '../../shared/domain';
import { reservationInclude, toReservationDetail, toReservationEntity } from '../../shared/mappers';

export interface NewReservation {
  userId: number;
  equipmentId: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ReservationRepository {
  create(data: NewReservation): Promise<ReservationEntity>;
  findById(id: number): Promise<ReservationEntity | null>;
  findByEquipmentAndDate(
    equipmentId: number,
    date: string,
    statuses: readonly ReservationStatus[],
  ): Promise<ReservationEntity[]>;
  findByUserAndDate(userId: number, date: string, statuses: readonly ReservationStatus[]): Promise<ReservationEntity[]>;
  findDetailsByUser(userId: number): Promise<ReservationDetail[]>;
  findDetailsByStatus(status: ReservationStatus): Promise<ReservationDetail[]>;
  /** Aprueba la reserva y marca el equipo como "Prestado" de forma atómica. */
  approve(id: number, equipmentId: number): Promise<ReservationEntity>;
  reject(id: number, rejectionReason: string): Promise<ReservationEntity>;
}

const chronological = [{ date: 'asc' as const }, { startTime: 'asc' as const }];

export class PrismaReservationRepository implements ReservationRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: NewReservation): Promise<ReservationEntity> {
    const row = await this.db.reservation.create({ data: { ...data, status: RESERVATION_STATUS.PENDING } });
    return toReservationEntity(row);
  }

  async findById(id: number): Promise<ReservationEntity | null> {
    const row = await this.db.reservation.findUnique({ where: { id } });
    return row ? toReservationEntity(row) : null;
  }

  async findByEquipmentAndDate(
    equipmentId: number,
    date: string,
    statuses: readonly ReservationStatus[],
  ): Promise<ReservationEntity[]> {
    const rows = await this.db.reservation.findMany({
      where: { equipmentId, date, status: { in: [...statuses] } },
    });
    return rows.map(toReservationEntity);
  }

  async findByUserAndDate(
    userId: number,
    date: string,
    statuses: readonly ReservationStatus[],
  ): Promise<ReservationEntity[]> {
    const rows = await this.db.reservation.findMany({
      where: { userId, date, status: { in: [...statuses] } },
    });
    return rows.map(toReservationEntity);
  }

  async findDetailsByUser(userId: number): Promise<ReservationDetail[]> {
    const rows = await this.db.reservation.findMany({
      where: { userId },
      include: reservationInclude,
      orderBy: chronological,
    });
    return rows.map(toReservationDetail);
  }

  async findDetailsByStatus(status: ReservationStatus): Promise<ReservationDetail[]> {
    const rows = await this.db.reservation.findMany({
      where: { status },
      include: reservationInclude,
      orderBy: chronological,
    });
    return rows.map(toReservationDetail);
  }

  async approve(id: number, equipmentId: number): Promise<ReservationEntity> {
    const [row] = await this.db.$transaction([
      this.db.reservation.update({ where: { id }, data: { status: RESERVATION_STATUS.APPROVED } }),
      this.db.equipment.update({ where: { id: equipmentId }, data: { status: EQUIPMENT_STATUS.BORROWED } }),
    ]);
    return toReservationEntity(row);
  }

  async reject(id: number, rejectionReason: string): Promise<ReservationEntity> {
    const row = await this.db.reservation.update({
      where: { id },
      data: { status: RESERVATION_STATUS.REJECTED, rejectionReason },
    });
    return toReservationEntity(row);
  }
}

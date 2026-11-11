import type { Clock } from '../../shared/clock';
import {
  ACTIVE_RESERVATION_STATUSES,
  RESERVATION_STATUS,
  USER_STATUS,
  type EquipmentEntity,
  type ReservationDetail,
  type ReservationEntity,
} from '../../shared/domain';
import { conflict, forbidden, badRequest, notFound } from '../../shared/errors';
import { MESSAGES } from '../../shared/messages';
import { slotContains, slotsOverlap, toDateTime } from '../../shared/time';
import { parseOrThrow } from '../../shared/validation';
import type { UserRepository } from '../auth/auth.repository';
import type { EquipmentRepository } from '../catalog/catalog.repository';
import type { ReservationRepository } from './reservations.repository';
import {
  createReservationSchema,
  idParamSchema,
  rejectReservationSchema,
  type CreateReservationInput,
} from './reservations.schema';

export interface ReservationServiceDeps {
  reservations: ReservationRepository;
  equipment: EquipmentRepository;
  users: UserRepository;
  clock: Clock;
  /** Se invoca cuando cambia el estado de un equipo (invalida la caché del catálogo). */
  onInventoryChange?: () => void;
}

const APPROVED_ONLY = [RESERVATION_STATUS.APPROVED] as const;

/**
 * HU-03 (reservas de estudiantes) y HU-04 (gestión de solicitudes del encargado).
 */
export class ReservationService {
  constructor(private readonly deps: ReservationServiceDeps) {}

  // ---------- HU-03 ----------

  async create(userId: number, rawInput: unknown): Promise<ReservationEntity> {
    const input = parseOrThrow(createReservationSchema, rawInput);
    await this.ensureStudentCanReserve(userId);
    this.ensureFutureSlot(input);
    const equipment = await this.getEquipment(input.equipmentId);
    await this.ensureEquipmentAvailable(equipment, input);
    await this.ensureNoSimultaneousReservation(userId, input);
    return this.deps.reservations.create({ userId, ...input });
  }

  listMine(userId: number): Promise<ReservationDetail[]> {
    return this.deps.reservations.findDetailsByUser(userId);
  }

  // ---------- HU-04 ----------

  listPending(): Promise<ReservationDetail[]> {
    return this.deps.reservations.findDetailsByStatus(RESERVATION_STATUS.PENDING);
  }

  async approve(rawId: unknown): Promise<ReservationEntity> {
    const reservation = await this.getPendingReservation(rawId);
    const equipment = await this.getEquipment(reservation.equipmentId);
    await this.ensureEquipmentAvailable(equipment, reservation, reservation.id);
    const approved = await this.deps.reservations.approve(reservation.id, reservation.equipmentId);
    this.deps.onInventoryChange?.();
    return approved;
  }

  async reject(rawId: unknown, rawBody: unknown): Promise<ReservationEntity> {
    const { rejectionReason } = parseOrThrow(rejectReservationSchema, rawBody);
    const reservation = await this.getPendingReservation(rawId);
    return this.deps.reservations.reject(reservation.id, rejectionReason);
  }

  // ---------- Reglas de negocio ----------

  private async ensureStudentCanReserve(userId: number): Promise<void> {
    const user = await this.deps.users.findById(userId);
    if (!user) {
      throw notFound('El estudiante no existe');
    }
    if (user.status === USER_STATUS.PENALIZED) {
      throw forbidden(MESSAGES.STUDENT_PENALIZED, 'STUDENT_PENALIZED');
    }
  }

  private ensureFutureSlot(input: CreateReservationInput): void {
    const start = toDateTime(input.date, input.startTime);
    if (start.getTime() < this.deps.clock.now().getTime()) {
      throw badRequest(MESSAGES.PAST_SLOT, 'PAST_SLOT');
    }
  }

  private async getEquipment(equipmentId: number): Promise<EquipmentEntity> {
    const equipment = await this.deps.equipment.findById(equipmentId);
    if (!equipment) {
      throw notFound(MESSAGES.EQUIPMENT_NOT_FOUND);
    }
    return equipment;
  }

  /**
   * Regla 1 (cruce de horarios): newStart < existingEnd && newEnd > existingStart
   * contra reservas "Aprobada" del mismo equipo en la misma fecha.
   * Si el bloque aprobado cubre todo el horario pedido, el equipo figura como "Prestado".
   */
  private async ensureEquipmentAvailable(
    equipment: EquipmentEntity,
    slot: Pick<ReservationEntity, 'date' | 'startTime' | 'endTime'>,
    ignoreReservationId?: number,
  ): Promise<void> {
    const approved = await this.deps.reservations.findByEquipmentAndDate(equipment.id, slot.date, APPROVED_ONLY);
    const clash = approved.find((existing) => existing.id !== ignoreReservationId && slotsOverlap(slot, existing));
    if (!clash) {
      return;
    }
    if (slotContains(clash, slot)) {
      throw conflict(MESSAGES.EQUIPMENT_BORROWED, 'EQUIPMENT_BORROWED');
    }
    throw conflict(MESSAGES.SCHEDULE_OVERLAP, 'SCHEDULE_OVERLAP');
  }

  /** Regla 2: un estudiante no puede tener dos equipos en horarios superpuestos. */
  private async ensureNoSimultaneousReservation(userId: number, input: CreateReservationInput): Promise<void> {
    const active = await this.deps.reservations.findByUserAndDate(userId, input.date, ACTIVE_RESERVATION_STATUSES);
    if (active.some((existing) => slotsOverlap(input, existing))) {
      throw conflict(MESSAGES.STUDENT_SIMULTANEOUS, 'STUDENT_SIMULTANEOUS');
    }
  }

  private async getPendingReservation(rawId: unknown): Promise<ReservationEntity> {
    const id = parseOrThrow(idParamSchema, rawId);
    const reservation = await this.deps.reservations.findById(id);
    if (!reservation) {
      throw notFound(MESSAGES.RESERVATION_NOT_FOUND);
    }
    if (reservation.status !== RESERVATION_STATUS.PENDING) {
      throw conflict(MESSAGES.ONLY_PENDING, 'INVALID_STATUS');
    }
    return reservation;
  }
}

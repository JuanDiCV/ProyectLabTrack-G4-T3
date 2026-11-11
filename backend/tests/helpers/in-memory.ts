/**
 * Repositorios en memoria que implementan las mismas interfaces que los de Prisma.
 * Permiten probar los servicios de forma 100% unitaria (sin base de datos ni Express).
 */
import type { SecurityState, UserRepository } from '../../src/modules/auth/auth.repository';
import type { EquipmentRepository } from '../../src/modules/catalog/catalog.repository';
import type { NewReservation, ReservationRepository } from '../../src/modules/reservations/reservations.repository';
import type { CompleteReturnCommand, ReturnRepository } from '../../src/modules/returns/returns.repository';
import {
  EQUIPMENT_STATUS,
  RESERVATION_STATUS,
  USER_STATUS,
  type Category,
  type EquipmentEntity,
  type EquipmentStatus,
  type ReservationDetail,
  type ReservationEntity,
  type ReservationStatus,
  type UserEntity,
  type UserStatus,
} from '../../src/shared/domain';

export class InMemoryStore {
  users: UserEntity[] = [];
  equipment: EquipmentEntity[] = [];
  reservations: ReservationEntity[] = [];
  private nextReservationId = 1;

  nextId(): number {
    const id = this.nextReservationId;
    this.nextReservationId += 1;
    return id;
  }

  user(id: number): UserEntity {
    const found = this.users.find((u) => u.id === id);
    if (!found) throw new Error(`Usuario ${id} no existe en el store`);
    return found;
  }

  equipmentById(id: number): EquipmentEntity {
    const found = this.equipment.find((e) => e.id === id);
    if (!found) throw new Error(`Equipo ${id} no existe en el store`);
    return found;
  }

  equipmentByName(name: string): EquipmentEntity {
    const found = this.equipment.find((e) => e.name === name);
    if (!found) throw new Error(`Equipo ${name} no existe en el store`);
    return found;
  }

  reservation(id: number): ReservationEntity {
    const found = this.reservations.find((r) => r.id === id);
    if (!found) throw new Error(`Reserva ${id} no existe en el store`);
    return found;
  }

  setEquipmentStatus(id: number, status: EquipmentStatus): void {
    this.equipmentById(id).status = status;
  }

  setUserStatus(id: number, status: UserStatus): void {
    this.user(id).status = status;
  }

  detail(reservation: ReservationEntity): ReservationDetail {
    const student = this.user(reservation.userId);
    return {
      ...reservation,
      student: { id: student.id, name: student.name, studentCode: student.studentCode, status: student.status },
      equipment: { ...this.equipmentById(reservation.equipmentId) },
    };
  }

  /** Inserta directamente una reserva (para preparar escenarios). */
  insertReservation(data: NewReservation & { status: ReservationStatus }): ReservationEntity {
    const reservation: ReservationEntity = {
      id: this.nextId(),
      ...data,
      rejectionReason: null,
      returnedAt: null,
      createdAt: new Date(),
    };
    this.reservations.push(reservation);
    return reservation;
  }
}

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findByStudentCode(studentCode: string): Promise<UserEntity | null> {
    const user = this.store.users.find((u) => u.studentCode === studentCode);
    return user ? { ...user } : null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const user = this.store.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async updateSecurityState(id: number, state: SecurityState): Promise<void> {
    Object.assign(this.store.user(id), state);
  }

  async updateStatus(id: number, status: UserStatus): Promise<void> {
    this.store.setUserStatus(id, status);
  }
}

export class InMemoryEquipmentRepository implements EquipmentRepository {
  public findAllCalls = 0;

  constructor(private readonly store: InMemoryStore) {}

  async findAll(category?: Category): Promise<EquipmentEntity[]> {
    this.findAllCalls += 1;
    return this.store.equipment
      .filter((e) => !category || e.category === category)
      .map((e) => ({ ...e }))
      .sort((a, b) => a.inventoryCode.localeCompare(b.inventoryCode));
  }

  async findById(id: number): Promise<EquipmentEntity | null> {
    const found = this.store.equipment.find((e) => e.id === id);
    return found ? { ...found } : null;
  }
}

export class InMemoryReservationRepository implements ReservationRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(data: NewReservation): Promise<ReservationEntity> {
    return { ...this.store.insertReservation({ ...data, status: RESERVATION_STATUS.PENDING }) };
  }

  async findById(id: number): Promise<ReservationEntity | null> {
    const found = this.store.reservations.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  async findByEquipmentAndDate(
    equipmentId: number,
    date: string,
    statuses: readonly ReservationStatus[],
  ): Promise<ReservationEntity[]> {
    return this.store.reservations.filter(
      (r) => r.equipmentId === equipmentId && r.date === date && statuses.includes(r.status),
    );
  }

  async findByUserAndDate(
    userId: number,
    date: string,
    statuses: readonly ReservationStatus[],
  ): Promise<ReservationEntity[]> {
    return this.store.reservations.filter((r) => r.userId === userId && r.date === date && statuses.includes(r.status));
  }

  async findDetailsByUser(userId: number): Promise<ReservationDetail[]> {
    return this.store.reservations.filter((r) => r.userId === userId).map((r) => this.store.detail(r));
  }

  async findDetailsByStatus(status: ReservationStatus): Promise<ReservationDetail[]> {
    return this.store.reservations.filter((r) => r.status === status).map((r) => this.store.detail(r));
  }

  async approve(id: number, equipmentId: number): Promise<ReservationEntity> {
    const reservation = this.store.reservation(id);
    reservation.status = RESERVATION_STATUS.APPROVED;
    this.store.setEquipmentStatus(equipmentId, EQUIPMENT_STATUS.BORROWED);
    return { ...reservation };
  }

  async reject(id: number, rejectionReason: string): Promise<ReservationEntity> {
    const reservation = this.store.reservation(id);
    reservation.status = RESERVATION_STATUS.REJECTED;
    reservation.rejectionReason = rejectionReason;
    return { ...reservation };
  }
}

export class InMemoryReturnRepository implements ReturnRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findActive(term: string): Promise<ReservationDetail[]> {
    const needle = term.toLowerCase();
    return this.store.reservations
      .filter((r) => r.status === RESERVATION_STATUS.APPROVED)
      .map((r) => this.store.detail(r))
      .filter(
        (d) => !needle || d.student.name.toLowerCase().includes(needle) || d.student.studentCode.includes(needle),
      );
  }

  async findDetailById(id: number): Promise<ReservationDetail | null> {
    const found = this.store.reservations.find((r) => r.id === id);
    return found ? this.store.detail(found) : null;
  }

  async completeReturn(command: CompleteReturnCommand): Promise<void> {
    const reservation = this.store.reservation(command.reservationId);
    reservation.status = RESERVATION_STATUS.FINISHED;
    reservation.returnedAt = command.returnedAt;
    this.store.setEquipmentStatus(command.equipmentId, EQUIPMENT_STATUS.AVAILABLE);
    if (command.penalize) {
      this.store.setUserStatus(command.userId, USER_STATUS.PENALIZED);
    }
  }
}

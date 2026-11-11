import type { Equipment, Reservation, User } from '@prisma/client';
import {
  CATEGORIES,
  EQUIPMENT_STATUS,
  RESERVATION_STATUS,
  ROLES,
  USER_STATUS,
  type Category,
  type EquipmentEntity,
  type EquipmentStatus,
  type ReservationDetail,
  type ReservationEntity,
  type ReservationStatus,
  type Role,
  type UserEntity,
  type UserStatus,
} from './domain';

/** Convierte un string de base de datos al tipo de unión permitido, o falla explícitamente. */
function oneOf<T extends string>(allowed: readonly T[], value: string, field: string): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new Error(`Valor inválido en base de datos para ${field}: ${value}`);
  }
  return match;
}

const roles: readonly Role[] = Object.values(ROLES);
const userStatuses: readonly UserStatus[] = Object.values(USER_STATUS);
const equipmentStatuses: readonly EquipmentStatus[] = Object.values(EQUIPMENT_STATUS);
const reservationStatuses: readonly ReservationStatus[] = Object.values(RESERVATION_STATUS);
const categories: readonly Category[] = CATEGORIES;

export function toUserEntity(row: User): UserEntity {
  return {
    id: row.id,
    name: row.name,
    studentCode: row.studentCode,
    passwordHash: row.passwordHash,
    role: oneOf(roles, row.role, 'role'),
    status: oneOf(userStatuses, row.status, 'user.status'),
    failedAttempts: row.failedAttempts,
    isLocked: row.isLocked,
    lockedUntil: row.lockedUntil,
  };
}

export function toEquipmentEntity(row: Equipment): EquipmentEntity {
  return {
    id: row.id,
    name: row.name,
    inventoryCode: row.inventoryCode,
    category: oneOf(categories, row.category, 'category'),
    status: oneOf(equipmentStatuses, row.status, 'equipment.status'),
    imageUrl: row.imageUrl,
  };
}

export function toReservationEntity(row: Reservation): ReservationEntity {
  return {
    id: row.id,
    userId: row.userId,
    equipmentId: row.equipmentId,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    status: oneOf(reservationStatuses, row.status, 'reservation.status'),
    rejectionReason: row.rejectionReason,
    returnedAt: row.returnedAt,
    createdAt: row.createdAt,
  };
}

export type ReservationWithRelations = Reservation & { user: User; equipment: Equipment };

export function toReservationDetail(row: ReservationWithRelations): ReservationDetail {
  const user = toUserEntity(row.user);
  return {
    ...toReservationEntity(row),
    student: { id: user.id, name: user.name, studentCode: user.studentCode, status: user.status },
    equipment: toEquipmentEntity(row.equipment),
  };
}

export const reservationInclude = { user: true, equipment: true } as const;

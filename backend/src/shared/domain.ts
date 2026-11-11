/**
 * Modelo de dominio de LabTrack, independiente de Prisma y de Express.
 */
export const ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = {
  ACTIVE: 'Activo',
  PENALIZED: 'Penalizado',
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const EQUIPMENT_STATUS = {
  AVAILABLE: 'Disponible',
  BORROWED: 'Prestado',
} as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUS)[keyof typeof EQUIPMENT_STATUS];

export const CATEGORIES = ['Cómputo', 'Electrónica', 'Redes'] as const;
export type Category = (typeof CATEGORIES)[number];

export const RESERVATION_STATUS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  FINISHED: 'Finalizada',
} as const;
export type ReservationStatus = (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];

/** Reservas que ocupan al estudiante (regla de simultaneidad). */
export const ACTIVE_RESERVATION_STATUSES: readonly ReservationStatus[] = [
  RESERVATION_STATUS.PENDING,
  RESERVATION_STATUS.APPROVED,
];

export interface UserEntity {
  id: number;
  name: string;
  studentCode: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  failedAttempts: number;
  isLocked: boolean;
  lockedUntil: Date | null;
}

export type PublicUser = Pick<UserEntity, 'id' | 'name' | 'studentCode' | 'role' | 'status'>;

/** Datos del usuario autenticado que viajan en el JWT. */
export interface AuthUser {
  id: number;
  name: string;
  studentCode: string;
  role: Role;
}

export interface EquipmentEntity {
  id: number;
  name: string;
  inventoryCode: string;
  category: Category;
  status: EquipmentStatus;
  imageUrl?: string | null;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface ReservationEntity extends TimeSlot {
  id: number;
  userId: number;
  equipmentId: number;
  date: string;
  status: ReservationStatus;
  rejectionReason: string | null;
  returnedAt: Date | null;
  createdAt: Date;
}

export interface ReservationDetail extends ReservationEntity {
  student: Pick<UserEntity, 'id' | 'name' | 'studentCode' | 'status'>;
  equipment: EquipmentEntity;
}

export function toPublicUser(user: UserEntity): PublicUser {
  return {
    id: user.id,
    name: user.name,
    studentCode: user.studentCode,
    role: user.role,
    status: user.status,
  };
}

export type Role = 'STUDENT' | 'ADMIN';
export type UserStatus = 'Activo' | 'Penalizado';
export type EquipmentStatus = 'Disponible' | 'Prestado';
export type ReservationStatus = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Finalizada';

export const CATEGORIES = ['Cómputo', 'Electrónica', 'Redes'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface PublicUser {
  id: number;
  name: string;
  studentCode: string;
  role: Role;
  status: UserStatus;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface Equipment {
  id: number;
  name: string;
  inventoryCode: string;
  category: Category;
  status: EquipmentStatus;
}

export interface CatalogResponse {
  category: Category | null;
  total: number;
  availableCount: number;
  items: Equipment[];
  message: string | null;
}

export interface Reservation {
  id: number;
  userId: number;
  equipmentId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  rejectionReason: string | null;
  returnedAt: string | null;
  createdAt: string;
}

export interface ReservationDetail extends Reservation {
  student: { id: number; name: string; studentCode: string; status: UserStatus };
  equipment: Equipment;
}

export interface NewReservation {
  equipmentId: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface MessageResponse<T> {
  message: string;
  reservation: T;
}

export interface ReturnResult {
  reservationId: number;
  reservationStatus: ReservationStatus;
  equipmentStatus: EquipmentStatus;
  studentStatus: UserStatus;
  penalized: boolean;
  returnedAt: string;
  agreedEndTime: string;
  message: string;
}

export interface ApiErrorBody {
  message: string;
  code: string;
}

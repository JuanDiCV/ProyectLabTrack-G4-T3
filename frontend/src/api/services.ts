import { api } from './client';
import type {
  CatalogResponse,
  Category,
  LoginResponse,
  MessageResponse,
  NewReservation,
  Reservation,
  ReservationDetail,
  ReturnResult,
} from '../types';

export const authApi = {
  async login(studentCode: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { studentCode, password });
    return data;
  },
};

export const catalogApi = {
  async list(category?: Category | ''): Promise<CatalogResponse> {
    const { data } = await api.get<CatalogResponse>('/catalog', {
      params: category ? { category } : undefined,
    });
    return data;
  },
};

export const reservationApi = {
  async create(payload: NewReservation): Promise<MessageResponse<Reservation>> {
    const { data } = await api.post<MessageResponse<Reservation>>('/reservations', payload);
    return data;
  },
  async listMine(): Promise<ReservationDetail[]> {
    const { data } = await api.get<ReservationDetail[]>('/reservations/me');
    return data;
  },
};

export const adminApi = {
  async listPending(): Promise<ReservationDetail[]> {
    const { data } = await api.get<ReservationDetail[]>('/admin/reservations/pending');
    return data;
  },
  async approve(id: number): Promise<MessageResponse<Reservation>> {
    const { data } = await api.patch<MessageResponse<Reservation>>(`/admin/reservations/${id}/approve`);
    return data;
  },
  async reject(id: number, rejectionReason: string): Promise<MessageResponse<Reservation>> {
    const { data } = await api.patch<MessageResponse<Reservation>>(`/admin/reservations/${id}/reject`, {
      rejectionReason,
    });
    return data;
  },
  async searchActive(q: string): Promise<ReservationDetail[]> {
    const { data } = await api.get<ReservationDetail[]>('/returns/active', { params: q ? { q } : undefined });
    return data;
  },
  async markReturn(id: number): Promise<ReturnResult> {
    const { data } = await api.post<ReturnResult>(`/returns/${id}`);
    return data;
  },
};

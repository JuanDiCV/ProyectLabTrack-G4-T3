import axios from 'axios';
import type { ApiErrorBody } from '../types';

export interface UiError {
  message: string;
  status: number | null;
  code: string | null;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && typeof (value as ApiErrorBody).message === 'string';
}

/** Convierte cualquier error (Axios o JS) en un mensaje mostrable en la UI. */
export function toUiError(error: unknown): UiError {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (isApiErrorBody(body)) {
      return { message: body.message, status: error.response?.status ?? null, code: body.code ?? null };
    }
    return { message: 'No fue posible conectar con el servidor. Intente nuevamente.', status: null, code: null };
  }
  return { message: error instanceof Error ? error.message : 'Error inesperado', status: null, code: null };
}

/** HU-01: 423/403 por bloqueo se muestran como alerta de seguridad. */
export function isSecurityAlert(error: UiError): boolean {
  return error.status === 423 || error.status === 403;
}

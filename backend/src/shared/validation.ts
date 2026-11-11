import type { ZodType, ZodTypeDef } from 'zod';
import { badRequest } from './errors';

/**
 * Valida una entrada desconocida con Zod y convierte el primer error en un AppError 400.
 * Permite que los servicios validen sin depender de Express.
 */
export function parseOrThrow<T>(schema: ZodType<T, ZodTypeDef, unknown>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  const firstIssue = result.error.issues[0];
  throw badRequest(firstIssue?.message ?? 'Datos de entrada inválidos', 'VALIDATION_ERROR');
}

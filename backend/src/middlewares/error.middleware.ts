import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors';
import { MESSAGES } from '../shared/messages';

interface ErrorBody {
  message: string;
  code: string;
}

function isJsonSyntaxError(error: unknown): boolean {
  return error instanceof SyntaxError && 'body' in error;
}

function toErrorResponse(error: unknown): { status: number; body: ErrorBody } {
  if (error instanceof AppError) {
    return { status: error.statusCode, body: { message: error.message, code: error.code } };
  }
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? 'Datos de entrada inválidos';
    return { status: 400, body: { message, code: 'VALIDATION_ERROR' } };
  }
  if (isJsonSyntaxError(error)) {
    return { status: 400, body: { message: MESSAGES.INVALID_JSON, code: 'INVALID_JSON' } };
  }
  return { status: 500, body: { message: MESSAGES.INTERNAL, code: 'INTERNAL_ERROR' } };
}

/** Middleware final: traduce errores de dominio a respuestas HTTP coherentes. */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const { status, body } = toErrorResponse(error);
  if (status >= 500) {
    console.error('[error]', error);
  }
  res.status(status).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: MESSAGES.NOT_FOUND, code: 'NOT_FOUND' });
}

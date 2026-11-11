/**
 * Error de aplicación con código HTTP. Los servicios lanzan AppError sin conocer Express;
 * el middleware de errores lo traduce a la respuesta HTTP.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, code = 'BAD_REQUEST'): AppError => new AppError(400, message, code);
export const unauthorized = (message: string, code = 'UNAUTHORIZED'): AppError => new AppError(401, message, code);
export const forbidden = (message: string, code = 'FORBIDDEN'): AppError => new AppError(403, message, code);
export const notFound = (message: string, code = 'NOT_FOUND'): AppError => new AppError(404, message, code);
export const conflict = (message: string, code = 'CONFLICT'): AppError => new AppError(409, message, code);
export const locked = (message: string, code = 'ACCOUNT_LOCKED'): AppError => new AppError(423, message, code);

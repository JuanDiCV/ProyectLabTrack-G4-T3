import { AppError } from '../../src/shared/errors';

/** Ejecuta la promesa y devuelve el AppError lanzado; falla si no se lanzó ninguno. */
export async function captureAppError(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) {
      return error;
    }
    throw error;
  }
  throw new Error('Se esperaba que la operación lanzara un AppError');
}

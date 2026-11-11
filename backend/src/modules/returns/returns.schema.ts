import { z } from 'zod';

/** HU-05: búsqueda de reservas activas por nombre o código del estudiante (vacío = todas). */
export const activeSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, 'La búsqueda no puede superar 100 caracteres')
    .optional()
    .transform((value) => value ?? ''),
});

export type ActiveSearchQuery = z.infer<typeof activeSearchSchema>;

export { idParamSchema } from '../reservations/reservations.schema';

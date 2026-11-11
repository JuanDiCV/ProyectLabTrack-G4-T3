import { z } from 'zod';
import { CATEGORIES } from '../../shared/domain';
import { MESSAGES } from '../../shared/messages';

/** Normaliza a NFC para aceptar "Cómputo" sin importar cómo se codificó la tilde. */
const normalizeCategory = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim().normalize('NFC');
  return trimmed === '' ? undefined : trimmed;
};

export const catalogQuerySchema = z.object({
  category: z.preprocess(
    normalizeCategory,
    z.enum(CATEGORIES, { errorMap: () => ({ message: MESSAGES.INVALID_CATEGORY }) }).optional(),
  ),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

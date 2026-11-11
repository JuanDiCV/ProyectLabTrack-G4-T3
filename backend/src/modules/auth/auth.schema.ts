import { z } from 'zod';
import { MESSAGES } from '../../shared/messages';

const requiredText = z
  .string({ required_error: MESSAGES.REQUIRED_FIELDS, invalid_type_error: MESSAGES.REQUIRED_FIELDS })
  .refine((value) => value.trim().length > 0, { message: MESSAGES.REQUIRED_FIELDS });

/** HU-01: ambos campos son obligatorios. */
export const loginSchema = z.object(
  {
    studentCode: requiredText.transform((value) => value.trim()),
    password: requiredText,
  },
  { required_error: MESSAGES.REQUIRED_FIELDS, invalid_type_error: MESSAGES.REQUIRED_FIELDS },
);

export type LoginInput = z.infer<typeof loginSchema>;

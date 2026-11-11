import { z } from 'zod';
import { MESSAGES } from '../../shared/messages';
import { TIME_REGEX, isValidCalendarDate, toMinutes } from '../../shared/time';

const timeField = z
  .string({ required_error: MESSAGES.INVALID_TIME, invalid_type_error: MESSAGES.INVALID_TIME })
  .regex(TIME_REGEX, MESSAGES.INVALID_TIME);

/** HU-03: datos de una nueva reserva. */
export const createReservationSchema = z
  .object({
    equipmentId: z.coerce
      .number({ invalid_type_error: MESSAGES.INVALID_EQUIPMENT_ID })
      .int(MESSAGES.INVALID_EQUIPMENT_ID)
      .positive(MESSAGES.INVALID_EQUIPMENT_ID),
    date: z
      .string({ required_error: MESSAGES.INVALID_DATE, invalid_type_error: MESSAGES.INVALID_DATE })
      .refine(isValidCalendarDate, { message: MESSAGES.INVALID_DATE }),
    startTime: timeField,
    endTime: timeField,
  })
  .refine((data) => toMinutes(data.startTime) < toMinutes(data.endTime), {
    message: MESSAGES.INVALID_RANGE,
    path: ['endTime'],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

/** HU-04: el motivo de rechazo es obligatorio (no vacío ni solo espacios). */
export const rejectReservationSchema = z.object(
  {
    rejectionReason: z
      .string({ required_error: MESSAGES.REJECTION_REQUIRED, invalid_type_error: MESSAGES.REJECTION_REQUIRED })
      .trim()
      .min(1, MESSAGES.REJECTION_REQUIRED)
      .max(500, 'La justificación no puede superar 500 caracteres'),
  },
  { required_error: MESSAGES.REJECTION_REQUIRED, invalid_type_error: MESSAGES.REJECTION_REQUIRED },
);

export type RejectReservationInput = z.infer<typeof rejectReservationSchema>;

export const idParamSchema = z.coerce
  .number({ invalid_type_error: MESSAGES.INVALID_ID })
  .int(MESSAGES.INVALID_ID)
  .positive(MESSAGES.INVALID_ID);

import type { TimeSlot } from './domain';

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Convierte "HH:mm" a minutos desde la medianoche. */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Regla de cruce de horarios: newStart < existingEnd && newEnd > existingStart.
 * Un bloque que termina a las 11:00 NO se cruza con otro que inicia a las 11:00.
 */
export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(a.endTime) > toMinutes(b.startTime);
}

/** true si `outer` cubre completamente a `inner`. */
export function slotContains(outer: TimeSlot, inner: TimeSlot): boolean {
  return toMinutes(outer.startTime) <= toMinutes(inner.startTime) && toMinutes(outer.endTime) >= toMinutes(inner.endTime);
}

/** Combina fecha YYYY-MM-DD y hora HH:mm en un Date en la zona horaria local del servidor. */
export function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

/** Valida que la cadena YYYY-MM-DD represente un día real del calendario. */
export function isValidCalendarDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(year, month - 1, day);
  return candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day;
}

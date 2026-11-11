import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReturnService, isLateReturn } from '../../src/modules/returns/returns.service';
import { FixedClock } from '../../src/shared/clock';
import { EQUIPMENT_STATUS, RESERVATION_STATUS, type ReservationEntity } from '../../src/shared/domain';
import { MESSAGES } from '../../src/shared/messages';
import { captureAppError } from '../helpers/assertions';
import { EQUIPMENT_IDS, STUDENT_ID, TEST_DATE, createSeededStore } from '../helpers/fixtures';
import { InMemoryReturnRepository, type InMemoryStore } from '../helpers/in-memory';

describe('HU-05: Devolución y penalización automática', () => {
  let store: InMemoryStore;
  let clock: FixedClock;
  let service: ReturnService;
  let onInventoryChange: ReturnType<typeof vi.fn>;
  let active: ReservationEntity;

  /** Reserva activa: Juan Pérez tiene Laptop HP-001 el 2026-11-15 de 09:00 a 11:00 (hora fin acordada 11:00). */
  beforeEach(() => {
    store = createSeededStore();
    clock = new FixedClock(`${TEST_DATE}T09:00:00`);
    onInventoryChange = vi.fn();
    service = new ReturnService({ returns: new InMemoryReturnRepository(store), clock, onInventoryChange });
    active = store.insertReservation({
      userId: STUDENT_ID,
      equipmentId: EQUIPMENT_IDS.LAPTOP,
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '11:00',
      status: RESERVATION_STATUS.APPROVED,
    });
    store.setEquipmentStatus(EQUIPMENT_IDS.LAPTOP, EQUIPMENT_STATUS.BORROWED);
  });

  const returnAt = (time: string) => {
    clock.set(`${TEST_DATE}T${time}:00`);
    return service.markReturn(active.id);
  };

  it('CP-025: Buscar reserva activa por nombre o código del estudiante (Juan Pérez / 20261001) para Laptop HP-001', async () => {
    const byName = await service.searchActive({ q: 'Juan Pérez' });
    const byCode = await service.searchActive({ q: '20261001' });
    const noMatch = await service.searchActive({ q: 'Inexistente' });

    for (const result of [byName, byCode]) {
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: active.id,
        status: 'Aprobada',
        student: { name: 'Juan Pérez', studentCode: '20261001' },
        equipment: { name: 'Laptop HP-001' },
      });
    }
    expect(noMatch).toHaveLength(0);
  });

  it('CP-026: Registrar la devolución de un equipo con reserva activa', async () => {
    const result = await returnAt('10:45');

    expect(result.reservationStatus).toBe('Finalizada');
    expect(store.reservation(active.id).status).toBe('Finalizada');
    expect(store.reservation(active.id).returnedAt?.getTime()).toBe(clock.now().getTime());
    expect(await service.searchActive({ q: '20261001' })).toHaveLength(0);
  });

  it('CP-027: Laptop HP-001 cambia inmediatamente de "Prestado" a "Disponible" tras marcar la devolución', async () => {
    expect(store.equipmentById(EQUIPMENT_IDS.LAPTOP).status).toBe('Prestado');

    const result = await returnAt('10:45');

    expect(result.equipmentStatus).toBe('Disponible');
    expect(store.equipmentById(EQUIPMENT_IDS.LAPTOP).status).toBe('Disponible');
    expect(onInventoryChange).toHaveBeenCalledTimes(1);
  });

  it('CP-028: Devolución a las 10:30 (antes de la hora fin 11:00) -> el estudiante NO es penalizado', async () => {
    const result = await returnAt('10:30');

    expect(result.penalized).toBe(false);
    expect(result.studentStatus).toBe('Activo');
    expect(store.user(STUDENT_ID).status).toBe('Activo');
  });

  it('CP-029: Devolución a las 11:30 (después de la hora fin 11:00) -> el estudiante pasa a "Penalizado"', async () => {
    const result = await returnAt('11:30');

    expect(result.penalized).toBe(true);
    expect(result.studentStatus).toBe('Penalizado');
    expect(result.message).toBe(MESSAGES.RETURN_LATE);
    expect(store.user(STUDENT_ID).status).toBe('Penalizado');
  });

  it('CP-030: Devolución exactamente a las 11:00 (hora límite 11:00) -> el estudiante NO es penalizado', async () => {
    const result = await returnAt('11:00');

    expect(result.penalized).toBe(false);
    expect(result.studentStatus).toBe('Activo');
    expect(store.user(STUDENT_ID).status).toBe('Activo');
  });

  describe('Pruebas complementarias de HU-05', () => {
    it('isLateReturn es estrictamente mayor: 1 ms después de la hora fin ya es tardía', () => {
      const agreedEnd = new Date(`${TEST_DATE}T11:00:00`);

      expect(isLateReturn(new Date(agreedEnd.getTime()), agreedEnd)).toBe(false);
      expect(isLateReturn(new Date(agreedEnd.getTime() + 1), agreedEnd)).toBe(true);
    });

    it('no permite devolver una reserva ya finalizada ni una inexistente', async () => {
      await returnAt('10:30');

      const again = await captureAppError(service.markReturn(active.id));
      const missing = await captureAppError(service.markReturn(999));

      expect(again.statusCode).toBe(409);
      expect(missing.statusCode).toBe(404);
    });

    it('sin término de búsqueda lista todas las reservas activas', async () => {
      expect(await service.searchActive({})).toHaveLength(1);
    });
  });
});

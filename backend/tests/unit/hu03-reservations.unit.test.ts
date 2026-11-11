import { beforeEach, describe, expect, it } from 'vitest';
import { ReservationService } from '../../src/modules/reservations/reservations.service';
import { FixedClock } from '../../src/shared/clock';
import { EQUIPMENT_STATUS, RESERVATION_STATUS, USER_STATUS } from '../../src/shared/domain';
import { MESSAGES } from '../../src/shared/messages';
import { slotsOverlap } from '../../src/shared/time';
import { captureAppError } from '../helpers/assertions';
import { EQUIPMENT_IDS, SECOND_STUDENT_ID, STUDENT_ID, TEST_DATE, createSeededStore } from '../helpers/fixtures';
import {
  InMemoryEquipmentRepository,
  InMemoryReservationRepository,
  InMemoryUserRepository,
  type InMemoryStore,
} from '../helpers/in-memory';

describe('HU-03: Reserva de equipos (flujo crítico)', () => {
  let store: InMemoryStore;
  let clock: FixedClock;
  let service: ReservationService;

  beforeEach(() => {
    store = createSeededStore();
    clock = new FixedClock('2026-11-10T08:00:00');
    service = new ReservationService({
      reservations: new InMemoryReservationRepository(store),
      equipment: new InMemoryEquipmentRepository(store),
      users: new InMemoryUserRepository(store),
      clock,
    });
  });

  /** Otra estudiante tiene aprobada la Laptop de 09:00 a 11:00 (el equipo figura como "Prestado"). */
  const givenLaptopApprovedFrom9To11 = () => {
    store.insertReservation({
      userId: SECOND_STUDENT_ID,
      equipmentId: EQUIPMENT_IDS.LAPTOP,
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '11:00',
      status: RESERVATION_STATUS.APPROVED,
    });
    store.setEquipmentStatus(EQUIPMENT_IDS.LAPTOP, EQUIPMENT_STATUS.BORROWED);
  };

  const reserve = (equipmentId: number, startTime: string, endTime: string) =>
    service.create(STUDENT_ID, { equipmentId, date: TEST_DATE, startTime, endTime });

  const reservationsOf = (userId: number) => store.reservations.filter((r) => r.userId === userId);

  it('CP-014: Reservar equipo disponible (Laptop HP-001) el 2026-11-15 de 09:00 a 11:00', async () => {
    const reservation = await reserve(EQUIPMENT_IDS.LAPTOP, '09:00', '11:00');

    expect(reservation).toMatchObject({
      userId: STUDENT_ID,
      equipmentId: EQUIPMENT_IDS.LAPTOP,
      date: '2026-11-15',
      startTime: '09:00',
      endTime: '11:00',
      status: 'Pendiente',
    });
    expect(store.reservations).toHaveLength(1);
  });

  it('CP-015: Intentar reservar Laptop HP-001 cuando figura como "Prestado" (2026-11-15, 09:00-11:00) -> impide reserva', async () => {
    givenLaptopApprovedFrom9To11();

    const error = await captureAppError(reserve(EQUIPMENT_IDS.LAPTOP, '09:00', '11:00'));

    expect(error.statusCode).toBe(409);
    expect(error.message).toBe(MESSAGES.EQUIPMENT_BORROWED);
    expect(error.message).toContain('no está disponible');
    expect(reservationsOf(STUDENT_ID)).toHaveLength(0);
  });

  it('CP-016: Horario 10:00-12:00 que se cruza con reserva aprobada 09:00-11:00 -> bloquea la transacción', async () => {
    givenLaptopApprovedFrom9To11();

    const error = await captureAppError(reserve(EQUIPMENT_IDS.LAPTOP, '10:00', '12:00'));

    expect(error.statusCode).toBe(409);
    expect(error.message).toBe(MESSAGES.SCHEDULE_OVERLAP);
    expect(reservationsOf(STUDENT_ID)).toHaveLength(0);
  });

  it('CP-017: Reservar Laptop HP-001 de 11:00 a 13:00 tras una reserva de 09:00 a 11:00 -> permite (sin superposición)', async () => {
    givenLaptopApprovedFrom9To11();

    const reservation = await reserve(EQUIPMENT_IDS.LAPTOP, '11:00', '13:00');

    expect(reservation.status).toBe('Pendiente');
    expect(reservation).toMatchObject({ startTime: '11:00', endTime: '13:00' });
    expect(slotsOverlap({ startTime: '09:00', endTime: '11:00' }, { startTime: '11:00', endTime: '13:00' })).toBe(false);
  });

  it('CP-018: Dos equipos simultáneos (Laptop 09:00-11:00 y Proyector 10:00-12:00) del mismo estudiante -> impide la segunda', async () => {
    await reserve(EQUIPMENT_IDS.LAPTOP, '09:00', '11:00');

    const error = await captureAppError(reserve(EQUIPMENT_IDS.PROJECTOR, '10:00', '12:00'));

    expect(error.statusCode).toBe(409);
    expect(error.message).toBe(MESSAGES.STUDENT_SIMULTANEOUS);
    expect(reservationsOf(STUDENT_ID)).toHaveLength(1);
    expect(reservationsOf(STUDENT_ID)[0]?.equipmentId).toBe(EQUIPMENT_IDS.LAPTOP);
  });

  it('CP-019: Reservar Proyector PR-002 de 11:00 a 13:00 cuando la reserva de Laptop (09:00-11:00) ya finalizó -> permite', async () => {
    store.insertReservation({
      userId: STUDENT_ID,
      equipmentId: EQUIPMENT_IDS.LAPTOP,
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '11:00',
      status: RESERVATION_STATUS.APPROVED,
    });

    const reservation = await reserve(EQUIPMENT_IDS.PROJECTOR, '11:00', '13:00');

    expect(reservation).toMatchObject({ equipmentId: EQUIPMENT_IDS.PROJECTOR, status: 'Pendiente' });
    expect(reservationsOf(STUDENT_ID)).toHaveLength(2);
  });

  describe('Pruebas complementarias de HU-03', () => {
    it('no permite reservar en una fecha/hora pasada según el reloj del sistema', async () => {
      clock.set('2026-11-15T09:30:00');

      const error = await captureAppError(reserve(EQUIPMENT_IDS.LAPTOP, '09:00', '11:00'));

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe(MESSAGES.PAST_SLOT);
    });

    it('valida que la hora de fin sea posterior a la de inicio', async () => {
      const error = await captureAppError(reserve(EQUIPMENT_IDS.LAPTOP, '11:00', '09:00'));

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe(MESSAGES.INVALID_RANGE);
    });

    it('rechaza fechas inexistentes y equipos inexistentes', async () => {
      const badDate = await captureAppError(
        service.create(STUDENT_ID, { equipmentId: 1, date: '2026-02-30', startTime: '09:00', endTime: '10:00' }),
      );
      const badEquipment = await captureAppError(reserve(999, '09:00', '10:00'));

      expect(badDate.statusCode).toBe(400);
      expect(badEquipment.statusCode).toBe(404);
    });

    it('un estudiante penalizado no puede reservar', async () => {
      store.setUserStatus(STUDENT_ID, USER_STATUS.PENALIZED);

      const error = await captureAppError(reserve(EQUIPMENT_IDS.LAPTOP, '09:00', '11:00'));

      expect(error.statusCode).toBe(403);
    });

    it('las reservas pendientes de otros estudiantes no bloquean el equipo (solo las aprobadas)', async () => {
      await service.create(SECOND_STUDENT_ID, {
        equipmentId: EQUIPMENT_IDS.LAPTOP,
        date: TEST_DATE,
        startTime: '09:00',
        endTime: '11:00',
      });

      const reservation = await reserve(EQUIPMENT_IDS.LAPTOP, '09:00', '11:00');

      expect(reservation.status).toBe('Pendiente');
      expect(await service.listMine(STUDENT_ID)).toHaveLength(1);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationService } from '../../src/modules/reservations/reservations.service';
import { FixedClock } from '../../src/shared/clock';
import { RESERVATION_STATUS, type ReservationEntity } from '../../src/shared/domain';
import { MESSAGES } from '../../src/shared/messages';
import { captureAppError } from '../helpers/assertions';
import { EQUIPMENT_IDS, SECOND_STUDENT_ID, STUDENT_ID, TEST_DATE, createSeededStore } from '../helpers/fixtures';
import {
  InMemoryEquipmentRepository,
  InMemoryReservationRepository,
  InMemoryUserRepository,
  type InMemoryStore,
} from '../helpers/in-memory';

describe('HU-04: Gestión de solicitudes (panel del encargado)', () => {
  let store: InMemoryStore;
  let service: ReservationService;
  let onInventoryChange: ReturnType<typeof vi.fn>;
  let pending: ReservationEntity;

  beforeEach(async () => {
    store = createSeededStore();
    onInventoryChange = vi.fn();
    service = new ReservationService({
      reservations: new InMemoryReservationRepository(store),
      equipment: new InMemoryEquipmentRepository(store),
      users: new InMemoryUserRepository(store),
      clock: new FixedClock('2026-11-10T08:00:00'),
      onInventoryChange,
    });
    pending = await service.create(STUDENT_ID, {
      equipmentId: EQUIPMENT_IDS.LAPTOP,
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '11:00',
    });
  });

  it('CP-020: Visualizar el listado de reservas pendientes con datos de estudiante, equipo y horario', async () => {
    const list = await service.listPending();

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: pending.id,
      status: 'Pendiente',
      date: '2026-11-15',
      startTime: '09:00',
      endTime: '11:00',
      student: { name: 'Juan Pérez', studentCode: '20261001' },
      equipment: { name: 'Laptop HP-001', inventoryCode: 'INV-COMP-001' },
    });
  });

  it('CP-021: Aprobar solicitud pendiente de Juan Pérez para Laptop HP-001 -> estado "Aprobada"', async () => {
    const approved = await service.approve(pending.id);

    expect(approved.status).toBe('Aprobada');
    expect(store.reservation(pending.id).status).toBe('Aprobada');
    expect(await service.listPending()).toHaveLength(0);
  });

  it('CP-022: Rechazar solicitud con justificación "Equipo en mantenimiento" -> "Rechazada" y guarda el motivo', async () => {
    const rejected = await service.reject(pending.id, { rejectionReason: 'Equipo en mantenimiento' });

    expect(rejected.status).toBe('Rechazada');
    expect(rejected.rejectionReason).toBe('Equipo en mantenimiento');
    expect(store.reservation(pending.id)).toMatchObject({
      status: 'Rechazada',
      rejectionReason: 'Equipo en mantenimiento',
    });
  });

  it('CP-023: Rechazar dejando vacía la justificación -> impide el rechazo y exige justificación obligatoria', async () => {
    const empty = await captureAppError(service.reject(pending.id, { rejectionReason: '' }));
    const blank = await captureAppError(service.reject(pending.id, { rejectionReason: '    ' }));
    const missing = await captureAppError(service.reject(pending.id, {}));

    for (const error of [empty, blank, missing]) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe(MESSAGES.REJECTION_REQUIRED);
    }
    expect(store.reservation(pending.id)).toMatchObject({ status: 'Pendiente', rejectionReason: null });
  });

  it('CP-024: Laptop HP-001 cambia a estado "Prestado" después de aprobar la reserva', async () => {
    expect(store.equipmentById(EQUIPMENT_IDS.LAPTOP).status).toBe('Disponible');

    await service.approve(pending.id);

    expect(store.equipmentById(EQUIPMENT_IDS.LAPTOP).status).toBe('Prestado');
    expect(onInventoryChange).toHaveBeenCalledTimes(1);
  });

  describe('Pruebas complementarias de HU-04', () => {
    it('no permite aprobar ni rechazar una solicitud que ya no está Pendiente', async () => {
      await service.approve(pending.id);

      const approveAgain = await captureAppError(service.approve(pending.id));
      const rejectApproved = await captureAppError(service.reject(pending.id, { rejectionReason: 'Motivo' }));

      expect(approveAgain.statusCode).toBe(409);
      expect(rejectApproved.statusCode).toBe(409);
    });

    it('responde 404 para reservas inexistentes y 400 para identificadores inválidos', async () => {
      expect((await captureAppError(service.approve(999))).statusCode).toBe(404);
      expect((await captureAppError(service.approve('abc'))).statusCode).toBe(400);
    });

    it('no aprueba una solicitud cuyo horario se cruza con otra ya aprobada del mismo equipo', async () => {
      const competing = await service.create(SECOND_STUDENT_ID, {
        equipmentId: EQUIPMENT_IDS.LAPTOP,
        date: TEST_DATE,
        startTime: '10:00',
        endTime: '12:00',
      });
      await service.approve(pending.id);

      const error = await captureAppError(service.approve(competing.id));

      expect(error.statusCode).toBe(409);
      expect(store.reservation(competing.id).status).toBe(RESERVATION_STATUS.PENDING);
    });
  });
});

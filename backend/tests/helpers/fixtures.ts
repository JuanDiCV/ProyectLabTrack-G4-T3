/**
 * Fixtures equivalentes a prisma/seed.ts (matriz de pruebas).
 * Las contraseñas se toman de variables de entorno con fallback seguro solo para pruebas.
 */
import bcrypt from 'bcryptjs';
import { EQUIPMENT_STATUS, ROLES, USER_STATUS, type EquipmentEntity, type UserEntity } from '../../src/shared/domain';
import { InMemoryStore } from './in-memory';

export const STUDENT_CODE = '20261001';
export const STUDENT_NAME = 'Juan Pérez';
export const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD ?? 'Estudiante123';
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Admin123';
export const WRONG_PASSWORD = process.env.TEST_WRONG_PASSWORD ?? 'Incorrecta123';
export const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET ?? 'labtrack-unit-test-secret';

export const STUDENT_ID = 1;
export const ADMIN_ID = 2;
export const SECOND_STUDENT_ID = 3;

export const EQUIPMENT_IDS = {
  LAPTOP: 1,
  PROJECTOR: 2,
  OSCILLOSCOPE: 3,
  ROUTER: 4,
} as const;

/** Fecha de la matriz de pruebas de reservas y devoluciones. */
export const TEST_DATE = '2026-11-15';

/** Hash con costo bajo: solo acelera las pruebas, bcrypt.compare funciona igual. */
const fastHash = (plain: string): string => bcrypt.hashSync(plain, 4);

function buildUser(partial: Pick<UserEntity, 'id' | 'name' | 'studentCode' | 'passwordHash' | 'role'>): UserEntity {
  return { status: USER_STATUS.ACTIVE, failedAttempts: 0, isLocked: false, lockedUntil: null, ...partial };
}

export function seedEquipment(): EquipmentEntity[] {
  const available = EQUIPMENT_STATUS.AVAILABLE;
  return [
    { id: EQUIPMENT_IDS.LAPTOP, name: 'Laptop HP-001', inventoryCode: 'INV-COMP-001', category: 'Cómputo', status: available },
    { id: EQUIPMENT_IDS.PROJECTOR, name: 'Proyector PR-002', inventoryCode: 'INV-COMP-002', category: 'Cómputo', status: available },
    {
      id: EQUIPMENT_IDS.OSCILLOSCOPE,
      name: 'Osciloscopio Digital OS-01',
      inventoryCode: 'INV-ELEC-001',
      category: 'Electrónica',
      status: available,
    },
    { id: EQUIPMENT_IDS.ROUTER, name: 'Router Cisco ISR-4321', inventoryCode: 'INV-RED-001', category: 'Redes', status: available },
  ];
}

export function createSeededStore(): InMemoryStore {
  const store = new InMemoryStore();
  store.users = [
    buildUser({
      id: STUDENT_ID,
      name: STUDENT_NAME,
      studentCode: STUDENT_CODE,
      passwordHash: fastHash(STUDENT_PASSWORD),
      role: ROLES.STUDENT,
    }),
    buildUser({
      id: ADMIN_ID,
      name: 'Admin Laboratorio',
      studentCode: 'ADMIN001',
      passwordHash: fastHash(ADMIN_PASSWORD),
      role: ROLES.ADMIN,
    }),
    buildUser({
      id: SECOND_STUDENT_ID,
      name: 'María Gómez',
      studentCode: '20261002',
      passwordHash: fastHash(STUDENT_PASSWORD),
      role: ROLES.STUDENT,
    }),
  ];
  store.equipment = seedEquipment();
  return store;
}

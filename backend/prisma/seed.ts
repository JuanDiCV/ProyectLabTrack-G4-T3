/**
 * Datos semilla obligatorios de la matriz de pruebas de LabTrack.
 * Es idempotente: reinicia usuarios (intentos, bloqueo, estado), equipos y elimina reservas.
 * Las contraseñas se leen de variables de entorno (backend/.env), nunca del código.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Defina ${name} en backend/.env (ver .env.example)`);
  }
  return value;
}

interface SeedUser {
  name: string;
  studentCode: string;
  password: string;
  role: 'STUDENT' | 'ADMIN';
}

const equipment = [
  { name: 'Laptop HP-001', inventoryCode: 'INV-COMP-001', category: 'Cómputo', imageUrl: '/equipment/laptop.svg' },
  { name: 'Proyector PR-002', inventoryCode: 'INV-COMP-002', category: 'Cómputo', imageUrl: '/equipment/proyector.svg' },
  {
    name: 'Osciloscopio Digital OS-01',
    inventoryCode: 'INV-ELEC-001',
    category: 'Electrónica',
    imageUrl: '/equipment/osciloscopio.svg',
  },
  { name: 'Router Cisco ISR-4321', inventoryCode: 'INV-RED-001', category: 'Redes', imageUrl: '/equipment/router.svg' },
] as const;

async function upsertUser(user: SeedUser): Promise<void> {
  const passwordHash = await bcrypt.hash(user.password, 10);
  const data = {
    name: user.name,
    passwordHash,
    role: user.role,
    status: 'Activo',
    failedAttempts: 0,
    isLocked: false,
    lockedUntil: null,
  };
  await prisma.user.upsert({
    where: { studentCode: user.studentCode },
    update: data,
    create: { ...data, studentCode: user.studentCode },
  });
}

async function main(): Promise<void> {
  await prisma.reservation.deleteMany();

  await upsertUser({
    name: 'Juan Pérez',
    studentCode: '20261001',
    password: requireEnv('SEED_STUDENT_PASSWORD'),
    role: 'STUDENT',
  });
  await upsertUser({
    name: 'Admin Laboratorio',
    studentCode: 'ADMIN001',
    password: requireEnv('SEED_ADMIN_PASSWORD'),
    role: 'ADMIN',
  });

  for (const item of equipment) {
    await prisma.equipment.upsert({
      where: { inventoryCode: item.inventoryCode },
      update: { name: item.name, category: item.category, imageUrl: item.imageUrl, status: 'Disponible' },
      create: { ...item, status: 'Disponible' },
    });
  }

  console.log('[seed] 2 usuarios y 4 equipos listos. Reservas reiniciadas.');
}

main()
  .catch((error: unknown) => {
    console.error('[seed] Error:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

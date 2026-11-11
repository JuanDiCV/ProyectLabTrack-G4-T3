import { PrismaClient } from '@prisma/client';

/** Instancia única de PrismaClient para toda la aplicación. */
export const prisma = new PrismaClient();

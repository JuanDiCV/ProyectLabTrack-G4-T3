import { createApp } from './app';
import { loadConfig } from './shared/env';
import { prisma } from './shared/prisma';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  await prisma.$connect();
  const app = createApp({ config, db: prisma });

  const server = app.listen(config.port, () => {
    console.log(`[LabTrack API] escuchando en http://localhost:${config.port}/api`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[LabTrack API] ${signal} recibido, cerrando...`);
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  console.error('[LabTrack API] Error al iniciar:', error);
  process.exit(1);
});

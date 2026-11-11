import cors from 'cors';
import express, { type Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createAuthenticate } from './middlewares/auth.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { createAuthController } from './modules/auth/auth.controller';
import { PrismaUserRepository } from './modules/auth/auth.repository';
import { createAuthRouter } from './modules/auth/auth.routes';
import { AuthService } from './modules/auth/auth.service';
import { createCatalogController } from './modules/catalog/catalog.controller';
import { PrismaEquipmentRepository } from './modules/catalog/catalog.repository';
import { createCatalogRouter } from './modules/catalog/catalog.routes';
import { CatalogService } from './modules/catalog/catalog.service';
import { createReservationController } from './modules/reservations/reservations.controller';
import { PrismaReservationRepository } from './modules/reservations/reservations.repository';
import { createAdminReservationRouter, createReservationRouter } from './modules/reservations/reservations.routes';
import { ReservationService } from './modules/reservations/reservations.service';
import { createReturnController } from './modules/returns/returns.controller';
import { PrismaReturnRepository } from './modules/returns/returns.repository';
import { createReturnRouter } from './modules/returns/returns.routes';
import { ReturnService } from './modules/returns/returns.service';
import { NodeCacheStore } from './shared/cache';
import { systemClock, type Clock } from './shared/clock';
import type { AppConfig } from './shared/env';
import { BcryptPasswordHasher, JwtTokenService } from './shared/security';

export interface AppDependencies {
  config: AppConfig;
  db: PrismaClient;
  clock?: Clock;
}

/** Composition root: crea repositorios, servicios, controladores y rutas. */
export function createApp({ config, db, clock = systemClock }: AppDependencies): Express {
  const tokens = new JwtTokenService(config.jwtSecret, config.jwtExpiresIn);
  const authenticate = createAuthenticate(tokens);

  const users = new PrismaUserRepository(db);
  const equipment = new PrismaEquipmentRepository(db);
  const reservations = new PrismaReservationRepository(db);
  const returns = new PrismaReturnRepository(db);

  const catalogService = new CatalogService(equipment, new NodeCacheStore(config.catalogCacheTtlSeconds));
  const onInventoryChange = (): void => catalogService.invalidate();

  const authService = new AuthService({
    users,
    hasher: new BcryptPasswordHasher(),
    tokens,
    clock,
    lockMinutes: config.lockMinutes,
  });
  const reservationService = new ReservationService({ reservations, equipment, users, clock, onInventoryChange });
  const returnService = new ReturnService({ returns, clock, onInventoryChange });

  const reservationController = createReservationController(reservationService);

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: clock.now().toISOString() });
  });
  app.use('/api/auth', createAuthRouter(createAuthController(authService), authenticate));
  app.use('/api/catalog', createCatalogRouter(createCatalogController(catalogService)));
  app.use('/api/reservations', createReservationRouter(reservationController, authenticate));
  app.use('/api/admin/reservations', createAdminReservationRouter(reservationController, authenticate));
  app.use('/api/returns', createReturnRouter(createReturnController(returnService), authenticate));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

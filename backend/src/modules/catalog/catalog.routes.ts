import { Router } from 'express';
import type { CatalogController } from './catalog.controller';

/** Catálogo público de solo lectura (objetivo de la prueba de carga CP-013). */
export function createCatalogRouter(controller: CatalogController): Router {
  const router = Router();
  router.get('/', controller.list);
  return router;
}

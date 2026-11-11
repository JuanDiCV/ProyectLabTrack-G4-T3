import type { Request, Response } from 'express';
import type { CatalogService } from './catalog.service';

export function createCatalogController(service: CatalogService) {
  return {
    /** GET /api/catalog?category=Cómputo → 200 | 400 */
    async list(req: Request, res: Response): Promise<void> {
      const result = await service.list(req.query);
      res.status(200).json(result);
    },
  };
}

export type CatalogController = ReturnType<typeof createCatalogController>;

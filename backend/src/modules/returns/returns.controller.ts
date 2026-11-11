import type { Request, Response } from 'express';
import type { ReturnService } from './returns.service';

export function createReturnController(service: ReturnService) {
  return {
    /** GET /api/returns/active?q=Juan → 200 */
    async searchActive(req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.searchActive(req.query));
    },

    /** POST /api/returns/:id → 200 | 404 | 409 */
    async markReturn(req: Request, res: Response): Promise<void> {
      res.status(200).json(await service.markReturn(req.params.id));
    },
  };
}

export type ReturnController = ReturnType<typeof createReturnController>;

import type { CacheStore } from '../../shared/cache';
import { EQUIPMENT_STATUS, type Category, type EquipmentEntity } from '../../shared/domain';
import { MESSAGES } from '../../shared/messages';
import { parseOrThrow } from '../../shared/validation';
import type { EquipmentRepository } from './catalog.repository';
import { catalogQuerySchema } from './catalog.schema';

export interface CatalogResult {
  category: Category | null;
  total: number;
  availableCount: number;
  items: EquipmentEntity[];
  /** "No hay equipos disponibles en esta categoría" cuando el filtro no tiene equipos Disponibles. */
  message: string | null;
}

const CACHE_PREFIX = 'catalog:';

/**
 * HU-02: Catálogo y filtrado de equipos.
 * Usa caché en memoria (invalidada en cada cambio de inventario) para soportar CP-013 (JMeter).
 */
export class CatalogService {
  constructor(
    private readonly equipment: EquipmentRepository,
    private readonly cache: CacheStore,
  ) {}

  async list(rawQuery: unknown = {}): Promise<CatalogResult> {
    const { category } = parseOrThrow(catalogQuerySchema, rawQuery);
    const cacheKey = `${CACHE_PREFIX}${category ?? 'all'}`;
    const cached = this.cache.get<CatalogResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const items = await this.equipment.findAll(category);
    const availableCount = items.filter((item) => item.status === EQUIPMENT_STATUS.AVAILABLE).length;
    const result: CatalogResult = {
      category: category ?? null,
      total: items.length,
      availableCount,
      items,
      message: category && availableCount === 0 ? MESSAGES.NO_EQUIPMENT_IN_CATEGORY : null,
    };
    this.cache.set(cacheKey, result);
    return result;
  }

  /** Invalida el catálogo cacheado (aprobaciones y devoluciones cambian el estado de equipos). */
  invalidate(): void {
    this.cache.flush();
  }
}

import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogService } from '../../src/modules/catalog/catalog.service';
import { MemoryCacheStore } from '../../src/shared/cache';
import { CATEGORIES, EQUIPMENT_STATUS } from '../../src/shared/domain';
import { captureAppError } from '../helpers/assertions';
import { EQUIPMENT_IDS, createSeededStore } from '../helpers/fixtures';
import { InMemoryEquipmentRepository, type InMemoryStore } from '../helpers/in-memory';

const NO_RESULTS_MESSAGE = 'No hay equipos disponibles en esta categoría';

describe('HU-02: Catálogo y filtrado de equipos', () => {
  let store: InMemoryStore;
  let repository: InMemoryEquipmentRepository;
  let cache: MemoryCacheStore;
  let service: CatalogService;

  beforeEach(() => {
    store = createSeededStore();
    repository = new InMemoryEquipmentRepository(store);
    cache = new MemoryCacheStore();
    service = new CatalogService(repository, cache);
  });

  it('CP-007: Visualizar el catálogo completo de equipos', async () => {
    const result = await service.list();

    expect(result.total).toBe(4);
    expect(result.category).toBeNull();
    expect(result.message).toBeNull();
    expect(result.items.map((item) => item.name)).toEqual([
      'Laptop HP-001',
      'Proyector PR-002',
      'Osciloscopio Digital OS-01',
      'Router Cisco ISR-4321',
    ]);
  });

  it('CP-008: Cada equipo contiene nombre, código de inventario, categoría y estado (Disponible/Prestado)', async () => {
    store.setEquipmentStatus(EQUIPMENT_IDS.LAPTOP, EQUIPMENT_STATUS.BORROWED);

    const { items } = await service.list();

    for (const item of items) {
      expect(item.name).toEqual(expect.any(String));
      expect(item.inventoryCode).toMatch(/^INV-[A-Z]+-\d{3}$/);
      expect(CATEGORIES).toContain(item.category);
      expect(['Disponible', 'Prestado']).toContain(item.status);
    }
    expect(items.find((item) => item.inventoryCode === 'INV-COMP-001')?.status).toBe('Prestado');
  });

  it('CP-009: Filtrar equipos por categoría "Cómputo"', async () => {
    const result = await service.list({ category: 'Cómputo' });

    expect(result.category).toBe('Cómputo');
    expect(result.items.map((item) => item.inventoryCode)).toEqual(['INV-COMP-001', 'INV-COMP-002']);
    expect(result.items.every((item) => item.category === 'Cómputo')).toBe(true);
    expect(result.message).toBeNull();
  });

  it('CP-010: Filtrar equipos por categoría "Electrónica"', async () => {
    const result = await service.list({ category: 'Electrónica' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ name: 'Osciloscopio Digital OS-01', category: 'Electrónica' });
    expect(result.message).toBeNull();
  });

  it('CP-011: Filtrar equipos por categoría "Redes"', async () => {
    const result = await service.list({ category: 'Redes' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ name: 'Router Cisco ISR-4321', inventoryCode: 'INV-RED-001' });
    expect(result.message).toBeNull();
  });

  it('CP-012: Filtro sin equipos disponibles -> "No hay equipos disponibles en esta categoría"', async () => {
    store.setEquipmentStatus(EQUIPMENT_IDS.ROUTER, EQUIPMENT_STATUS.BORROWED);

    const result = await service.list({ category: 'Redes' });

    expect(result.availableCount).toBe(0);
    expect(result.message).toBe(NO_RESULTS_MESSAGE);

    store.equipment = store.equipment.filter((item) => item.category !== 'Electrónica');
    const emptyCategory = await service.list({ category: 'Electrónica' });
    expect(emptyCategory.items).toEqual([]);
    expect(emptyCategory.message).toBe(NO_RESULTS_MESSAGE);
  });

  describe('Pruebas complementarias de HU-02 (caché para CP-013 y validaciones)', () => {
    it('sirve peticiones repetidas desde la caché sin volver a consultar el repositorio', async () => {
      await service.list({ category: 'Cómputo' });
      await service.list({ category: 'Cómputo' });
      await service.list({ category: 'Cómputo' });

      expect(repository.findAllCalls).toBe(1);
    });

    it('invalidate() limpia la caché para reflejar cambios de estado de equipos', async () => {
      await service.list();
      store.setEquipmentStatus(EQUIPMENT_IDS.LAPTOP, EQUIPMENT_STATUS.BORROWED);
      service.invalidate();

      const result = await service.list();

      expect(repository.findAllCalls).toBe(2);
      expect(result.availableCount).toBe(3);
    });

    it('acepta la categoría con tilde descompuesta (NFD) y rechaza categorías inválidas con 400', async () => {
      const nfd = await service.list({ category: 'Cómputo'.normalize('NFD') });
      const error = await captureAppError(service.list({ category: 'Mecánica' }));

      expect(nfd.total).toBe(2);
      expect(error.statusCode).toBe(400);
    });
  });
});

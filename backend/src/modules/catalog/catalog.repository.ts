import type { PrismaClient } from '@prisma/client';
import type { Category, EquipmentEntity } from '../../shared/domain';
import { toEquipmentEntity } from '../../shared/mappers';

export interface EquipmentRepository {
  findAll(category?: Category): Promise<EquipmentEntity[]>;
  findById(id: number): Promise<EquipmentEntity | null>;
}

export class PrismaEquipmentRepository implements EquipmentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(category?: Category): Promise<EquipmentEntity[]> {
    const rows = await this.db.equipment.findMany({
      where: category ? { category } : undefined,
      orderBy: { inventoryCode: 'asc' },
    });
    return rows.map(toEquipmentEntity);
  }

  async findById(id: number): Promise<EquipmentEntity | null> {
    const row = await this.db.equipment.findUnique({ where: { id } });
    return row ? toEquipmentEntity(row) : null;
  }
}

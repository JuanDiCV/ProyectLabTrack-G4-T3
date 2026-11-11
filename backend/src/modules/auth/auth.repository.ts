import type { PrismaClient } from '@prisma/client';
import type { UserEntity, UserStatus } from '../../shared/domain';
import { toUserEntity } from '../../shared/mappers';

export interface SecurityState {
  failedAttempts: number;
  isLocked: boolean;
  lockedUntil: Date | null;
}

export interface UserRepository {
  findByStudentCode(studentCode: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  updateSecurityState(id: number, state: SecurityState): Promise<void>;
  updateStatus(id: number, status: UserStatus): Promise<void>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByStudentCode(studentCode: string): Promise<UserEntity | null> {
    const row = await this.db.user.findUnique({ where: { studentCode } });
    return row ? toUserEntity(row) : null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toUserEntity(row) : null;
  }

  async updateSecurityState(id: number, state: SecurityState): Promise<void> {
    await this.db.user.update({ where: { id }, data: state });
  }

  async updateStatus(id: number, status: UserStatus): Promise<void> {
    await this.db.user.update({ where: { id }, data: { status } });
  }
}

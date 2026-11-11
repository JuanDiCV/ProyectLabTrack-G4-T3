import type { Clock } from '../../shared/clock';
import { toPublicUser, type PublicUser, type UserEntity } from '../../shared/domain';
import { locked, unauthorized } from '../../shared/errors';
import { MAX_FAILED_ATTEMPTS, MESSAGES } from '../../shared/messages';
import type { PasswordHasher, TokenService } from '../../shared/security';
import { parseOrThrow } from '../../shared/validation';
import type { UserRepository } from './auth.repository';
import { loginSchema } from './auth.schema';

export interface AuthServiceDeps {
  users: UserRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
  clock: Clock;
  lockMinutes: number;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

const UNLOCKED_STATE = { failedAttempts: 0, isLocked: false, lockedUntil: null } as const;

/**
 * HU-01: Autenticación segura con bloqueo tras 3 intentos fallidos consecutivos.
 * Lógica pura: no conoce Express ni Prisma.
 */
export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async login(rawInput: unknown): Promise<LoginResult> {
    const { studentCode, password } = parseOrThrow(loginSchema, rawInput);
    const found = await this.deps.users.findByStudentCode(studentCode);
    if (!found) {
      throw unauthorized(MESSAGES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }

    const now = this.deps.clock.now();
    const user = await this.releaseExpiredLock(found, now);
    if (user.isLocked) {
      throw locked(MESSAGES.ACCOUNT_LOCKED);
    }

    const passwordMatches = await this.deps.hasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return this.registerFailedAttempt(user, now);
    }

    await this.resetSecurityState(user);
    const token = this.deps.tokens.sign({
      id: user.id,
      name: user.name,
      studentCode: user.studentCode,
      role: user.role,
    });
    return { token, user: toPublicUser(user) };
  }

  /** Si el bloqueo temporal ya expiró, desbloquea la cuenta y reinicia el contador. */
  private async releaseExpiredLock(user: UserEntity, now: Date): Promise<UserEntity> {
    const lockExpired = user.isLocked && (!user.lockedUntil || user.lockedUntil.getTime() <= now.getTime());
    if (!lockExpired) {
      return user;
    }
    await this.deps.users.updateSecurityState(user.id, UNLOCKED_STATE);
    return { ...user, ...UNLOCKED_STATE };
  }

  private async registerFailedAttempt(user: UserEntity, now: Date): Promise<never> {
    const failedAttempts = user.failedAttempts + 1;
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + this.deps.lockMinutes * 60_000);
      await this.deps.users.updateSecurityState(user.id, { failedAttempts, isLocked: true, lockedUntil });
      throw locked(MESSAGES.ACCOUNT_LOCKED_LIMIT, 'ATTEMPTS_LIMIT_REACHED');
    }
    await this.deps.users.updateSecurityState(user.id, { failedAttempts, isLocked: false, lockedUntil: null });
    throw unauthorized(MESSAGES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
  }

  private async resetSecurityState(user: UserEntity): Promise<void> {
    if (user.failedAttempts > 0 || user.isLocked) {
      await this.deps.users.updateSecurityState(user.id, UNLOCKED_STATE);
    }
  }
}

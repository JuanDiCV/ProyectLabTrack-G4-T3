import { beforeEach, describe, expect, it } from 'vitest';
import { loginSchema } from '../../src/modules/auth/auth.schema';
import { AuthService } from '../../src/modules/auth/auth.service';
import { FixedClock } from '../../src/shared/clock';
import { ROLES } from '../../src/shared/domain';
import { MESSAGES } from '../../src/shared/messages';
import { BcryptPasswordHasher, JwtTokenService } from '../../src/shared/security';
import { captureAppError } from '../helpers/assertions';
import {
  STUDENT_CODE,
  STUDENT_ID,
  STUDENT_NAME,
  STUDENT_PASSWORD,
  TEST_JWT_SECRET,
  WRONG_PASSWORD,
  createSeededStore,
} from '../helpers/fixtures';
import { InMemoryUserRepository, type InMemoryStore } from '../helpers/in-memory';

const LOCK_MINUTES = 15;

describe('HU-01: Autenticación segura', () => {
  let store: InMemoryStore;
  let clock: FixedClock;
  let tokens: JwtTokenService;
  let service: AuthService;

  beforeEach(() => {
    store = createSeededStore();
    clock = new FixedClock('2026-11-10T08:00:00');
    tokens = new JwtTokenService(TEST_JWT_SECRET, '1h');
    service = new AuthService({
      users: new InMemoryUserRepository(store),
      hasher: new BcryptPasswordHasher(4),
      tokens,
      clock,
      lockMinutes: LOCK_MINUTES,
    });
  });

  const failLogin = (password = WRONG_PASSWORD) => captureAppError(service.login({ studentCode: STUDENT_CODE, password }));

  it('CP-001: Iniciar sesión con credenciales válidas (20261001 / Estudiante123)', async () => {
    const result = await service.login({ studentCode: STUDENT_CODE, password: STUDENT_PASSWORD });

    expect(result.user).toEqual({
      id: STUDENT_ID,
      name: STUDENT_NAME,
      studentCode: STUDENT_CODE,
      role: ROLES.STUDENT,
      status: 'Activo',
    });
    expect(result.token).toEqual(expect.any(String));
    expect(tokens.verify(result.token)).toMatchObject({ id: STUDENT_ID, studentCode: STUDENT_CODE, role: ROLES.STUDENT });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('CP-002: Iniciar sesión con código de estudiante incorrecto (99999999) -> "Credenciales inválidas"', async () => {
    const error = await captureAppError(service.login({ studentCode: '99999999', password: STUDENT_PASSWORD }));

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Credenciales inválidas');
  });

  it('CP-003: Iniciar sesión con contraseña incorrecta (Incorrecta123) -> "Credenciales inválidas"', async () => {
    const error = await failLogin();

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Credenciales inválidas');
    expect(store.user(STUDENT_ID).failedAttempts).toBe(1);
    expect(store.user(STUDENT_ID).isLocked).toBe(false);
  });

  it('CP-004: Iniciar sesión dejando los campos vacíos -> solicita completar campos obligatorios', async () => {
    const emptyFields = await captureAppError(service.login({ studentCode: '', password: '' }));
    const blankFields = await captureAppError(service.login({ studentCode: '   ', password: '   ' }));
    const missingBody = await captureAppError(service.login(undefined));

    for (const error of [emptyFields, blankFields, missingBody]) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe(MESSAGES.REQUIRED_FIELDS);
    }
    expect(loginSchema.safeParse({ studentCode: '', password: '' }).success).toBe(false);
    expect(store.user(STUDENT_ID).failedAttempts).toBe(0);
  });

  it('CP-005: Bloqueo después de tres intentos fallidos consecutivos (20261001 / Incorrecta123)', async () => {
    const first = await failLogin();
    const second = await failLogin();
    const third = await failLogin();

    expect([first.statusCode, second.statusCode]).toEqual([401, 401]);
    expect(third.statusCode).toBe(423);
    expect(third.message).toBe(MESSAGES.ACCOUNT_LOCKED_LIMIT);
    expect(third.message).toContain('Alerta de seguridad');

    const user = store.user(STUDENT_ID);
    expect(user.isLocked).toBe(true);
    expect(user.failedAttempts).toBe(3);
    expect(user.lockedUntil?.toISOString()).toBe(new Date(clock.now().getTime() + LOCK_MINUTES * 60_000).toISOString());
  });

  it('CP-006: Cuenta temporalmente bloqueada con credenciales correctas -> impide acceso con alerta de seguridad', async () => {
    await failLogin();
    await failLogin();
    await failLogin();
    clock.advanceMinutes(5);

    const error = await captureAppError(service.login({ studentCode: STUDENT_CODE, password: STUDENT_PASSWORD }));

    expect(error.statusCode).toBe(423);
    expect(error.message).toBe(MESSAGES.ACCOUNT_LOCKED);
    expect(error.message).toContain('temporalmente bloqueada');
    expect(store.user(STUDENT_ID).isLocked).toBe(true);
  });

  describe('Pruebas complementarias de HU-01', () => {
    it('desbloquea automáticamente cuando expira el tiempo de bloqueo', async () => {
      await failLogin();
      await failLogin();
      await failLogin();
      clock.advanceMinutes(LOCK_MINUTES);

      const result = await service.login({ studentCode: STUDENT_CODE, password: STUDENT_PASSWORD });

      expect(result.user.studentCode).toBe(STUDENT_CODE);
      expect(store.user(STUDENT_ID)).toMatchObject({ isLocked: false, failedAttempts: 0, lockedUntil: null });
    });

    it('un ingreso exitoso reinicia el contador de intentos (los intentos deben ser consecutivos)', async () => {
      await failLogin();
      await failLogin();
      await service.login({ studentCode: STUDENT_CODE, password: STUDENT_PASSWORD });
      const afterReset = await failLogin();

      expect(afterReset.statusCode).toBe(401);
      expect(store.user(STUDENT_ID).failedAttempts).toBe(1);
    });

    it('rechaza tokens manipulados', () => {
      expect(() => tokens.verify('token.invalido.firma')).toThrow();
    });
  });
});

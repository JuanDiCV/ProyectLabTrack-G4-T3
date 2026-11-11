import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { ROLES, type AuthUser, type Role } from './domain';

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface TokenService {
  sign(user: AuthUser): string;
  verify(token: string): AuthUser;
}

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

interface TokenClaims {
  sub: string;
  name: string;
  studentCode: string;
  role: Role;
}

function isRole(value: unknown): value is Role {
  return value === ROLES.ADMIN || value === ROLES.STUDENT;
}

function isTokenClaims(payload: unknown): payload is TokenClaims {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const claims = payload as Record<string, unknown>;
  return (
    typeof claims.sub === 'string' &&
    typeof claims.name === 'string' &&
    typeof claims.studentCode === 'string' &&
    isRole(claims.role)
  );
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: SignOptions['expiresIn'] = '8h',
  ) {
    if (!secret) {
      throw new Error('JWT secret no configurado');
    }
  }

  sign(user: AuthUser): string {
    const claims: TokenClaims = {
      sub: String(user.id),
      name: user.name,
      studentCode: user.studentCode,
      role: user.role,
    };
    return jwt.sign(claims, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): AuthUser {
    const payload: unknown = jwt.verify(token, this.secret);
    if (!isTokenClaims(payload)) {
      throw new Error('Token con formato inválido');
    }
    return { id: Number(payload.sub), name: payload.name, studentCode: payload.studentCode, role: payload.role };
  }
}

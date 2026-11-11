import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: SignOptions['expiresIn'];
  lockMinutes: number;
  catalogCacheTtlSeconds: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno requerida no definida: ${name}. Ejecute "npm run db:env -w backend".`);
  }
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Carga la configuración desde process.env (sin credenciales hardcodeadas). */
export function loadConfig(): AppConfig {
  return {
    port: numberEnv('PORT', 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'],
    lockMinutes: numberEnv('LOCK_MINUTES', 15),
    catalogCacheTtlSeconds: numberEnv('CATALOG_CACHE_TTL_SECONDS', 30),
  };
}

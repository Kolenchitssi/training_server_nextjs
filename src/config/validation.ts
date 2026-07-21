import type { Env } from './env';

export function validateEnv(env: Record<string, any>): Env {
  const validated: Partial<Env> = { ...env };

  validated.PORT = Number(env.PORT ?? 3002);
  validated.NODE_ENV = (env.NODE_ENV ?? 'development') as Env['NODE_ENV'];
  validated.FRONTEND_URL = env.FRONTEND_URL ?? '';
  validated.API_BASE_URL = env.API_BASE_URL ?? '';
  validated.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN ?? '24h';

  if (validated.NODE_ENV === 'production') {
    if (!env.JWT_SECRET) {
      throw new Error('Environment variable JWT_SECRET is required in production');
    }
    if (!env.DATABASE_URL) {
      throw new Error('Environment variable DATABASE_URL is required in production');
    }
    validated.JWT_SECRET = env.JWT_SECRET;
    validated.DATABASE_URL = env.DATABASE_URL;
  } else {
    validated.JWT_SECRET = env.JWT_SECRET ?? 'default-secret-change-in-production';
    validated.DATABASE_URL = env.DATABASE_URL ?? '';
  }

  return validated as Env;
}

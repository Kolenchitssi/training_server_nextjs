import type { Env } from './env';

export function validateEnv(env: Record<string, any>): Env {
  const validated: Partial<Env> = { ...env };

  validated.PORT = Number(env.PORT ?? 3002);
  validated.NODE_ENV = (env.NODE_ENV ?? 'development') as Env['NODE_ENV'];
  validated.FRONTEND_URL = env.FRONTEND_URL ?? '';
  validated.API_BASE_URL = env.API_BASE_URL ?? '';
  validated.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN ?? '24h';
  validated.FILE_STORAGE_DRIVER = (env.FILE_STORAGE_DRIVER ??
    'local') as Env['FILE_STORAGE_DRIVER'];
  validated.FILE_STORAGE_LOCAL_ROOT = env.FILE_STORAGE_LOCAL_ROOT ?? 'uploads';
  validated.FILE_STORAGE_PUBLIC_BASE_PATH =
    env.FILE_STORAGE_PUBLIC_BASE_PATH ?? '/uploads';
  validated.MAX_UPLOAD_SIZE_MB = Number(env.MAX_UPLOAD_SIZE_MB ?? 10);

  if (validated.FILE_STORAGE_DRIVER !== 'local') {
    throw new Error(
      `Unsupported FILE_STORAGE_DRIVER: ${validated.FILE_STORAGE_DRIVER}. Supported values: local`,
    );
  }

  if (
    !Number.isFinite(validated.MAX_UPLOAD_SIZE_MB) ||
    validated.MAX_UPLOAD_SIZE_MB <= 0
  ) {
    throw new Error('MAX_UPLOAD_SIZE_MB must be a positive number');
  }

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

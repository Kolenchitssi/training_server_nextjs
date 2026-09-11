export default () => ({
  PORT: process.env.PORT ?? '3000',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  FRONTEND_URL: process.env.FRONTEND_URL ?? '',
  API_BASE_URL: process.env.API_BASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '24h',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  FILE_STORAGE_DRIVER: process.env.FILE_STORAGE_DRIVER ?? 'local',
  FILE_STORAGE_LOCAL_ROOT: process.env.FILE_STORAGE_LOCAL_ROOT ?? 'uploads',
  FILE_STORAGE_PUBLIC_BASE_PATH: process.env.FILE_STORAGE_PUBLIC_BASE_PATH ?? '/uploads',
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB ?? '10',
});

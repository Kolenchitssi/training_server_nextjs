export default () => ({
  PORT: process.env.PORT ?? '3000',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  FRONTEND_URL: process.env.FRONTEND_URL ?? '',
  API_BASE_URL: process.env.API_BASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '24h',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
});

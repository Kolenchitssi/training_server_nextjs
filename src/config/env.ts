export type NodeEnv = 'development' | 'production' | 'test' | 'staging';

export interface Env {
  PORT: number;
  NODE_ENV: NodeEnv;
  FRONTEND_URL: string;
  API_BASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string | number;
  DATABASE_URL: string;
  FILE_STORAGE_DRIVER: 'local';
  FILE_STORAGE_LOCAL_ROOT: string;
  FILE_STORAGE_PUBLIC_BASE_PATH: string;
  MAX_UPLOAD_SIZE_MB: number;
}

export default Env;

export type NodeEnv = 'development' | 'production' | 'test' | 'staging';

export interface Env {
  PORT: number;
  NODE_ENV: NodeEnv;
  FRONTEND_URL: string;
  API_BASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string | number;
  DATABASE_URL: string;
}

export default Env;

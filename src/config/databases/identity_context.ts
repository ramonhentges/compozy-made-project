export interface IdentityDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections?: number;
}

import { parsePostgresUrl } from '../utils/postgres-url';

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getIdentityDatabaseConfig(): IdentityDatabaseConfig {
  const dbUrl = process.env.IDENTITY_DATABASE_URL;

  if (dbUrl) {
    const parsed = parsePostgresUrl(dbUrl);
    return {
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      user: parsed.user,
      password: parsed.password,
      maxConnections: parseInt(process.env.IDENTITY_MAX_CONNECTIONS ?? '20', 10),
    };
  }

  return {
    host: getRequiredEnv('IDENTITY_DB_HOST', 'localhost'),
    port: parseInt(process.env.IDENTITY_DB_PORT ?? '5432', 10),
    database: getRequiredEnv('IDENTITY_DB_NAME', 'identity_db'),
    user: getRequiredEnv('IDENTITY_DB_USER', 'postgres'),
    password: getRequiredEnv('IDENTITY_DB_PASSWORD', 'postgres'),
    maxConnections: parseInt(process.env.IDENTITY_MAX_CONNECTIONS ?? '20', 10),
  };
}

export const identityDbConfig: IdentityDatabaseConfig = getIdentityDatabaseConfig();
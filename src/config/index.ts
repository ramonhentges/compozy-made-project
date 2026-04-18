export interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  bcrypt: {
    rounds: number;
  };
}

export function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${url}`);
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: parseDatabaseUrl(
    getRequiredEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/app')
  ),
  jwt: {
    secret: getRequiredEnv('JWT_SECRET', 'dev-secret-do-not-use-in-production'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  },
};

import {
  IdentityDatabaseConfig,
  identityDbConfig,
} from "./databases/identity_context";

export interface AppConfig {
  port: number;
  identityDatabase: IdentityDatabaseConfig;
  jwt: {
    secret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  bcrypt: {
    rounds: number;
  };
}

import { parsePostgresUrl } from "./utils/postgres-url";

export function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function parseDatabaseUrl(
  url: string,
): ReturnType<typeof parsePostgresUrl> {
  return parsePostgresUrl(url);
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  identityDatabase: identityDbConfig,
  jwt: {
    secret: getRequiredEnv("JWT_SECRET", "dev-secret-do-not-use-in-production"),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? "7d",
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10),
  },
};

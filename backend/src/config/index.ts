import {
  IdentityDatabaseConfig,
  identityDbConfig,
} from "./databases/identity_context";

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  identityOutboxTopic: string;
}

export interface OutboxRelayConfig {
  pollIntervalMs: number;
  batchSize: number;
  maxAttempts: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
}

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
  kafka: KafkaConfig;
  outboxRelay: OutboxRelayConfig;
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

function parseKafkaBrokers(): string[] {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    return ["localhost:9092"];
  }
  return brokers
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
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
  kafka: {
    brokers: parseKafkaBrokers(),
    clientId: process.env.KAFKA_CLIENT_ID ?? "identity-service",
    identityOutboxTopic:
      process.env.IDENTITY_OUTBOX_TOPIC ?? "com.test.identity",
  },
  outboxRelay: {
    pollIntervalMs: parseInt(
      process.env.OUTBOX_RELAY_POLL_INTERVAL_MS ?? "1000",
      10,
    ),
    batchSize: parseInt(process.env.OUTBOX_RELAY_BATCH_SIZE ?? "100", 10),
    maxAttempts: parseInt(process.env.OUTBOX_RELAY_MAX_ATTEMPTS ?? "5", 10),
    backoffBaseMs: parseInt(
      process.env.OUTBOX_RELAY_BACKOFF_BASE_MS ?? "1000",
      10,
    ),
    backoffMaxMs: parseInt(
      process.env.OUTBOX_RELAY_BACKOFF_MAX_MS ?? "60000",
      10,
    ),
  },
};

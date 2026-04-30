import { KafkaConfig } from "../../../../config";

export interface EmailKafkaConfig {
  brokers: string[];
  groupId: string;
  topic: string;
  sessionTimeoutMs: number;
  rebalanceTimeoutMs: number;
}

export interface EmailConsumerRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface EmailConfig {
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  kafka: EmailKafkaConfig;
  retry: EmailConsumerRetryConfig;
}

export function getEmailConfig(): EmailConfig {
  const brokers = parseKafkaBrokers();

  return {
    sendgrid: {
      apiKey: getRequiredEnv("SENDGRID_API_KEY"),
      fromEmail: getRequiredEnv("EMAIL_FROM_ADDRESS"),
      fromName: getRequiredEnv("EMAIL_FROM_NAME", "Acme Corp"),
    },
    kafka: {
      brokers,
      groupId: process.env.EMAIL_CONSUMER_GROUP_ID ?? "email-service",
      topic: process.env.EMAIL_TOPIC ?? "com.test.identity.UserRegistered",
      sessionTimeoutMs: parseInt(process.env.EMAIL_SESSION_TIMEOUT_MS ?? "30000", 10),
      rebalanceTimeoutMs: parseInt(process.env.EMAIL_REBALANCE_TIMEOUT_MS ?? "60000", 10),
    },
    retry: {
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES ?? "5", 10),
      initialDelayMs: parseInt(process.env.EMAIL_RETRY_INITIAL_DELAY_MS ?? "1000", 10),
      maxDelayMs: parseInt(process.env.EMAIL_RETRY_MAX_DELAY_MS ?? "60000", 10),
    },
  };
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

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

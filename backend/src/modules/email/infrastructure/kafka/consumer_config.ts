import { Kafka, Consumer } from "kafkajs";
import { UserRegisteredConsumer } from "./user_registered_consumer";
import { ISendWelcomeEmailUseCase } from "../../application/send_welcome_email/port";
import pino, { Logger } from "pino";
import { KafkaSslConfig, getKafkaSslConfig } from "../../../../config";

export interface KafkaProducerConfig {
  brokers: string[];
  clientId: string;
  ssl?: boolean | KafkaSslConfig;
}

export interface EmailKafkaConfig {
  brokers: string[];
  groupId: string;
  topic: string;
  dlqTopic?: string;
  sessionTimeoutMs: number;
  rebalanceTimeoutMs: number;
  ssl?: boolean | KafkaSslConfig;
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
      dlqTopic: process.env.EMAIL_DLQ_TOPIC ?? "com.test.identity.UserRegistered.DLQ",
      sessionTimeoutMs: parseInt(process.env.EMAIL_SESSION_TIMEOUT_MS ?? "30000", 10),
      rebalanceTimeoutMs: parseInt(process.env.EMAIL_REBALANCE_TIMEOUT_MS ?? "60000", 10),
      ssl: getKafkaSslConfig(),
    },
    retry: {
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES ?? "5", 10),
      initialDelayMs: parseInt(process.env.EMAIL_RETRY_INITIAL_DELAY_MS ?? "1000", 10),
      maxDelayMs: parseInt(process.env.EMAIL_RETRY_MAX_DELAY_MS ?? "60000", 10),
    },
  };
}

export function createUserRegisteredConsumer(
  config: EmailConfig,
  sendWelcomeEmail: ISendWelcomeEmailUseCase,
  logger?: Logger
): UserRegisteredConsumer {
  const kafka = new Kafka({
    brokers: config.kafka.brokers,
    clientId: config.kafka.groupId,
    ssl: config.kafka.ssl ?? false,
  });

  const consumer = kafka.consumer({
    groupId: config.kafka.groupId,
    sessionTimeout: config.kafka.sessionTimeoutMs,
    rebalanceTimeout: config.kafka.rebalanceTimeoutMs,
  });

  return new UserRegisteredConsumer(
    {
      kafkaConsumer: consumer,
      topic: config.kafka.topic,
      dlqTopic: config.kafka.dlqTopic,
      maxRetries: config.retry.maxRetries,
      initialDelayMs: config.retry.initialDelayMs,
      maxDelayMs: config.retry.maxDelayMs,
    },
    sendWelcomeEmail,
    logger
  );
}

export function getKafkaProducerConfig(config: EmailConfig): KafkaProducerConfig {
  return {
    brokers: config.kafka.brokers,
    clientId: `${config.kafka.groupId}-dlq-producer`,
    ssl: config.kafka.ssl,
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

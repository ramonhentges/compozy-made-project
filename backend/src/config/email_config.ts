import { getRequiredEnv, getKafkaSslConfig } from '../config/index';
import { EmailKafkaConfig, EmailConsumerRetryConfig } from '../modules/email/infrastructure/kafka/consumer_config';

function parseKafkaBrokers(): string[] {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    return ['localhost:9092'];
  }
  return brokers
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
}

export function getEmailConfig() {
  return {
    sendgrid: {
      apiKey: getRequiredEnv('SENDGRID_API_KEY'),
      fromEmail: getRequiredEnv('EMAIL_FROM_ADDRESS', 'noreply@acme-corp.com'),
      fromName: getRequiredEnv('EMAIL_FROM_NAME', 'Acme Corp'),
    },
    kafka: {
      brokers: parseKafkaBrokers(),
      groupId: process.env.EMAIL_CONSUMER_GROUP_ID || 'email-service',
      topic: process.env.EMAIL_TOPIC || 'com.test.identity.UserRegistered',
      dlqTopic: process.env.EMAIL_DLQ_TOPIC || 'com.test.identity.UserRegistered.DLQ',
      sessionTimeoutMs: parseInt(process.env.EMAIL_SESSION_TIMEOUT_MS || '30000', 10),
      rebalanceTimeoutMs: parseInt(process.env.EMAIL_REBALANCE_TIMEOUT_MS || '60000', 10),
      ssl: getKafkaSslConfig(),
    } as EmailKafkaConfig,
    retry: {
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '5', 10),
      initialDelayMs: parseInt(process.env.EMAIL_RETRY_INITIAL_MS || '1000', 10),
      maxDelayMs: parseInt(process.env.EMAIL_RETRY_MAX_DELAY_MS || '60000', 10),
    } as EmailConsumerRetryConfig,
  };
}

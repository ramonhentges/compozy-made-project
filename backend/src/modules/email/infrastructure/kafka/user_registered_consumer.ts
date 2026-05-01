import { Consumer, KafkaMessage, Producer, Kafka } from 'kafkajs';
import { ISendWelcomeEmailUseCase } from '../../application/send_welcome_email/port';
import { SendWelcomeEmailCommand } from '../../application/send_welcome_email/command';
import pino, { Logger } from 'pino';
import { EmailAddress } from '../../domain/value_objects/email_address';
import { UserRegisteredEvent } from '@modules/identity/domain/events/user_registered';

export interface KafkaConsumerConfig {
  kafkaConsumer: Consumer;
  topic: string;
  dlqTopic?: string;
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface KafkaProducerConfig {
  brokers: string[];
  clientId: string;
  ssl?: boolean | import("../../../../config").KafkaSslConfig;
}

export class UserRegisteredConsumer {
  private readonly consumer: Consumer;
  private readonly topic: string;
  private readonly dlqTopic: string | undefined;
  private readonly sendWelcomeEmail: ISendWelcomeEmailUseCase;
  private readonly maxRetries: number;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly logger: Logger;
  private running = false;
  private dlqProducer: Producer | undefined;

  constructor(
    config: KafkaConsumerConfig,
    sendWelcomeEmail: ISendWelcomeEmailUseCase,
    logger?: Logger
  ) {
    this.consumer = config.kafkaConsumer;
    this.topic = config.topic;
    this.dlqTopic = config.dlqTopic;
    this.sendWelcomeEmail = sendWelcomeEmail;
    this.maxRetries = config.maxRetries;
    this.initialDelayMs = config.initialDelayMs;
    this.maxDelayMs = config.maxDelayMs;
    this.logger = logger || pino();
  }

  async start(kafkaConfig?: KafkaProducerConfig): Promise<void> {
    if (this.running) {
      return;
    }

    await this.consumer.connect();

    // Initialize DLQ producer if DLQ topic is configured
    if (this.dlqTopic && kafkaConfig) {
      const kafka = new Kafka({
        brokers: kafkaConfig.brokers,
        clientId: kafkaConfig.clientId,
        ssl: kafkaConfig.ssl ?? false,
      });
      this.dlqProducer = kafka.producer();
      await this.dlqProducer.connect();
      this.logger.info({ dlqTopic: this.dlqTopic }, 'email.consumer.dlq_initialized');
    }

    await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });

    this.running = true;
    this.logger.info({ topic: this.topic }, 'email.consumer.started');

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        await this.handleMessage(message);
      },
    });
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.logger.info({}, 'email.consumer.stopped');
    await this.consumer.disconnect();

    if (this.dlqProducer) {
      await this.dlqProducer.disconnect();
      this.logger.info({}, 'email.consumer.dlq_producer_stopped');
    }
  }

  private async handleMessage(message: KafkaMessage): Promise<void> {
    const messageId = message.key?.toString() || 'unknown';

    try {
      if (!message.value) {
        this.logger.warn({ messageId }, 'email.consumer.empty_message');
        return;
      }

      const payload: UserRegisteredEvent = JSON.parse(message.value.toString());

      // Validate email using EmailAddress value object
      try {
        EmailAddress.create(payload.data.email);
      } catch (validationError) {
        this.logger.warn({ messageId, email: this.redactEmail(payload.data.email) }, 'email.consumer.invalid_email');
        return;
      }

      this.logger.info({ messageId, email: this.redactEmail(payload.data.email) }, 'email.consumer.message_received');

      await this.processWithRetry(payload.data);
    } catch (error) {
      this.logger.error({ messageId, error: this.redactError(error) }, 'email.consumer.message_error');
    }
  }

  private async processWithRetry(payload: { email: string; name?: string }, attempt = 1, delayFn?: (ms: number) => Promise<void>): Promise<void> {
    try {
      const command: SendWelcomeEmailCommand = {
        email: payload.email,
        name: payload.name,
      };

      await this.sendWelcomeEmail.execute(command);
      this.logger.info({ email: this.redactEmail(payload.email) }, 'email.consumer.processed');
    } catch (error) {
      if (attempt >= this.maxRetries) {
        this.logger.error(
          { email: this.redactEmail(payload.email), attempts: attempt, error: this.redactError(error) },
          'email.consumer.failed'
        );

        // Send to DLQ if configured
        if (this.dlqTopic && this.dlqProducer) {
          try {
            const redactedPayload = { ...payload, email: this.redactEmail(payload.email) };
            await this.dlqProducer.send({
              topic: this.dlqTopic,
              messages: [{
                key: this.redactEmail(payload.email),
                value: JSON.stringify({
                  originalTopic: this.topic,
                  payload: redactedPayload,
                  error: this.redactError(error),
                  failedAt: new Date().toISOString(),
                  attempts: attempt,
                }),
              }],
            });
            this.logger.info({ email: this.redactEmail(payload.email), dlqTopic: this.dlqTopic }, 'email.consumer.sent_to_dlq');
          } catch (dlqError) {
            this.logger.error({ error: this.redactError(dlqError) }, 'email.consumer.dlq_failed');
          }
        }

        return;
      }

      const delayMs = Math.min(this.initialDelayMs * Math.pow(2, attempt - 1), this.maxDelayMs);
      this.logger.info(
        { email: this.redactEmail(payload.email), attempt, nextDelayMs: delayMs },
        'email.consumer.retry'
      );

      const delay = delayFn || (ms => new Promise(resolve => setTimeout(resolve, ms)));
      await delay(delayMs);
      return this.processWithRetry(payload, attempt + 1, delayFn);
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private redactEmail(email: string): string {
    if (!email) return '[unknown]';
    const parts = email.split('@');
    if (parts.length !== 2) return '[invalid]';
    const [local, domain] = parts;
    const redactedLocal = local.length > 2 ? local.substring(0, 2) + '***' : '***';
    return `${redactedLocal}@${domain}`;
  }

  private redactError(error: unknown): string {
    const errorStr = String(error);
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /credential/i,
      /api[_-]?key/i,
      /sendgrid/i,
    ];
    let redacted = errorStr;
    for (const pattern of sensitivePatterns) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted.substring(0, 500);
  }
}

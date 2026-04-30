import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { ISendWelcomeEmailUseCase } from '../../application/send_welcome_email/port';
import { SendWelcomeEmailCommand } from '../../application/send_welcome_email/command';
import pino, { Logger } from 'pino';

export interface KafkaConsumerConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
  topic: string;
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export class UserRegisteredConsumer {
  private readonly consumer: Consumer;
  private readonly topic: string;
  private readonly sendWelcomeEmail: ISendWelcomeEmailUseCase;
  private readonly maxRetries: number;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly logger: Logger;
  private running = false;

  constructor(config: KafkaConsumerConfig, sendWelcomeEmail: ISendWelcomeEmailUseCase, logger?: Logger) {
    const kafka = new Kafka({
      brokers: config.brokers,
      clientId: config.clientId,
    });
    this.consumer = kafka.consumer({ groupId: config.groupId });
    this.topic = config.topic;
    this.sendWelcomeEmail = sendWelcomeEmail;
    this.maxRetries = config.maxRetries;
    this.initialDelayMs = config.initialDelayMs;
    this.maxDelayMs = config.maxDelayMs;
    this.logger = logger || pino();
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    await this.consumer.connect();
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
  }

  private async handleMessage(message: KafkaMessage): Promise<void> {
    const messageId = message.key?.toString() || 'unknown';

    try {
      if (!message.value) {
        this.logger.warn({ messageId }, 'email.consumer.empty_message');
        return;
      }

      const payload = JSON.parse(message.value.toString());
      this.logger.info({ messageId, email: payload.email }, 'email.consumer.message_received');

      await this.processWithRetry(payload);
    } catch (error) {
      this.logger.error({ messageId, error: String(error).substring(0, 500) }, 'email.consumer.message_error');
    }
  }

  private async processWithRetry(payload: { email: string; name?: string }, attempt = 1): Promise<void> {
    try {
      const command: SendWelcomeEmailCommand = {
        email: payload.email,
        name: payload.name,
      };

      await this.sendWelcomeEmail.execute(command);
      this.logger.info({ email: payload.email }, 'email.consumer.processed');
    } catch (error) {
      if (attempt >= this.maxRetries) {
        this.logger.error(
          { email: payload.email, attempts: attempt, error: String(error).substring(0, 500) },
          'email.consumer.failed'
        );
        return;
      }

      const delayMs = Math.min(this.initialDelayMs * Math.pow(2, attempt - 1), this.maxDelayMs);
      this.logger.info(
        { email: payload.email, attempt, nextDelayMs: delayMs },
        'email.consumer.retry'
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.processWithRetry(payload, attempt + 1);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}

import { OutboxRepository } from '../persistence/repositories/outbox_repository';
import { OutboxPublisher } from '../adapters/outbox_publisher';
import { OutboxRecord } from '../persistence/types/outbox_record';
import { OutboxRelayConfig } from '../../../../config';
import pino, { Logger } from 'pino';

export interface OutboxRelay {
  start(): void;
  stop(): Promise<void>;
}

export class InProcessOutboxRelay implements OutboxRelay {
  private readonly repository: OutboxRepository;
  private readonly publisher: OutboxPublisher;
  private readonly config: OutboxRelayConfig;
  private readonly logger: Logger;
  private running = false;
  private stopped = false;
  private currentPoll: Promise<void> | null = null;

  constructor(
    repository: OutboxRepository,
    publisher: OutboxPublisher,
    config: OutboxRelayConfig,
    logger: Logger = pino()
  ) {
    this.repository = repository;
    this.publisher = publisher;
    this.config = config;
    this.logger = logger;
  }

  start(): void {
    if (this.running || this.stopped) {
      return;
    }
    this.running = true;
    this.logger.info({ pollIntervalMs: this.config.pollIntervalMs, batchSize: this.config.batchSize }, 'outbox.relay.started');
    this.poll();
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.logger.info({}, 'outbox.relay.stopped');
    if (this.currentPoll) {
      await this.currentPoll;
    }
    await this.publisher.disconnect();
    this.stopped = true;
  }

  private async poll(): Promise<void> {
    if (!this.running) {
      return;
    }

    const now = new Date();
    try {
      const records = await this.repository.claimDue(
        this.config.batchSize,
        now
      );

      for (const record of records) {
        if (!this.running) {
          break;
        }

        await this.processRecord(record);
      }
    } catch (error) {
      const errorCode = this.categorizeError(error);
      this.logger.error({ errorCode, error: String(error).substring(0, 1000) }, 'outbox.poll.error');
    }

    if (this.running) {
      this.currentPoll = this.sleep(this.config.pollIntervalMs);
      await this.currentPoll;
      this.currentPoll = null;
      this.poll();
    }
  }

  private async processRecord(record: OutboxRecord): Promise<void> {
    try {
      await this.publisher.publish(record);
      await this.repository.markPublished(record.id, new Date());
      this.logger.info({
        eventId: record.id,
        eventName: record.eventName,
        eventVersion: record.eventVersion,
        aggregateType: record.aggregateType,
        aggregateId: record.aggregateId,
      }, 'outbox.event.published');
    } catch (error) {
      const attempts = record.attempts + 1;
      const isTerminal = attempts >= this.config.maxAttempts;

      if (isTerminal) {
        const lastError = String(error).substring(0, 1000);
        await this.repository.markFailed(record.id, attempts, lastError);
        this.logger.error({
          eventId: record.id,
          eventName: record.eventName,
          attempts,
          error: lastError,
        }, 'outbox.event.failed');
      } else {
        const nextAttemptAt = this.calculateBackoff(attempts, record.nextAttemptAt);
        const redactedError = this.redactError(error);
        await this.repository.markRetry(
          record.id,
          attempts,
          nextAttemptAt,
          redactedError
        );
        this.logger.info({
          eventId: record.id,
          eventName: record.eventName,
          attempts,
          nextAttemptAt: nextAttemptAt.toISOString(),
        }, 'outbox.event.retry_scheduled');
      }
    }
  }

  private calculateBackoff(attempts: number, currentNextAttemptAt: Date): Date {
    const baseMs = this.config.backoffBaseMs;
    const maxMs = this.config.backoffMaxMs;
    const delayMs = Math.min(baseMs * Math.pow(2, attempts - 1), maxMs);
    const anchorTime = new Date();
    if (currentNextAttemptAt > anchorTime) {
      anchorTime.setTime(currentNextAttemptAt.getTime());
    }
    return new Date(anchorTime.getTime() + delayMs);
  }

  private categorizeError(error: unknown): string {
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes('connection') || errorStr.includes('econnrefused') || errorStr.includes('etimedout')) {
      return 'CONNECTION_ERROR';
    }
    if (errorStr.includes('timeout')) {
      return 'TIMEOUT';
    }
    if (errorStr.includes('permission') || errorStr.includes('access denied')) {
      return 'PERMISSION_ERROR';
    }
    if (errorStr.includes('unique constraint') || errorStr.includes('duplicate')) {
      return 'CONSTRAINT_VIOLATION';
    }
    return 'UNKNOWN';
  }

  private redactError(error: unknown): string {
    const errorStr = String(error);
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /credential/i,
      /api[_-]?key/i,
    ];
    let redacted = errorStr;
    for (const pattern of sensitivePatterns) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted.substring(0, 1000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createOutboxRelay(
  repository: OutboxRepository,
  publisher: OutboxPublisher,
  config: OutboxRelayConfig,
  logger: Logger = pino()
): OutboxRelay {
  return new InProcessOutboxRelay(repository, publisher, config, logger);
}
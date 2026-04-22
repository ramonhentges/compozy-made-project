import { IDatabase } from 'pg-promise';
import { OutboxRecord, OutboxStatus } from '../types/outbox_record';
import { OutboxRecordMapper, OutboxRecordDTO } from '../mappers/outbox_record_mapper';

const OUTBOX_SELECT_COLUMNS = `
  id, event_name, event_version, aggregate_type, aggregate_id,
  payload, status, attempts, next_attempt_at, last_error,
  occurred_on, created_at, processing_started_at, published_at`;

export interface OutboxRepository {
  claimDue(limit: number, now: Date): Promise<OutboxRecord[]>;
  markProcessing(id: string, processingStartedAt: Date): Promise<void>;
  markPublished(id: string, publishedAt: Date): Promise<void>;
  markRetry(
    id: string,
    attempts: number,
    nextAttemptAt: Date,
    lastError: string
  ): Promise<void>;
  markFailed(id: string, attempts: number, lastError: string): Promise<void>;
  findById(id: string): Promise<OutboxRecord | null>;
}

export class PgOutboxRepository implements OutboxRepository {
  private readonly db: IDatabase<object>;

  constructor(db: IDatabase<object>) {
    this.db = db;
  }

  async claimDue(limit: number, now: Date): Promise<OutboxRecord[]> {
    const rows = await this.db.many<OutboxRecordDTO>(
      `SELECT ${OUTBOX_SELECT_COLUMNS}
       FROM events
       WHERE status = 'pending'
         AND next_attempt_at <= $1
       ORDER BY next_attempt_at ASC
       LIMIT $2
       FOR UPDATE SKIP LOCKED`,
      [now, limit]
    );

    if (rows.length === 0) {
      return [];
    }

    const processingStartedAt = new Date();
    const ids = rows.map((row) => row.id);

    await this.db.none(
      `UPDATE events
       SET status = 'processing', processing_started_at = $2
       WHERE id IN ($1:csv)`,
      [ids, processingStartedAt]
    );

    return rows.map(OutboxRecordMapper.fromRow);
  }

  async markProcessing(id: string, processingStartedAt: Date): Promise<void> {
    await this.db.none(
      `UPDATE events
       SET status = 'processing', processing_started_at = $2
       WHERE id = $1`,
      [id, processingStartedAt]
    );
  }

  async markPublished(id: string, publishedAt: Date): Promise<void> {
    await this.db.none(
      `UPDATE events
       SET status = 'published', published_at = $2
       WHERE id = $1`,
      [id, publishedAt]
    );
  }

  async markRetry(
    id: string,
    attempts: number,
    nextAttemptAt: Date,
    lastError: string
  ): Promise<void> {
    await this.db.none(
      `UPDATE events
       SET status = 'pending',
           attempts = $2,
           next_attempt_at = $3,
           last_error = $4,
           processing_started_at = null
       WHERE id = $1`,
      [id, attempts, nextAttemptAt, lastError]
    );
  }

  async markFailed(
    id: string,
    attempts: number,
    lastError: string
  ): Promise<void> {
    await this.db.none(
      `UPDATE events
       SET status = 'failed',
           attempts = $2,
           last_error = $3,
           processing_started_at = null
       WHERE id = $1`,
      [id, attempts, lastError]
    );
  }

  async findById(id: string): Promise<OutboxRecord | null> {
    const row = await this.db.oneOrNone<OutboxRecordDTO>(
      `SELECT ${OUTBOX_SELECT_COLUMNS}
       FROM events
       WHERE id = $1`,
      [id]
    );
    return row ? OutboxRecordMapper.fromRow(row) : null;
  }
}
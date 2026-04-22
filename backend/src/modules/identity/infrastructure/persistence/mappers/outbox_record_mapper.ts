import { OutboxRecord, OutboxStatus } from '../types/outbox_record';

export interface OutboxRecordDTO {
  id: string;
  event_name: string;
  event_version: number;
  aggregate_type: string;
  aggregate_id: string;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  next_attempt_at: Date;
  last_error: string | null;
  occurred_on: Date;
  created_at: Date;
  processing_started_at: Date | null;
  published_at: Date | null;
}

export class OutboxRecordMapper {
  static fromRow(row: OutboxRecordDTO): OutboxRecord {
    return {
      id: row.id,
      eventName: row.event_name,
      eventVersion: row.event_version,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      status: row.status,
      attempts: row.attempts,
      nextAttemptAt: row.next_attempt_at,
      lastError: row.last_error,
      occurredOn: row.occurred_on,
      createdAt: row.created_at,
      processingStartedAt: row.processing_started_at,
      publishedAt: row.published_at,
    };
  }
}
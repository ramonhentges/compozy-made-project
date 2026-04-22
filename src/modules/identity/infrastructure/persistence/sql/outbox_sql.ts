import { OutboxInsertData } from '../types/outbox_record';

export const OUTBOX_INSERT_COLUMNS = [
  'id',
  'event_name',
  'event_version',
  'aggregate_type',
  'aggregate_id',
  'payload',
  'status',
  'attempts',
  'next_attempt_at',
  'last_error',
  'occurred_on',
  'created_at',
  'processing_started_at',
  'published_at',
] as const;

export const INSERT_OUTBOX_EVENT_SQL = `
INSERT INTO events (
  id,
  event_name,
  event_version,
  aggregate_type,
  aggregate_id,
  payload,
  status,
  attempts,
  next_attempt_at,
  last_error,
  occurred_on,
  created_at,
  processing_started_at,
  published_at
) VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6::jsonb,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12,
  $13,
  $14
)`;

export type OutboxInsertParams = [
  string,
  string,
  number,
  string,
  string,
  string,
  'pending',
  0,
  Date,
  null,
  Date,
  Date,
  null,
  null,
];

export function toOutboxInsertParams(record: OutboxInsertData): OutboxInsertParams {
  return [
    record.id,
    record.eventName,
    record.eventVersion,
    record.aggregateType,
    record.aggregateId,
    JSON.stringify(record.payload),
    record.status,
    record.attempts,
    record.nextAttemptAt,
    record.lastError,
    record.occurredOn,
    record.createdAt,
    record.processingStartedAt,
    record.publishedAt,
  ];
}

export const BATCH_INSERT_OUTBOX_EVENT_SQL = `
INSERT INTO events (
  id,
  event_name,
  event_version,
  aggregate_type,
  aggregate_id,
  payload,
  status,
  attempts,
  next_attempt_at,
  last_error,
  occurred_on,
  created_at,
  processing_started_at,
  published_at
) VALUES `;

export function toBatchOutboxInsertParams(
  records: OutboxInsertData[]
): unknown[] {
  const params: unknown[] = [];
  for (const record of records) {
    params.push(
      record.id,
      record.eventName,
      record.eventVersion,
      record.aggregateType,
      record.aggregateId,
      JSON.stringify(record.payload),
      record.status,
      record.attempts,
      record.nextAttemptAt,
      record.lastError,
      record.occurredOn,
      record.createdAt,
      record.processingStartedAt,
      record.publishedAt
    );
  }
  return params;
}

export function buildBatchInsertSQL(records: OutboxInsertData[]): string {
  const valuesClauses: string[] = [];
  let paramIndex = 1;
  for (const _ of records) {
    const cols = Array.from({ length: 14 }, () => `$${paramIndex++}`).join(', ');
    valuesClauses.push(`(${cols})`);
  }
  return BATCH_INSERT_OUTBOX_EVENT_SQL + valuesClauses.join(', ');
}


export type OutboxStatus = 'pending' | 'processing' | 'published' | 'failed';

export interface OutboxRecord {
  id: string;
  eventName: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  occurredOn: Date;
  createdAt: Date;
  processingStartedAt: Date | null;
  publishedAt: Date | null;
}

export interface OutboxInsertData extends OutboxRecord {
  status: 'pending';
  attempts: 0;
  lastError: null;
  processingStartedAt: null;
  publishedAt: null;
}


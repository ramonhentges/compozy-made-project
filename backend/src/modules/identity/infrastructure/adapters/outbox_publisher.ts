import { OutboxRecord } from '../persistence/types/outbox_record';

export interface OutboxPublisher {
  publish(record: OutboxRecord): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

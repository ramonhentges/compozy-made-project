import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KafkaOutboxPublisher } from './kafka_outbox_publisher';
import { OutboxRecord } from '../persistence/types/outbox_record';

const mockProducer = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
};

vi.mock('kafkajs', () => ({
  Kafka: vi.fn().mockImplementation(() => ({
    producer: () => mockProducer,
  })),
}));

describe('KafkaOutboxPublisher', () => {
  let publisher: KafkaOutboxPublisher;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProducer.connect.mockResolvedValue(undefined);
    mockProducer.disconnect.mockResolvedValue(undefined);
    mockProducer.send.mockResolvedValue(undefined);

    publisher = new KafkaOutboxPublisher({
      brokers: ['localhost:9092'],
      clientId: 'test-client',
      topic: 'identity-outbox',
    });
  });

  describe('fromAppConfig', () => {
    it('should create publisher from app config', () => {
      const kafkaConfig = {
        brokers: ['broker1:9092', 'broker2:9092'],
        clientId: 'identity-service',
        identityOutboxTopic: 'identity-outbox',
      };

      const configPublisher = KafkaOutboxPublisher.fromAppConfig(kafkaConfig);

      expect(configPublisher).toBeInstanceOf(KafkaOutboxPublisher);
    });
  });

  describe('connect', () => {
    it('should connect the producer', async () => {
      await publisher.connect();

      expect(mockProducer.connect).toHaveBeenCalled();
    });

    it('should not reconnect if already connected', async () => {
      await publisher.connect();
      await publisher.connect();

      expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect the producer', async () => {
      await publisher.connect();
      await publisher.disconnect();

      expect(mockProducer.disconnect).toHaveBeenCalled();
    });

    it('should not fail if not connected', async () => {
      await publisher.disconnect();

      expect(mockProducer.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    const createOutboxRecord = (overrides?: Partial<OutboxRecord>): OutboxRecord => ({
      id: 'evt-1234-5678',
      eventName: 'UserRegistered',
      eventVersion: 1,
      aggregateType: 'User',
      aggregateId: 'usr-abc-123',
      payload: { email: 'test@example.com' },
      status: 'pending',
      attempts: 0,
      nextAttemptAt: new Date(),
      lastError: null,
      occurredOn: new Date('2024-01-15T10:00:00Z'),
      createdAt: new Date('2024-01-15T10:00:00Z'),
      processingStartedAt: null,
      publishedAt: null,
      ...overrides,
    });

    it('should publish a record to the configured topic', async () => {
      const record = createOutboxRecord();

      await publisher.publish(record);

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'identity-outbox',
        })
      );
    });

    it('should use aggregateId as the message key', async () => {
      const record = createOutboxRecord({ aggregateId: 'usr-custom-789' });

      await publisher.publish(record);

      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ key: 'usr-custom-789' }),
          ]),
        })
      );
    });

    it('should include all required envelope fields', async () => {
      const record = createOutboxRecord();

      await publisher.publish(record);

      const sentRecord = mockProducer.send.mock.calls[0][0] as { messages: Array<{ value: string }> };
      const envelope = JSON.parse(sentRecord.messages[0].value);

      expect(envelope).toEqual({
        eventId: 'evt-1234-5678',
        eventName: 'UserRegistered',
        eventVersion: 1,
        aggregateType: 'User',
        aggregateId: 'usr-abc-123',
        occurredOn: '2024-01-15T10:00:00.000Z',
        data: { email: 'test@example.com' },
      });
    });

    it('should propagate publish failures', async () => {
      const record = createOutboxRecord();
      mockProducer.send.mockRejectedValue(new Error('Kafka send failed'));

      await expect(publisher.publish(record)).rejects.toThrow('Kafka send failed');
    });
  });

  describe('isConnected', () => {
    it('should return false before connect', () => {
      expect(publisher.isConnected()).toBe(false);
    });

    it('should return true after connect', async () => {
      await publisher.connect();

      expect(publisher.isConnected()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      await publisher.connect();
      await publisher.disconnect();

      expect(publisher.isConnected()).toBe(false);
    });
  });
});
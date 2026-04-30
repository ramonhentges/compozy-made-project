import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { UserRegisteredConsumer } from './user_registered_consumer';
import { SendWelcomeEmailHandler } from '../../application/send_welcome_email/handler';
import { SendGridAdapter } from '../../infrastructure/adapters/sendgrid_adapter';

const kafkaBrokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const testTopic = process.env.EMAIL_TEST_TOPIC || 'com.test.identity.UserRegistered';
const groupId = process.env.EMAIL_CONSUMER_GROUP_ID || 'test-email-consumer';
const sendGridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@acme-corp.com';
const fromName = process.env.EMAIL_FROM_NAME || 'Acme Corp';

const describeWithKafka = process.env.KAFKA_TEST_ENABLED ? describe : describe.skip;

describeWithKafka('UserRegisteredConsumer integration with Kafka', () => {
  let consumer: UserRegisteredConsumer;
  let mockSendWelcomeEmail: { execute: ReturnType<typeof vi.fn> };
  let producer: any;

  beforeAll(async () => {
    mockSendWelcomeEmail = {
      execute: vi.fn().mockResolvedValue(undefined),
    };

    consumer = new UserRegisteredConsumer(
      {
        brokers: kafkaBrokers,
        clientId: 'test-email-consumer-client',
        groupId: `${groupId}-${Date.now()}`,
        topic: testTopic,
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
      },
      mockSendWelcomeEmail as any
    );

    await consumer.start();
  });

  afterAll(async () => {
    if (consumer) {
      await consumer.stop();
    }
    if (producer) {
      await producer.disconnect();
    }
  });

  it('should consume UserRegisteredEvent and call sendWelcomeEmail', async () => {
    const testEmail = 'kafka-test@example.com';
    const testPayload = { email: testEmail, name: 'Kafka Test User' };

    const { Kafka } = require('kafkajs');
    const kafka = new Kafka({
      brokers: kafkaBrokers,
      clientId: 'test-producer',
    });
    producer = kafka.producer();
    await producer.connect();

    await producer.send({
      topic: testTopic,
      messages: [
        {
          key: 'test-key',
          value: JSON.stringify(testPayload),
        },
      ],
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(mockSendWelcomeEmail.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: testEmail,
        name: 'Kafka Test User',
      })
    );

    await producer.disconnect();
  });
});

describe('UserRegisteredConsumer unit behavior', () => {
  it('should retry on failure and eventually succeed', async () => {
    const mockExecute = vi.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockRejectedValueOnce(new Error('Another failure'))
      .mockResolvedValueOnce(undefined);

    const consumer = new UserRegisteredConsumer(
      {
        brokers: ['localhost:9092'],
        clientId: 'test',
        groupId: 'test',
        topic: 'test',
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
      },
      { execute: mockExecute } as any
    );

    await consumer['processWithRetry']({ email: 'test@example.com' });

    expect(mockExecute).toHaveBeenCalledTimes(3);
  });

  it('should stop retrying after maxRetries', async () => {
    const mockExecute = vi.fn().mockRejectedValue(new Error('Permanent failure'));

    const consumer = new UserRegisteredConsumer(
      {
        brokers: ['localhost:9092'],
        clientId: 'test',
        groupId: 'test',
        topic: 'test',
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 100,
      },
      { execute: mockExecute } as any
    );

    await consumer['processWithRetry']({ email: 'test@example.com' });

    expect(mockExecute).toHaveBeenCalledTimes(2);
  });
});

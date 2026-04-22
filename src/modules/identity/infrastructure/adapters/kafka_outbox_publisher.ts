import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { OutboxRecord } from '../persistence/types/outbox_record';
import { OutboxPublisher } from './outbox_publisher';
import { KafkaConfig } from '../../../../config';

export interface KafkaPublisherConfig {
  brokers: string[];
  clientId: string;
  topic: string;
}

export class KafkaOutboxPublisher implements OutboxPublisher {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly topic: string;
  private connected = false;

  constructor(config: KafkaPublisherConfig) {
    this.kafka = new Kafka({
      brokers: config.brokers,
      clientId: config.clientId,
    });
    this.producer = this.kafka.producer();
    this.topic = config.topic;
  }

  static fromAppConfig(kafkaConfig: KafkaConfig): KafkaOutboxPublisher {
    return new KafkaOutboxPublisher({
      brokers: kafkaConfig.brokers,
      clientId: kafkaConfig.clientId,
      topic: kafkaConfig.identityOutboxTopic,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    await this.producer.connect();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    await this.producer.disconnect();
    this.connected = false;
  }

  async publish(record: OutboxRecord): Promise<void> {
    const envelope = {
      eventId: record.id,
      eventName: record.eventName,
      eventVersion: record.eventVersion,
      aggregateType: record.aggregateType,
      aggregateId: record.aggregateId,
      occurredOn: record.occurredOn.toISOString(),
      data: record.payload,
    };

    const producerRecord: ProducerRecord = {
      topic: this.topic,
      messages: [
        {
          key: record.aggregateId,
          value: JSON.stringify(envelope),
        },
      ],
    };

    await this.producer.send(producerRecord);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

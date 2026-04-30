import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserRegisteredConsumer } from "./user_registered_consumer";
import { ISendWelcomeEmailUseCase } from "../../application/send_welcome_email/port";
import { SendWelcomeEmailCommand } from "../../application/send_welcome_email/command";
import { KafkaMessage } from "kafkajs";

describe("UserRegisteredConsumer", () => {
  let mockSendWelcomeEmail: any;
  let mockConsumer: any;
  let mockKafka: any;
  let logger: any;

  const config = {
    brokers: ["localhost:9092"],
    clientId: "test-client",
    groupId: "test-group",
    topic: "com.test.identity.UserRegistered",
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
  };

  beforeEach(() => {
    mockSendWelcomeEmail = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as any;

    logger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    mockConsumer = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue(undefined),
    };

    mockKafka = {
      consumer: vi.fn().mockReturnValue(mockConsumer),
    };

    // Mock the Kafka import
    vi.mock("kafkajs", () => ({
      Kafka: vi.fn().mockImplementation(() => mockKafka),
    }));
  });

  describe("start", () => {
    it("should connect consumer and subscribe to topic", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      (consumer as any).consumer = mockConsumer;

      await consumer.start();

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: config.topic,
        fromBeginning: true,
      });
      expect(mockConsumer.run).toHaveBeenCalled();
    });

    it("should not start twice", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      (consumer as any).consumer = mockConsumer;
      (consumer as any).running = true;

      await consumer.start();

      expect(mockConsumer.connect).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("should disconnect consumer", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      (consumer as any).consumer = mockConsumer;
      (consumer as any).running = true;

      await consumer.stop();

      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });

    it("should not stop if not running", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      await consumer.stop();

      expect(mockConsumer.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("handleMessage", () => {
    it("should parse message and call handler", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      const message: KafkaMessage = {
        offset: "123",
        value: Buffer.from(JSON.stringify({ email: "test@example.com" })),
        key: Buffer.from("key"),
        headers: {},
        timestamp: "123456789",
        attributes: 0,
        size: 100,
      };

      await (consumer as any).handleMessage(message);

      expect(mockSendWelcomeEmail.execute).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ email: "test@example.com" }),
        "email.consumer.processed"
      );
    });

    it("should handle invalid message payload", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      const message: KafkaMessage = {
        offset: "123",
        value: Buffer.from("invalid json"),
        key: Buffer.from("key"),
        headers: {},
        timestamp: "123456789",
        attributes: 0,
        size: 100,
      };

      await (consumer as any).handleMessage(message);

      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle empty message", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      const message: KafkaMessage = {
        offset: "123",
        value: null,
        key: Buffer.from("key"),
        headers: {},
        timestamp: "123456789",
        attributes: 0,
        size: 100,
      };

      await (consumer as any).handleMessage(message);

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe("retry logic", () => {
    it("should retry on failure and eventually succeed", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      mockSendWelcomeEmail.execute
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce(undefined);

      const payload = { email: "test@example.com" };

      await (consumer as any).processWithRetry(payload, 1);

      expect(mockSendWelcomeEmail.execute).toHaveBeenCalledTimes(3);
    });

    it("should stop retrying after max retries exhausted", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);

      mockSendWelcomeEmail.execute.mockRejectedValue(new Error("Permanent error"));

      const payload = { email: "test@example.com" };

      await (consumer as any).processWithRetry(payload, config.maxRetries);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ email: "test@example.com", attempts: config.maxRetries }),
        "email.consumer.failed"
      );
    });
  });

  describe("isRunning", () => {
    it("should return false initially", () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);
      expect(consumer.isRunning()).toBe(false);
    });

    it("should return true after start", async () => {
      const consumer = new UserRegisteredConsumer(config, mockSendWelcomeEmail, logger);
      (consumer as any).running = true;
      expect(consumer.isRunning()).toBe(true);
    });
  });
});

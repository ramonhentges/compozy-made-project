import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserRegisteredConsumer } from "./user_registered_consumer";
import { KafkaMessage } from "kafkajs";

describe("UserRegisteredConsumer", () => {
  let mockConsumer: any;
  let mockSendWelcomeEmail: any;
  let logger: any;
  let consumer: UserRegisteredConsumer;

  const config = {
    topic: "com.test.identity.UserRegistered",
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
  };

  beforeEach(() => {
    mockConsumer = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockImplementation(async (opts: any) => {
        // Store the eachMessage handler for direct testing
        mockConsumer._eachMessageHandler = opts.eachMessage;
      }),
    };

    mockSendWelcomeEmail = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as any;

    logger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    consumer = new UserRegisteredConsumer(
      { kafkaConsumer: mockConsumer, ...config },
      mockSendWelcomeEmail,
      logger
    );
  });

  describe("start", () => {
    it("should connect consumer and subscribe to topic", async () => {
      await consumer.start();

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: config.topic,
        fromBeginning: true,
      });
      expect(mockConsumer.run).toHaveBeenCalled();
    });

    it("should not start twice", async () => {
      await consumer.start();
      vi.clearAllMocks();

      await consumer.start();

      expect(mockConsumer.connect).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("should disconnect consumer", async () => {
      await consumer.start();
      vi.clearAllMocks();

      await consumer.stop();

      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });

    it("should not stop if not running", async () => {
      await consumer.stop();

      expect(mockConsumer.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("handleMessage via eachMessage", () => {
    async function triggerEachMessage(message: Partial<KafkaMessage>) {
      await consumer.start();
      const handler = (mockConsumer as any)._eachMessageHandler;
      expect(handler).toBeDefined();
      await handler({ message });
    }

    it("should parse message and call handler", async () => {
      const message: Partial<KafkaMessage> = {
        offset: "123",
        value: Buffer.from(JSON.stringify({ email: "test@example.com" })),
        key: Buffer.from("key"),
        headers: {},
        timestamp: "123456789",
        attributes: 0,
      };

      await triggerEachMessage(message);

      expect(mockSendWelcomeEmail.execute).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ email: "te***@example.com" }),
        "email.consumer.processed"
      );
    });

    it("should handle invalid message payload", async () => {
      const message: Partial<KafkaMessage> = {
        offset: "123",
        value: Buffer.from("invalid json"),
        key: Buffer.from("key"),
        headers: {},
        timestamp: "123456789",
        attributes: 0,
      };

      await triggerEachMessage(message);

      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle empty message", async () => {
      const message: Partial<KafkaMessage> = {
        offset: "123",
        value: null,
        key: Buffer.from("key"),
        headers: {},
        timestamp: "123456789",
        attributes: 0,
      };

      await triggerEachMessage(message);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.anything(),
        "email.consumer.empty_message"
      );
    });
  });

  describe("processWithRetry", () => {
    it("should call sendWelcomeEmail and log success", async () => {
      const payload = { email: "test@example.com" };

      await (consumer as any).processWithRetry(payload, 1);

      expect(mockSendWelcomeEmail.execute).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ email: "te***@example.com" }),
        "email.consumer.processed"
      );
    });

    it("should retry on failure and eventually succeed", async () => {
      mockSendWelcomeEmail.execute
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockRejectedValueOnce(new Error("Temporary error"))
        .mockResolvedValueOnce(undefined);

      const payload = { email: "test@example.com" };

      const noopDelay = vi.fn().mockResolvedValue(undefined);

      await (consumer as any).processWithRetry(payload, 1, noopDelay);

      expect(mockSendWelcomeEmail.execute).toHaveBeenCalledTimes(3);
    });

    it("should stop retrying after maxRetries", async () => {
      mockSendWelcomeEmail.execute.mockRejectedValue(new Error("Permanent error"));

      const payload = { email: "test@example.com" };

      const noopDelay = vi.fn().mockResolvedValue(undefined);

      await (consumer as any).processWithRetry(payload, config.maxRetries, noopDelay);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ email: "te***@example.com", attempts: config.maxRetries }),
        "email.consumer.failed"
      );
    });
  });

  describe("DLQ integration", () => {
    it("should send message to DLQ when retries exhausted and DLQ is configured", async () => {
      mockSendWelcomeEmail.execute.mockRejectedValue(new Error("Permanent failure"));

      const mockDlqProducer = {
        connect: vi.fn().mockResolvedValue(undefined),
        send: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
      };

      const consumerWithDlq = new UserRegisteredConsumer(
        {
          kafkaConsumer: mockConsumer,
          topic: "com.test.identity.UserRegistered",
          dlqTopic: "com.test.identity.EmailDeliveryFailed",
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
        },
        mockSendWelcomeEmail,
        logger
      );

      (consumerWithDlq as any).dlqProducer = mockDlqProducer;

      const payload = { email: "dlq-test@example.com" };
      const noopDelay = vi.fn().mockResolvedValue(undefined);

      await (consumerWithDlq as any).processWithRetry(payload, config.maxRetries, noopDelay);

      expect(mockDlqProducer.send).toHaveBeenCalledOnce();
      expect(mockDlqProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "com.test.identity.EmailDeliveryFailed",
          messages: expect.arrayContaining([
            expect.objectContaining({
              key: "dl***@example.com",
              value: expect.any(String),
            }),
          ]),
        })
      );

      const dlqMessage = JSON.parse(mockDlqProducer.send.mock.calls[0][0].messages[0].value);
      expect(dlqMessage).toMatchObject({
        originalTopic: "com.test.identity.UserRegistered",
        payload: { email: "dl***@example.com" },
        error: expect.any(String),
        failedAt: expect.any(String),
        attempts: expect.any(Number),
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "dl***@example.com",
          dlqTopic: "com.test.identity.EmailDeliveryFailed",
        }),
        "email.consumer.sent_to_dlq"
      );
    });

    it("should not send to DLQ when dlqTopic is not configured", async () => {
      mockSendWelcomeEmail.execute.mockRejectedValue(new Error("Permanent failure"));

      const consumerWithoutDlq = new UserRegisteredConsumer(
        {
          kafkaConsumer: mockConsumer,
          topic: "com.test.identity.UserRegistered",
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
        },
        mockSendWelcomeEmail,
        logger
      );

      const payload = { email: "no-dlq@example.com" };
      const noopDelay = vi.fn().mockResolvedValue(undefined);

      await (consumerWithoutDlq as any).processWithRetry(payload, config.maxRetries, noopDelay);

      expect(logger.info).not.toHaveBeenCalledWith(
        expect.anything(),
        "email.consumer.sent_to_dlq"
      );
    });

    it("should log error when DLQ send fails", async () => {
      mockSendWelcomeEmail.execute.mockRejectedValue(new Error("Permanent failure"));

      const mockDlqProducer = {
        connect: vi.fn().mockResolvedValue(undefined),
        send: vi.fn().mockRejectedValue(new Error("DLQ unavailable")),
        disconnect: vi.fn().mockResolvedValue(undefined),
      };

      const consumerWithDlq = new UserRegisteredConsumer(
        {
          kafkaConsumer: mockConsumer,
          topic: "com.test.identity.UserRegistered",
          dlqTopic: "com.test.identity.EmailDeliveryFailed",
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
        },
        mockSendWelcomeEmail,
        logger
      );

      (consumerWithDlq as any).dlqProducer = mockDlqProducer;

      const payload = { email: "dlq-fail@example.com" };
      const noopDelay = vi.fn().mockResolvedValue(undefined);

      await (consumerWithDlq as any).processWithRetry(payload, config.maxRetries, noopDelay);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
        "email.consumer.dlq_failed"
      );
    });
  });

  describe("isRunning", () => {
    it("should return false initially", () => {
      expect(consumer.isRunning()).toBe(false);
    });

    it("should return true after start", async () => {
      await consumer.start();
      expect(consumer.isRunning()).toBe(true);
    });
  });

  describe("email redaction", () => {
    it("should redact email in logs", () => {
      const redacted = (consumer as any).redactEmail("test.user@example.com");
      expect(redacted).toBe("te***@example.com");
    });

    it("should handle invalid email", () => {
      const redacted = (consumer as any).redactEmail("invalid-email");
      expect(redacted).toBe("[invalid]");
    });

    it("should handle empty email", () => {
      const redacted = (consumer as any).redactEmail("");
      expect(redacted).toBe("[unknown]");
    });
  });
});

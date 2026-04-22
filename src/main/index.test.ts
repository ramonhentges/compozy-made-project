import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

vi.stubGlobal('process', {
  ...process,
  exit: vi.fn(),
  on: vi.fn(),
});

vi.mock('@modules/identity/infrastructure/adapters/kafka_outbox_publisher', () => ({
  KafkaOutboxPublisher: Object.assign(
    vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      publish: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
    })),
    {
      fromAppConfig: vi.fn().mockReturnValue({
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        publish: vi.fn().mockResolvedValue(undefined),
        isConnected: vi.fn().mockReturnValue(true),
      }),
    }
  ),
}));

vi.mock('@modules/identity/infrastructure/relay/outbox_relay', () => ({
  createOutboxRelay: vi.fn().mockReturnValue({
    start: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
  }),
  OutboxRelay: vi.fn(),
}));

describe('main', () => {
  describe('exports', () => {
    it('should export startServer and stopServer functions', async () => {
      const { startServer, stopServer } = await import('./index');
      expect(startServer).toBeDefined();
      expect(typeof startServer).toBe('function');
      expect(stopServer).toBeDefined();
      expect(typeof stopServer).toBe('function');
    });
  });

  afterEach(() => {
    vi.resetModules();
  });
});
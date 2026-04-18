import { describe, it, expect } from 'vitest';
import { DomainError } from './index';

class TestDomainError extends DomainError {
  constructor(code: string, message: string, metadata?: Record<string, unknown>) {
    super(code, message, metadata);
  }
}

describe('DomainError', () => {
  it('should have correct name and stack trace', () => {
    const error = new TestDomainError('TEST_ERROR', 'Test message');
    expect(error.name).toBe('TestDomainError');
    expect(error.message).toBe('Test message');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('TestDomainError');
  });

  it('should serialize to JSON correctly', () => {
    const error = new TestDomainError('TEST_ERROR', 'Test message', { key: 'value' });
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'TestDomainError',
      code: 'TEST_ERROR',
      message: 'Test message',
      metadata: { key: 'value' },
    });
  });

  it('should work without metadata', () => {
    const error = new TestDomainError('TEST_ERROR', 'Test message');
    const json = error.toJSON();

    expect(json.metadata).toBeUndefined();
  });
});

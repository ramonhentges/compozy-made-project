import { describe, it, expect } from 'vitest';
import { ApplicationError } from './index';

class TestApplicationError extends ApplicationError {
  constructor(
    code: string,
    statusCode: number,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, statusCode, message, metadata);
  }
}

describe('ApplicationError', () => {
  it('should have correct name and stack trace', () => {
    const error = new TestApplicationError('TEST_ERROR', 400, 'Test message');
    expect(error.name).toBe('TestApplicationError');
    expect(error.message).toBe('Test message');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('TestApplicationError');
  });

  it('should have correct code and status code', () => {
    const error = new TestApplicationError('NOT_FOUND', 404, 'Resource not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('should serialize to JSON correctly', () => {
    const error = new TestApplicationError('TEST_ERROR', 500, 'Test message', { key: 'value' });
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'TestApplicationError',
      code: 'TEST_ERROR',
      statusCode: 500,
      message: 'Test message',
      metadata: { key: 'value' },
    });
  });

  it('should work without metadata', () => {
    const error = new TestApplicationError('TEST_ERROR', 400, 'Test message');
    const json = error.toJSON();

    expect(json.metadata).toBeUndefined();
  });
});

export abstract class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
    };
  }
}

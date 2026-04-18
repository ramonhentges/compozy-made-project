import { generateUuid } from '../../../../shared/utils/uuid_generator';
import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidUserIdError extends DomainError {
  constructor(value: string) {
    super('INVALID_USER_ID', `Invalid UserId format: ${value}`, { value });
  }
}

export class UserId {
  public constructor(private readonly _value: string) {}

  static create(): UserId;
  static create(value: string): UserId;
  static create(value?: string): UserId {
    if (value === undefined) {
      return new UserId(generateUuid());
    }
    if (!UserId.isValid(value)) {
      throw new InvalidUserIdError(value);
    }
    return new UserId(value);
  }

  private static isValid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }
}

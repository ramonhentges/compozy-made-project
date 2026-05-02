import { generateUuid } from '../../../../shared/utils/uuid_generator';
import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidRefreshTokenIdError extends DomainError {
  constructor(value: string) {
    super('INVALID_REFRESH_TOKEN_ID', `Invalid RefreshTokenId format: ${value}`, { value });
  }
}

export class RefreshTokenId {
  public constructor(private readonly _value: string) {}

  static create(): RefreshTokenId;
  static create(value: string): RefreshTokenId;
  static create(value?: string): RefreshTokenId {
    if (value === undefined) {
      return new RefreshTokenId(generateUuid());
    }
    if (!RefreshTokenId.isValid(value)) {
      throw new InvalidRefreshTokenIdError(value);
    }
    return new RefreshTokenId(value);
  }

  private static isValid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  get value(): string {
    return this._value;
  }

  equals(other: RefreshTokenId): boolean {
    return this._value === other._value;
  }
}

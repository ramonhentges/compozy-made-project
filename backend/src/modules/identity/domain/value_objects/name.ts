import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidNameError extends DomainError {
  constructor(value: string) {
    super('INVALID_NAME', `Invalid name: ${value}`, { value });
  }
}

export class Name {
  public constructor(private readonly _value: string) {}

  static create(value: string): Name {
    if (!Name.isValid(value)) {
      throw new InvalidNameError(value);
    }
    return new Name(value);
  }

  private static isValid(name: string): boolean {
    if (!name || name.length < 2) {
      return false;
    }
    if (name.length > 100) {
      return false;
    }
    return true;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Name): boolean {
    return this._value === other._value;
  }
}
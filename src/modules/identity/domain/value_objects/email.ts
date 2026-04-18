import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidEmailError extends DomainError {
  constructor(value: string) {
    super('INVALID_EMAIL', `Invalid email format: ${value}`, { value });
  }
}

export class Email {
  public constructor(private readonly _value: string) {}

  static create(value: string): Email {
    if (!Email.isValid(value)) {
      throw new InvalidEmailError(value);
    }
    return new Email(value);
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])){1,}$/;
    return emailRegex.test(email);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}

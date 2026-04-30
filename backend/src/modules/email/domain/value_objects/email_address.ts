import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidEmailAddressError extends DomainError {
  constructor(value: string) {
    super('INVALID_EMAIL_ADDRESS', `Invalid email address format: ${value}`, { value });
  }
}

export class EmailAddress {
  private constructor(private readonly _value: string) {}

  static create(value: string): EmailAddress {
    if (!EmailAddress.isValid(value)) {
      throw new InvalidEmailAddressError(value);
    }
    return new EmailAddress(value.toLowerCase());
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])){1,}$/;
    return emailRegex.test(email);
  }

  get value(): string {
    return this._value;
  }

  equals(other: EmailAddress): boolean {
    return this._value === other._value;
  }
}

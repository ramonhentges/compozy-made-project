import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidPasswordError extends DomainError {
  constructor() {
    super('INVALID_PASSWORD', 'Password hash cannot be empty', {});
  }
}

export class Password {
  public constructor(private readonly _hash: string) {}

  static create(hash: string): Password {
    if (!hash || hash.length === 0) {
      throw new InvalidPasswordError();
    }
    return new Password(hash);
  }

  get hash(): string {
    return this._hash;
  }

  equals(other: Password): boolean {
    return this._hash === other._hash;
  }
}

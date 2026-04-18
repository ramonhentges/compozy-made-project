import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid email or password');
  }
}

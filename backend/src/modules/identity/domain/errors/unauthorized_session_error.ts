import { DomainError } from '../../../../shared/errors/domain_error';

export class UnauthorizedSessionError extends DomainError {
  constructor() {
    super('UNAUTHORIZED_SESSION', 'Unauthorized to manage this session');
  }
}

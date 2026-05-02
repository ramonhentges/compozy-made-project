import { DomainError } from '../../../../shared/errors/domain_error';

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or has been revoked', {});
  }
}

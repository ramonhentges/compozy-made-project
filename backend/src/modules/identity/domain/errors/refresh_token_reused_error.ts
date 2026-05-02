import { DomainError } from '../../../../shared/errors/domain_error';

export class RefreshTokenReusedError extends DomainError {
  constructor() {
    super('REFRESH_TOKEN_REUSED', 'Refresh token has been reused. All sessions have been terminated for security.', {});
  }
}

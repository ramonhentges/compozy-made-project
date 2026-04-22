import { DomainError } from '../../../../shared/errors/domain_error';

export class UserNotFoundError extends DomainError {
  constructor(userId?: string, email?: string) {
    const identifier = userId || email;
    super('USER_NOT_FOUND', `User not found: ${identifier}`, { userId, email });
  }
}

import { DomainError } from '../../../../shared/errors/domain_error';

export class SessionNotFoundError extends DomainError {
  constructor(sessionId: string) {
    super('SESSION_NOT_FOUND', `Session with id ${sessionId} not found`);
  }
}

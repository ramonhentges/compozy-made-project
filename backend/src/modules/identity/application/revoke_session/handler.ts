import { IRevokeSessionUseCase } from './port';
import { RevokeSessionCommand, RevokeSessionResult } from './command';
import { UserId } from '../../domain/value_objects/user_id';
import { RefreshTokenId } from '../../domain/value_objects/refresh_token_id';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';
import { SessionNotFoundError } from '../../domain/errors/session_not_found_error';
import { UnauthorizedSessionError } from '../../domain/errors/unauthorized_session_error';

export interface RevokeSessionDeps {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
}

export class RevokeSessionHandler implements IRevokeSessionUseCase {
  private readonly userRepository: IUserRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;

  constructor(deps: RevokeSessionDeps) {
    this.userRepository = deps.userRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
  }

  async execute(command: RevokeSessionCommand): Promise<RevokeSessionResult> {
    const userIdVO = UserId.create(command.userId);

    const user = await this.userRepository.findById(userIdVO);
    if (!user) {
      throw new UserNotFoundError(command.userId);
    }

    const sessionIdVO = RefreshTokenId.create(command.sessionId);
    const token = await this.refreshTokenRepository.findById(sessionIdVO);

    if (!token) {
      throw new SessionNotFoundError(command.sessionId);
    }

    if (token.userId.value !== command.userId) {
      throw new UnauthorizedSessionError();
    }

    if (!token.isValid()) {
      throw new SessionNotFoundError(command.sessionId);
    }

    const wasCurrentSession = command.currentTokenHash
      ? token.tokenHash === command.currentTokenHash
      : false;

    token.revoke();
    await this.refreshTokenRepository.update(token);

    return { wasCurrentSession };
  }
}

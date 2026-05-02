import { ILogoutUserUseCase } from './port';
import { LogoutUserCommand } from './command';
import { UserId } from '../../domain/value_objects/user_id';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid_refresh_token_error';
import { UnauthorizedSessionError } from '../../domain/errors/unauthorized_session_error';

export interface LogoutUserDeps {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
}

export class LogoutUserHandler implements ILogoutUserUseCase {
  private readonly userRepository: IUserRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;

  constructor(deps: LogoutUserDeps) {
    this.userRepository = deps.userRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
  }

  async execute(command: LogoutUserCommand): Promise<void> {
    const userIdVO = UserId.create(command.userId);

    const user = await this.userRepository.findById(userIdVO);
    if (!user) {
      throw new UserNotFoundError(command.userId);
    }

    const token = await this.refreshTokenRepository.findByTokenHash(command.tokenHash);
    if (!token) {
      throw new InvalidRefreshTokenError();
    }

    if (token.userId.value !== command.userId) {
      throw new UnauthorizedSessionError();
    }

    token.revoke();
    await this.refreshTokenRepository.update(token);
  }
}

import { LoginUserCommand, LoginUserResult } from './command';
import { ILoginUserUseCase } from './port';
import { Email } from '../../domain/value_objects/email';
import { RefreshTokenId } from '../../domain/value_objects/refresh_token_id';
import { UserId } from '../../domain/value_objects/user_id';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { IPasswordHasher } from '../../domain/services/password_hasher';
import { ITokenService, TokenPayload } from '../../domain/services/token_service';
import { InvalidCredentialsError } from '../../domain/errors/invalid_credentials_error';
import { RefreshToken } from '../../domain/entities/refresh_token';
import { hashRefreshToken } from '../../infrastructure/utils/hash_refresh_token';

export interface LoginUserDeps {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
  maxSessionsPerUser: number;
}

export class LoginUserHandler implements ILoginUserUseCase {
  private readonly userRepository: IUserRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;
  private readonly passwordHasher: IPasswordHasher;
  private readonly tokenService: ITokenService;
  private readonly maxSessionsPerUser: number;

  constructor(deps: LoginUserDeps) {
    this.userRepository = deps.userRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
    this.passwordHasher = deps.passwordHasher;
    this.tokenService = deps.tokenService;
    this.maxSessionsPerUser = deps.maxSessionsPerUser;
  }

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const email = Email.create(command.email);

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.verify(command.password, user.password.hash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const accessPayload: TokenPayload = {
      userId: user.getId(),
      email: user.email.value,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      userId: user.getId(),
      email: user.email.value,
      type: 'refresh',
    };

    const accessToken = this.tokenService.generateAccessToken(accessPayload);
    const refreshToken = this.tokenService.generateRefreshToken(refreshPayload);

    const activeSessionCount = await this.refreshTokenRepository.countActiveByUserId(user.getId());
    if (activeSessionCount >= this.maxSessionsPerUser) {
      await this.refreshTokenRepository.revokeOldestForUser(user.getId(), this.maxSessionsPerUser - 1);
    }

    const refreshTokenEntity = RefreshToken.create(
      RefreshTokenId.create(),
      user.getId(),
      hashRefreshToken(refreshToken),
      this.tokenService.getRefreshTokenExpiry(),
      command.deviceInfo,
    );
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.getId().value,
        email: user.email.value,
        name: user.name.value,
      },
    };
  }
}

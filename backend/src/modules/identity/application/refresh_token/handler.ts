import { RefreshTokenCommand, RefreshTokenResult } from './command';
import { IRefreshTokenUseCase } from './port';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { ITokenService, TokenPayload } from '../../domain/services/token_service';
import { UserId } from '../../domain/value_objects/user_id';
import { RefreshTokenId } from '../../domain/value_objects/refresh_token_id';
import { RefreshToken } from '../../domain/entities/refresh_token';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid_refresh_token_error';
import { RefreshTokenReusedError } from '../../domain/errors/refresh_token_reused_error';
import { hashRefreshToken } from '../../infrastructure/utils/hash_refresh_token';

export interface RefreshTokenDeps {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  tokenService: ITokenService;
}

export class RefreshTokenHandler implements IRefreshTokenUseCase {
  private readonly userRepository: IUserRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;
  private readonly tokenService: ITokenService;

  constructor(deps: RefreshTokenDeps) {
    this.userRepository = deps.userRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
    this.tokenService = deps.tokenService;
  }

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const payload = this.tokenService.verifyRefreshToken(command.refreshToken);

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UserNotFoundError(payload.userId.value);
    }

    const providedHash = hashRefreshToken(command.refreshToken);
    const existingToken = await this.refreshTokenRepository.findByTokenHash(providedHash);
    if (!existingToken) {
      throw new InvalidRefreshTokenError();
    }

    if (existingToken.isRevoked()) {
      existingToken.markAsReused();
      await this.refreshTokenRepository.update(existingToken);
      await this.refreshTokenRepository.revokeAllForUser(existingToken.userId);
      throw new RefreshTokenReusedError();
    }

    if (existingToken.isExpired()) {
      throw new InvalidRefreshTokenError();
    }

    existingToken.revoke();
    await this.refreshTokenRepository.update(existingToken);

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

    const newRefreshTokenEntity = RefreshToken.create(
      RefreshTokenId.create(),
      user.getId(),
      hashRefreshToken(refreshToken),
      this.tokenService.getRefreshTokenExpiry(),
      command.deviceInfo ?? existingToken.deviceInfo ?? undefined,
    );
    await this.refreshTokenRepository.save(newRefreshTokenEntity);

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

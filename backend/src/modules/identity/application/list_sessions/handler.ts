import { IListSessionsUseCase } from './port';
import { ListSessionsQuery, ListSessionsResult, SessionDto } from './query';
import { UserId } from '../../domain/value_objects/user_id';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';

export interface ListSessionsDeps {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
}

export class ListSessionsHandler implements IListSessionsUseCase {
  private readonly userRepository: IUserRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;

  constructor(deps: ListSessionsDeps) {
    this.userRepository = deps.userRepository;
    this.refreshTokenRepository = deps.refreshTokenRepository;
  }

  async execute(query: ListSessionsQuery): Promise<ListSessionsResult> {
    const userIdVO = UserId.create(query.userId);

    const user = await this.userRepository.findById(userIdVO);
    if (!user) {
      throw new UserNotFoundError(query.userId);
    }

    const tokens = await this.refreshTokenRepository.findAllActiveByUserId(userIdVO);

    const sessions: SessionDto[] = tokens.map((token) => ({
      id: token.getId().value,
      deviceInfo: token.deviceInfo,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
      isCurrent: query.currentTokenHash ? token.tokenHash === query.currentTokenHash : false,
    }));

    return { sessions };
  }
}

import { ILogoutUserUseCase } from './port';
import { UserId } from '../../domain/value_objects/user_id';
import { IUserRepository } from '../../domain/repository/user_repository';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';

export interface LogoutUserDeps {
  userRepository: IUserRepository;
}

export class LogoutUserHandler implements ILogoutUserUseCase {
  private readonly userRepository: IUserRepository;

  constructor(deps: LogoutUserDeps) {
    this.userRepository = deps.userRepository;
  }

  async execute(userId: string): Promise<void> {
    const userIdVO = UserId.create(userId);

    const user = await this.userRepository.findById(userIdVO);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
  }
}
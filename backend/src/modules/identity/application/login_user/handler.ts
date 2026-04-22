import { LoginUserCommand, LoginUserResult } from './command';
import { ILoginUserUseCase } from './port';
import { Email } from '../../domain/value_objects/email';
import { UserId } from '../../domain/value_objects/user_id';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IPasswordHasher } from '../../domain/services/password_hasher';
import { ITokenService, TokenPayload } from '../../domain/services/token_service';
import { InvalidCredentialsError } from '../../domain/errors/invalid_credentials_error';

export interface LoginUserDeps {
  userRepository: IUserRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
}

export class LoginUserHandler implements ILoginUserUseCase {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;
  private readonly tokenService: ITokenService;

  constructor(deps: LoginUserDeps) {
    this.userRepository = deps.userRepository;
    this.passwordHasher = deps.passwordHasher;
    this.tokenService = deps.tokenService;
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

    return {
      accessToken,
      refreshToken,
    };
  }
}
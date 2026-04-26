import { RegisterUserCommand, RegisterUserResult } from './command';
import { IRegisterUserUseCase } from './port';
import { Email } from '../../domain/value_objects/email';
import { Name } from '../../domain/value_objects/name';
import { Password } from '../../domain/value_objects/password';
import { UserId } from '../../domain/value_objects/user_id';
import { User } from '../../domain/entities/user';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IPasswordHasher } from '../../domain/services/password_hasher';
import { DomainError } from '../../../../shared/errors/domain_error';

export class DuplicateEmailError extends DomainError {
  constructor(email: string) {
    super('DUPLICATE_EMAIL', `User with email ${email} already exists`, { email });
  }
}

export class InvalidPasswordError extends DomainError {
  constructor() {
    super('INVALID_PASSWORD', 'Password does not meet complexity requirements', {});
  }
}

export interface RegisterUserDeps {
  userRepository: IUserRepository;
  passwordHasher: IPasswordHasher;
}

export class RegisterUserHandler implements IRegisterUserUseCase {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;

  constructor(deps: RegisterUserDeps) {
    this.userRepository = deps.userRepository;
    this.passwordHasher = deps.passwordHasher;
  }

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    if (!Password.validateRaw(command.password)) {
      throw new InvalidPasswordError();
    }

    const email = Email.create(command.email);
    const name = Name.create(command.name);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new DuplicateEmailError(command.email);
    }

    const userId = UserId.create();
    const passwordHash = await this.passwordHasher.hash(command.password);

    const user = User.create(userId, email, name, passwordHash);

    await this.userRepository.save(user);

    return {
      userId: user.getId().value,
      email: user.email.value,
      name: user.name.value,
    };
  }
}
import { RegisterUserCommand, RegisterUserResult } from './command';
import { IRegisterUserUseCase } from './port';
import { Email } from '../../domain/value_objects/email';
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

export class InvalidPasswordError extends Error {
  constructor() {
    super('Password does not meet complexity requirements');
    this.name = 'InvalidPasswordError';
  }
}

export interface RegisterUserDeps {
  userRepository: IUserRepository;
  passwordHasher: IPasswordHasher;
  generateUserId: () => UserId;
}

export class RegisterUserHandler implements IRegisterUserUseCase {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;
  private readonly generateUserId: () => UserId;

  constructor(deps: RegisterUserDeps) {
    this.userRepository = deps.userRepository;
    this.passwordHasher = deps.passwordHasher;
    this.generateUserId = deps.generateUserId;
  }

  private isValidPassword(password: string): boolean {
    if (!password || password.length < 8) {
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      return false;
    }
    if (!/[a-z]/.test(password)) {
      return false;
    }
    if (!/[0-9]/.test(password)) {
      return false;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }
    return true;
  }

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    if (!this.isValidPassword(command.password)) {
      throw new InvalidPasswordError();
    }

    const email = Email.create(command.email);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new DuplicateEmailError(command.email);
    }

    const userId = this.generateUserId();
    const passwordHash = await this.passwordHasher.hash(command.password);

    const user = User.create(userId, email, passwordHash);

    await this.userRepository.save(user);

    return {
      userId: user.getId().value,
      email: user.email.value,
    };
  }
}
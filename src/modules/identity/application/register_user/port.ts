import { RegisterUserCommand, RegisterUserResult } from './command';

export interface IRegisterUserUseCase {
  execute(command: RegisterUserCommand): Promise<RegisterUserResult>;
}
import { LoginUserCommand, LoginUserResult } from './command';

export interface ILoginUserUseCase {
  execute(command: LoginUserCommand): Promise<LoginUserResult>;
}
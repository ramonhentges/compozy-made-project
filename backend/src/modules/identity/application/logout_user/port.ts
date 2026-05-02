import { LogoutUserCommand } from './command';

export interface ILogoutUserUseCase {
  execute(command: LogoutUserCommand): Promise<void>;
}
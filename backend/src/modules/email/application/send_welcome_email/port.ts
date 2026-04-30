import { SendWelcomeEmailCommand } from './command';

export interface ISendWelcomeEmailUseCase {
  execute(command: SendWelcomeEmailCommand): Promise<void>;
}

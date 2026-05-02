import { RevokeSessionCommand, RevokeSessionResult } from './command';

export interface IRevokeSessionUseCase {
  execute(command: RevokeSessionCommand): Promise<RevokeSessionResult>;
}

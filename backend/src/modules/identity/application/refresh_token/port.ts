import { RefreshTokenCommand, RefreshTokenResult } from './command';

export interface IRefreshTokenUseCase {
  execute(command: RefreshTokenCommand): Promise<RefreshTokenResult>;
}

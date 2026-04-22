import { UserId } from '../value_objects/user_id';

export interface TokenPayload {
  userId: UserId;
  email: string;
  type: 'access' | 'refresh';
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}

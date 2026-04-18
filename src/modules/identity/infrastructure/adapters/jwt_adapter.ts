import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../domain/services/token_service';
import { UserId } from '../../domain/value_objects/user_id';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JwtAdapterConfig {
  secret: string;
}

export class InvalidTokenPayloadError extends Error {
  constructor() {
    super('Invalid token payload: missing required fields');
    this.name = 'InvalidTokenPayloadError';
  }
}

export class InvalidTokenTypeError extends Error {
  constructor(expected: string) {
    super(`Invalid token type: expected ${expected} token`);
    this.name = 'InvalidTokenTypeError';
  }
}

export class JwtAdapter implements ITokenService {
  private readonly secret: string;

  constructor(config: JwtAdapterConfig) {
    this.secret = config.secret;
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        userId: payload.userId.value,
        email: payload.email,
        type: payload.type,
      },
      this.secret,
      { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: 'HS256' }
    );
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        userId: payload.userId.value,
        email: payload.email,
        type: payload.type,
      },
      this.secret,
      { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: 'HS256' }
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (!decoded.userId || !decoded.email || !decoded.type) {
      throw new InvalidTokenPayloadError();
    }
    if (decoded.type !== 'access') {
      throw new InvalidTokenTypeError('access');
    }
    return {
      userId: UserId.create(decoded.userId),
      email: decoded.email,
      type: 'access',
    };
  }

  verifyRefreshToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (!decoded.userId || !decoded.email || !decoded.type) {
      throw new InvalidTokenPayloadError();
    }
    if (decoded.type !== 'refresh') {
      throw new InvalidTokenTypeError('refresh');
    }
    return {
      userId: UserId.create(decoded.userId),
      email: decoded.email,
      type: 'refresh',
    };
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { ILogoutUserUseCase } from '../../../application/logout_user/port';
import { InvalidRefreshTokenError } from '../../../domain/errors/invalid_refresh_token_error';
import { CookieConfig, clearRefreshTokenCookie } from '../utils/cookie_config';
import { hashRefreshToken } from '../../../infrastructure/utils/hash_refresh_token';

export class LogoutController {
  constructor(
    private readonly logoutUserUseCase: ILogoutUserUseCase,
    private readonly cookieConfig: CookieConfig,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.userId;

    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const tokenHash = hashRefreshToken(refreshToken);

    try {
      await this.logoutUserUseCase.execute({ userId, tokenHash });
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        // Token already invalid; still clear cookie and succeed
      } else {
        throw error;
      }
    }

    clearRefreshTokenCookie(reply, this.cookieConfig);
    void reply.header('Clear-Site-Data', '"cookies", "storage"');
    return reply.status(200).send({});
  }
}

export const logoutControllerSchema = {
  response: {
    200: {
      type: 'object',
      properties: {},
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

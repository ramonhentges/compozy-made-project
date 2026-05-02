import { FastifyRequest, FastifyReply } from 'fastify';
import { IRevokeSessionUseCase } from '../../../application/revoke_session/port';
import { SessionNotFoundError } from '../../../domain/errors/session_not_found_error';
import { UnauthorizedSessionError } from '../../../domain/errors/unauthorized_session_error';
import { CookieConfig, clearRefreshTokenCookie } from '../utils/cookie_config';
import { hashRefreshToken } from '../../../infrastructure/utils/hash_refresh_token';

export class RevokeSessionController {
  constructor(
    private readonly revokeSessionUseCase: IRevokeSessionUseCase,
    private readonly cookieConfig: CookieConfig,
  ) {}

  async handle(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const userId = request.user?.userId;

    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const sessionId = request.params.id;
    const currentRefreshToken = request.cookies?.refreshToken;
    const currentTokenHash = currentRefreshToken ? hashRefreshToken(currentRefreshToken) : undefined;

    try {
      const result = await this.revokeSessionUseCase.execute({ userId, sessionId, currentTokenHash });

      if (result.wasCurrentSession) {
        clearRefreshTokenCookie(reply, this.cookieConfig);
      }

      return reply.status(200).send({});
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        return reply.status(404).send({ error: 'Session not found' });
      }
      if (error instanceof UnauthorizedSessionError) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
      throw error;
    }
  }
}

export const revokeSessionControllerSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
    required: ['id'],
  },
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
    403: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

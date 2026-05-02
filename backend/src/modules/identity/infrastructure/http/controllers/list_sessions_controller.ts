import { FastifyRequest, FastifyReply } from 'fastify';
import { IListSessionsUseCase } from '../../../application/list_sessions/port';
import { hashRefreshToken } from '../../../infrastructure/utils/hash_refresh_token';

export class ListSessionsController {
  constructor(
    private readonly listSessionsUseCase: IListSessionsUseCase,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.userId;

    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const currentRefreshToken = request.cookies?.refreshToken;
    const currentTokenHash = currentRefreshToken ? hashRefreshToken(currentRefreshToken) : undefined;

    const result = await this.listSessionsUseCase.execute({
      userId,
      currentTokenHash,
    });

    return reply.status(200).send(result);
  }
}

export const listSessionsControllerSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              deviceInfo: { type: ['string', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
              lastUsedAt: { type: ['string', 'null'], format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              isCurrent: { type: 'boolean' },
            },
          },
        },
      },
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

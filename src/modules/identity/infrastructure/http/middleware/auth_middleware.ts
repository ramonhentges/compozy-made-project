import { FastifyRequest, FastifyReply } from 'fastify';
import { ITokenService } from '../../../domain/services/token_service';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export function createAuthMiddleware(tokenService: ITokenService) {
  return async (request: FastifyRequest, reply: FastifyReply, _done: () => void) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);

    try {
      const payload = tokenService.verifyAccessToken(token);
      request.user = {
        userId: payload.userId.value,
        email: payload.email,
      };
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}

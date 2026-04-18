import { FastifyRequest, FastifyReply } from 'fastify';
import { ILogoutUserUseCase } from '../../../application/logout_user/port';

export class LogoutController {
  constructor(private readonly logoutUserUseCase: ILogoutUserUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.userId;

    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    await this.logoutUserUseCase.execute(userId);
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

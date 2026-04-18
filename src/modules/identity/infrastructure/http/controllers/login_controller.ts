import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginUserCommand, LoginUserResult } from '../../../application/login_user/command';
import { ILoginUserUseCase } from '../../../application/login_user/port';
import { InvalidCredentialsError } from '../../../domain/errors/invalid_credentials_error';

export interface LoginBody {
  email: string;
  password: string;
}

export class LoginController {
  constructor(private readonly loginUserUseCase: ILoginUserUseCase) {}

  async handle(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply): Promise<LoginUserResult> {
    const command: LoginUserCommand = {
      email: request.body.email,
      password: request.body.password,
    };

    try {
      const result = await this.loginUserUseCase.execute(command);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
      throw error;
    }
  }
}

export const loginControllerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
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

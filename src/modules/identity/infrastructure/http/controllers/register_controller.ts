import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterUserCommand, RegisterUserResult } from '../../../application/register_user/command';
import { IRegisterUserUseCase } from '../../../application/register_user/port';
import { DuplicateEmailError, InvalidPasswordError } from '../../../application/register_user/handler';

export interface RegisterBody {
  email: string;
  password: string;
}

export class RegisterController {
  constructor(private readonly registerUserUseCase: IRegisterUserUseCase) {}

  async handle(request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply): Promise<RegisterUserResult> {
    const command: RegisterUserCommand = {
      email: request.body.email,
      password: request.body.password,
    };

    try {
      const result = await this.registerUserUseCase.execute(command);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return reply.status(409).send({ error: 'Email already exists' });
      }
      if (error instanceof InvalidPasswordError) {
        return reply.status(400).send({ error: 'Password does not meet complexity requirements' });
      }
      throw error;
    }
  }
}

export const registerControllerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
      },
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    409: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};

import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterUserCommand, RegisterUserResult } from '../../../application/register_user/command';
import { IRegisterUserUseCase } from '../../../application/register_user/port';
import { DuplicateEmailError, InvalidPasswordError } from '../../../application/register_user/handler';

export interface RegisterBody {
  email: string;
  name: string;
  password: string;
}

export class RegisterController {
  constructor(private readonly registerUserUseCase: IRegisterUserUseCase) {}

  async handle(request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply): Promise<RegisterUserResult> {
    const command: RegisterUserCommand = {
      email: request.body.email,
      name: request.body.name,
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
    required: ['email', 'name', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      password: { type: 'string', minLength: 8 },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
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

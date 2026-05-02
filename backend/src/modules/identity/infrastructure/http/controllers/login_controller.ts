import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginUserCommand, LoginUserResult, UserDto } from '../../../application/login_user/command';
import { ILoginUserUseCase } from '../../../application/login_user/port';
import { InvalidCredentialsError } from '../../../domain/errors/invalid_credentials_error';
import { CookieConfig, setRefreshTokenCookie } from '../utils/cookie_config';

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserDto;
}

export class LoginController {
  constructor(
    private readonly loginUserUseCase: ILoginUserUseCase,
    private readonly cookieConfig: CookieConfig,
  ) {}

  async handle(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply): Promise<LoginResponse> {
    const command: LoginUserCommand = {
      email: request.body.email,
      password: request.body.password,
      deviceInfo: request.headers['user-agent'],
    };

    try {
      const result = await this.loginUserUseCase.execute(command);
      setRefreshTokenCookie(reply, result.refreshToken, this.cookieConfig);
      return reply.status(200).send({
        accessToken: result.accessToken,
        user: result.user,
      });
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
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
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

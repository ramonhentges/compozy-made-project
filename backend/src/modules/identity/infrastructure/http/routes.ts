import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify';
import { RegisterController, registerControllerSchema, RegisterBody } from './controllers/register_controller';
import { LoginController, loginControllerSchema, LoginBody } from './controllers/login_controller';
import { LogoutController, logoutControllerSchema } from './controllers/logout_controller';
import { RefreshTokenController, refreshTokenControllerSchema } from './controllers/refresh_token_controller';
import { ListSessionsController, listSessionsControllerSchema } from './controllers/list_sessions_controller';
import { RevokeSessionController, revokeSessionControllerSchema } from './controllers/revoke_session_controller';
import { createAuthMiddleware } from './middleware/auth_middleware';
import { IRegisterUserUseCase } from '../../application/register_user/port';
import { ILoginUserUseCase } from '../../application/login_user/port';
import { ILogoutUserUseCase } from '../../application/logout_user/port';
import { IRefreshTokenUseCase } from '../../application/refresh_token/port';
import { IListSessionsUseCase } from '../../application/list_sessions/port';
import { IRevokeSessionUseCase } from '../../application/revoke_session/port';
import { ITokenService } from '../../domain/services/token_service';
import { CookieConfig } from './utils/cookie_config';

export interface IdentityRoutesDeps {
  registerUserUseCase: IRegisterUserUseCase;
  loginUserUseCase: ILoginUserUseCase;
  logoutUserUseCase: ILogoutUserUseCase;
  refreshTokenUseCase: IRefreshTokenUseCase;
  listSessionsUseCase: IListSessionsUseCase;
  revokeSessionUseCase: IRevokeSessionUseCase;
  tokenService: ITokenService;
  cookieConfig: CookieConfig;
}

export const identityRoutes: FastifyPluginCallback<IdentityRoutesDeps> = (
  fastify: FastifyInstance,
  deps: IdentityRoutesDeps,
  done
) => {
  const registerController = new RegisterController(deps.registerUserUseCase);
  const loginController = new LoginController(deps.loginUserUseCase, deps.cookieConfig);
  const logoutController = new LogoutController(deps.logoutUserUseCase, deps.cookieConfig);
  const refreshTokenController = new RefreshTokenController(deps.refreshTokenUseCase, deps.cookieConfig);
  const listSessionsController = new ListSessionsController(deps.listSessionsUseCase);
  const revokeSessionController = new RevokeSessionController(deps.revokeSessionUseCase, deps.cookieConfig);
  const authMiddleware = createAuthMiddleware(deps.tokenService);

  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: registerControllerSchema,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    return registerController.handle(request as FastifyRequest<{ Body: RegisterBody }>, reply);
  });

  fastify.post<{ Body: LoginBody }>('/login', {
    schema: loginControllerSchema,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    return loginController.handle(request as FastifyRequest<{ Body: LoginBody }>, reply);
  });

  fastify.post('/logout', {
    schema: logoutControllerSchema,
    preHandler: authMiddleware,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    return logoutController.handle(request, reply);
  });

  fastify.post('/token/refresh', {
    schema: refreshTokenControllerSchema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    return refreshTokenController.handle(request, reply);
  });

  fastify.get('/sessions', {
    schema: listSessionsControllerSchema,
    preHandler: authMiddleware,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    return listSessionsController.handle(request, reply);
  });

  fastify.post<{ Params: { id: string } }>('/sessions/:id/revoke', {
    schema: revokeSessionControllerSchema,
    preHandler: authMiddleware,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    return revokeSessionController.handle(request as FastifyRequest<{ Params: { id: string } }>, reply);
  });

  done();
};

export { RegisterController } from './controllers/register_controller';
export { LoginController } from './controllers/login_controller';
export { LogoutController } from './controllers/logout_controller';
export { RefreshTokenController } from './controllers/refresh_token_controller';
export { ListSessionsController } from './controllers/list_sessions_controller';
export { RevokeSessionController } from './controllers/revoke_session_controller';
export { createAuthMiddleware } from './middleware/auth_middleware';

import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from 'fastify';
import { RegisterController, registerControllerSchema, RegisterBody } from './controllers/register_controller';
import { LoginController, loginControllerSchema, LoginBody } from './controllers/login_controller';
import { LogoutController, logoutControllerSchema } from './controllers/logout_controller';
import { createAuthMiddleware } from './middleware/auth_middleware';
import { IRegisterUserUseCase } from '../../application/register_user/port';
import { ILoginUserUseCase } from '../../application/login_user/port';
import { ILogoutUserUseCase } from '../../application/logout_user/port';
import { ITokenService } from '../../domain/services/token_service';

export interface IdentityRoutesDeps {
  registerUserUseCase: IRegisterUserUseCase;
  loginUserUseCase: ILoginUserUseCase;
  logoutUserUseCase: ILogoutUserUseCase;
  tokenService: ITokenService;
}

export const identityRoutes: FastifyPluginCallback<IdentityRoutesDeps> = (
  fastify: FastifyInstance,
  deps: IdentityRoutesDeps,
  done
) => {
  const registerController = new RegisterController(deps.registerUserUseCase);
  const loginController = new LoginController(deps.loginUserUseCase);
  const logoutController = new LogoutController(deps.logoutUserUseCase);
  const authMiddleware = createAuthMiddleware(deps.tokenService);

  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: registerControllerSchema,
  }, async (request, reply) => {
    return registerController.handle(request as FastifyRequest<{ Body: RegisterBody }>, reply);
  });

  fastify.post<{ Body: LoginBody }>('/login', {
    schema: loginControllerSchema,
  }, async (request, reply) => {
    return loginController.handle(request as FastifyRequest<{ Body: LoginBody }>, reply);
  });

  fastify.post('/logout', {
    schema: logoutControllerSchema,
    preHandler: authMiddleware,
  }, async (request, reply) => {
    return logoutController.handle(request, reply);
  });

  done();
};

export { RegisterController } from './controllers/register_controller';
export { LoginController } from './controllers/login_controller';
export { LogoutController } from './controllers/logout_controller';
export { createAuthMiddleware } from './middleware/auth_middleware';

import Fastify, { FastifyInstance } from 'fastify';
import { createDatabase, closeDatabase } from '@modules/identity/infrastructure/persistence/config/db_config';
import { JwtAdapter } from '@modules/identity/infrastructure/adapters/jwt_adapter';
import { BcryptAdapter } from '@modules/identity/infrastructure/adapters/bcrypt_adapter';
import { UserRepository } from '@modules/identity/infrastructure/persistence/repositories/user_repository';
import { RegisterUserHandler } from '@modules/identity/application/register_user/handler';
import { LoginUserHandler } from '@modules/identity/application/login_user/handler';
import { LogoutUserHandler } from '@modules/identity/application/logout_user/handler';
import { identityRoutes } from '@modules/identity/infrastructure/http/routes';
import { config } from '@config/index';

let server: FastifyInstance | null = null;

async function createServer(): Promise<FastifyInstance> {
  const db = createDatabase(config.identityDatabase);

  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  const userRepository = new UserRepository(db);
  const passwordHasher = new BcryptAdapter();
  const tokenService = new JwtAdapter({ secret: config.jwt.secret });

  const registerUserHandler = new RegisterUserHandler({
    userRepository,
    passwordHasher,
  });

  const loginUserHandler = new LoginUserHandler({
    userRepository,
    passwordHasher,
    tokenService,
  });

  const logoutUserHandler = new LogoutUserHandler({
    userRepository,
  });

  const fastify = Fastify({ logger: true });

  await fastify.register(async (instance) => {
    await instance.register(identityRoutes, {
      registerUserUseCase: registerUserHandler,
      loginUserUseCase: loginUserHandler,
      logoutUserUseCase: logoutUserHandler,
      tokenService,
    });
  });

  fastify.get('/health', async () => ({ status: 'ok' }));

  return fastify;
}

export async function startServer(): Promise<void> {
  server = await createServer();

  await server.listen({ port: config.port, host: '0.0.0.0' });

  const address = server.server.address();
  const port = typeof address === 'object' ? address?.port : config.port;
  server.log.info(`Server listening on port ${port}`);
}

export async function stopServer(): Promise<void> {
  if (server) {
    await server.close();
    closeDatabase();
    server = null;
  }
}

async function main() {
  process.on('SIGINT', async () => {
    await stopServer();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await stopServer();
    process.exit(0);
  });

  await startServer();
}

main().catch(async (err) => {
  console.error('Fatal error during startup:', err);
  await stopServer();
  process.exit(1);
});

import Fastify, { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import {
  createDatabase,
  closeDatabase,
} from "@modules/identity/infrastructure/persistence/config/db_config";
import { JwtAdapter } from "@modules/identity/infrastructure/adapters/jwt_adapter";
import { BcryptAdapter } from "@modules/identity/infrastructure/adapters/bcrypt_adapter";
import { UserRepository } from "@modules/identity/infrastructure/persistence/repositories/user_repository";
import { RefreshTokenRepository } from "@modules/identity/infrastructure/persistence/repositories/refresh_token_repository";
import { PgOutboxRepository } from "@modules/identity/infrastructure/persistence/repositories/outbox_repository";
import { KafkaOutboxPublisher } from "@modules/identity/infrastructure/adapters/kafka_outbox_publisher";
import {
  createOutboxRelay,
  OutboxRelay,
} from "@modules/identity/infrastructure/relay/outbox_relay";
import { RegisterUserHandler } from "@modules/identity/application/register_user/handler";
import { LoginUserHandler } from "@modules/identity/application/login_user/handler";
import { LogoutUserHandler } from "@modules/identity/application/logout_user/handler";
import { RefreshTokenHandler } from "@modules/identity/application/refresh_token/handler";
import { ListSessionsHandler } from "@modules/identity/application/list_sessions/handler";
import { RevokeSessionHandler } from "@modules/identity/application/revoke_session/handler";
import { identityRoutes } from "@modules/identity/infrastructure/http/routes";
import { buildRefreshTokenCookieConfig } from "@modules/identity/infrastructure/http/utils/cookie_config";
import { getConfig } from "@config/index";
import "./email_worker";

let server: FastifyInstance | null = null;
let relay: OutboxRelay | null = null;

async function createServer(): Promise<FastifyInstance> {
  const config = getConfig();

  const db = createDatabase(config.identityDatabase);

  if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 characters");
  }
  if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) {
    throw new Error("JWT_REFRESH_SECRET must be at least 32 characters");
  }

  const userRepository = new UserRepository(db);
  const refreshTokenRepository = new RefreshTokenRepository(db);
  const outboxRepository = new PgOutboxRepository(db);
  const kafkaPublisher = KafkaOutboxPublisher.fromAppConfig(config.kafka);
  await kafkaPublisher.connect();

  relay = createOutboxRelay(
    outboxRepository,
    kafkaPublisher,
    config.outboxRelay,
  );

  const passwordHasher = new BcryptAdapter();
  const tokenService = new JwtAdapter({
    accessSecret: config.jwt.accessSecret,
    refreshSecret: config.jwt.refreshSecret,
  });

  const registerUserHandler = new RegisterUserHandler({
    userRepository,
    passwordHasher,
  });

  const loginUserHandler = new LoginUserHandler({
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenService,
    maxSessionsPerUser: config.auth.maxSessionsPerUser,
  });

  const logoutUserHandler = new LogoutUserHandler({
    userRepository,
    refreshTokenRepository,
  });

  const fastify = Fastify({ logger: true });

  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await fastify.register(cookie);

  const refreshTokenHandler = new RefreshTokenHandler({
    userRepository,
    refreshTokenRepository,
    tokenService,
  });

  const listSessionsHandler = new ListSessionsHandler({
    userRepository,
    refreshTokenRepository,
  });

  const revokeSessionHandler = new RevokeSessionHandler({
    userRepository,
    refreshTokenRepository,
  });

  const cookieConfig = buildRefreshTokenCookieConfig(
    config.auth.cookieSecure,
    config.auth.cookieSameSite,
    7 * 24 * 60 * 60 * 1000,
  );

  console.log({ cookieConfig });

  await fastify.register(
    async (instance) => {
      await instance.register(identityRoutes, {
        registerUserUseCase: registerUserHandler,
        loginUserUseCase: loginUserHandler,
        logoutUserUseCase: logoutUserHandler,
        refreshTokenUseCase: refreshTokenHandler,
        listSessionsUseCase: listSessionsHandler,
        revokeSessionUseCase: revokeSessionHandler,
        tokenService,
        cookieConfig,
      });
    },
    { prefix: "/api" },
  );

  fastify.get("/health", async () => ({ status: "ok" }));

  return fastify;
}

export async function startServer(): Promise<void> {
  server = await createServer();

  const config = getConfig();

  await server.listen({ port: config.port, host: "0.0.0.0" });

  const address = server.server.address();
  const port = typeof address === "object" ? address?.port : config.port;
  server.log.info(`Server listening on port ${port}`);

  if (relay) {
    relay.start();
  }
}

export async function stopServer(): Promise<void> {
  if (relay) {
    await relay.stop();
    relay = null;
  }
  if (server) {
    await server.close();
    closeDatabase();
    server = null;
  }
}

async function main() {
  process.on("SIGINT", async () => {
    await stopServer();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await stopServer();
    process.exit(0);
  });

  await startServer();
}

main().catch(async (err) => {
  console.error("Fatal error during startup:", err);
  await stopServer();
  process.exit(1);
});

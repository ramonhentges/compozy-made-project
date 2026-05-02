import { FastifyRequest, FastifyReply } from "fastify";
import { IRefreshTokenUseCase } from "../../../application/refresh_token/port";
import { InvalidRefreshTokenError } from "../../../domain/errors/invalid_refresh_token_error";
import { RefreshTokenReusedError } from "../../../domain/errors/refresh_token_reused_error";
import {
  CookieConfig,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/cookie_config";

export class RefreshTokenController {
  constructor(
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    private readonly cookieConfig: CookieConfig,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const result = await this.refreshTokenUseCase.execute({
        refreshToken,
        deviceInfo: request.headers["user-agent"],
      });
      setRefreshTokenCookie(reply, result.refreshToken, this.cookieConfig);
      return reply.status(200).send({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      clearRefreshTokenCookie(reply, this.cookieConfig);
      if (
        error instanceof InvalidRefreshTokenError ||
        error instanceof RefreshTokenReusedError
      ) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      return reply.status(401).send({ error: "Unauthorized" });
    }
  }
}

export const refreshTokenControllerSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    },
    401: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
    },
  },
};

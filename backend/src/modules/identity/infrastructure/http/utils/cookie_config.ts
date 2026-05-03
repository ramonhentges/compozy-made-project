import { FastifyReply } from 'fastify';

export interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
  partitioned: boolean;
}

export function buildRefreshTokenCookieConfig(
  secure: boolean,
  sameSite: 'strict' | 'lax' | 'none',
  maxAgeMs: number
): CookieConfig {
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: maxAgeMs,
    partitioned: secure,
  };
}

export function setRefreshTokenCookie(
  reply: FastifyReply,
  token: string,
  config: CookieConfig
): void {
  void reply.setCookie('refreshToken', token, config);
}

export function clearRefreshTokenCookie(
  reply: FastifyReply,
  config: CookieConfig
): void {
  const { maxAge: _maxAge, ...clearConfig } = config;
  void reply.clearCookie('refreshToken', clearConfig);
}

import { describe, it, expect, vi, afterEach } from 'vitest';

const mockDb = {
  oneOrNone: vi.fn(),
  none: vi.fn(),
};

vi.mock('@config/index', () => ({
  config: {
    port: 3001,
    database: {
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      user: 'testuser',
      password: 'testpass',
    },
    jwt: {
      secret: 'this-is-a-valid-test-secret-that-is-long-enough',
      accessExpiry: '15m',
      refreshExpiry: '7d',
    },
    bcrypt: {
      rounds: 12,
    },
  },
}));

vi.mock('@modules/identity/infrastructure/persistence/config/db_config', () => ({
  createDatabase: vi.fn(() => mockDb),
  closeDatabase: vi.fn(),
  getDatabase: vi.fn(() => mockDb),
}));

vi.mock('@modules/identity/infrastructure/adapters/jwt_adapter', () => ({
  JwtAdapter: vi.fn().mockImplementation(() => ({
    generateAccessToken: vi.fn(() => 'access-token'),
    generateRefreshToken: vi.fn(() => 'refresh-token'),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  })),
}));

vi.mock('@modules/identity/infrastructure/adapters/bcrypt_adapter', () => ({
  BcryptAdapter: vi.fn().mockImplementation(() => ({
    hash: vi.fn(() => Promise.resolve('hashed')),
    verify: vi.fn(() => Promise.resolve(true)),
  })),
}));

vi.mock('@modules/identity/infrastructure/persistence/repositories/user_repository', () => ({
  UserRepository: vi.fn().mockImplementation(() => ({
    findByEmail: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('@modules/identity/application/register_user/handler', () => ({
  RegisterUserHandler: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ userId: '123', email: 'test@test.com' }),
  })),
}));

vi.mock('@modules/identity/application/login_user/handler', () => ({
  LoginUserHandler: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({ accessToken: 'token', refreshToken: 'refresh' }),
  })),
}));

vi.mock('@modules/identity/application/logout_user/handler', () => ({
  LogoutUserHandler: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modules/identity/infrastructure/http/routes', async () => {
  const actual = await vi.importActual('@modules/identity/infrastructure/http/routes');
  return {
    ...actual,
    identityRoutes: vi.fn((fastify, deps, done) => done()),
  };
});

describe('main', () => {
  describe('exports', () => {
    it('should export startServer and stopServer functions', async () => {
      const { startServer, stopServer } = await import('./index');
      expect(startServer).toBeDefined();
      expect(typeof startServer).toBe('function');
      expect(stopServer).toBeDefined();
      expect(typeof stopServer).toBe('function');
    });
  });

  afterEach(() => {
    vi.resetModules();
  });
});
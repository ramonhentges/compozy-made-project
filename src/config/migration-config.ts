import { parsePostgresUrl } from './utils/postgres-url';

export interface MigrationConfig {
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  migrationsDir: string;
}

export function getMigrationEnvConfig(contextName: string): MigrationConfig {
  const dbUrl = process.env[`${contextName.toUpperCase()}_DATABASE_URL`];

  if (!dbUrl) {
    throw new Error(`Missing required environment variable: ${contextName.toUpperCase()}_DATABASE_URL`);
  }

  try {
    const parsed = parsePostgresUrl(dbUrl);

    return {
      database: {
        user: parsed.user,
        password: parsed.password,
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
      },
      migrationsDir: `src/migrations/${contextName}`,
    };
  } catch (error) {
    throw new Error(`Invalid ${contextName}_DATABASE_URL format: ${dbUrl}`);
  }
}

export function getDefaultMigrationConfig(): Partial<MigrationConfig> {
  return {
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      database: process.env.DB_NAME ?? 'app',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
    },
    migrationsDir: process.env.MIGRATIONS_DIR ?? 'src/migrations',
  };
}

export function createMigrationConfig(contextName?: string): MigrationConfig {
  if (contextName) {
    return getMigrationEnvConfig(contextName);
  }

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    const parsed = parsePostgresUrl(dbUrl);
    return {
      database: {
        user: parsed.user,
        password: parsed.password,
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
      },
      migrationsDir: process.env.MIGRATIONS_DIR ?? 'src/migrations',
    };
  }

  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;

  if (!host || !database) {
    throw new Error('Database configuration not provided. Set DATABASE_URL or both DB_HOST and DB_NAME environment variables.');
  }

  return {
    database: {
      host,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      database,
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
    },
    migrationsDir: process.env.MIGRATIONS_DIR ?? 'src/migrations',
  };
}
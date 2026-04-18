import pgPromise, { IDatabase, IMain } from 'pg-promise';

const pgp: IMain = pgPromise({});

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections?: number;
}

let db: IDatabase<object> | null = null;

export function createDatabase(config: DatabaseConfig): IDatabase<object> {
  db = pgp({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: config.maxConnections ?? 20,
  });
  return db;
}

export function getDatabase(): IDatabase<object> {
  if (!db) {
    throw new Error('Database not initialized. Call createDatabase first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    pgp.end();
    db = null;
  }
}

export { pgp };

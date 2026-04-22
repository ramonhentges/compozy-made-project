import { identityDbConfig } from '../src/config/databases/identity_context';
import { spawn } from 'child_process';
import path from 'path';

Object.assign(process.env, {
  PGHOST: identityDbConfig.host,
  PGPORT: String(identityDbConfig.port),
  PGDATABASE: identityDbConfig.database,
  PGUSER: identityDbConfig.user,
  PGPASSWORD: identityDbConfig.password,
});

const action = process.argv[2] || 'up';
const migrationsDir = path.resolve(__dirname, '../src/migrations/identity_context/*.sql');
const args = ['-m', migrationsDir, '--use-glob', action];
spawn('node-pg-migrate', args, { stdio: 'inherit', env: process.env });
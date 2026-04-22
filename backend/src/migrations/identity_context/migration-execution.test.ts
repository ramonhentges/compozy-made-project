import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration Execution - Identity Context', () => {
  const migrationsDir = 'src/migrations/identity_context';
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const originalEnv = { ...process.env };

  const readMigration = (namePart: string, isDown = false): string => {
    const files = fs.readdirSync(migrationsDir);
    const migration = files.find(f =>
      f.includes(namePart) &&
      f.endsWith('.sql') &&
      (isDown ? f.includes('down') : !f.includes('down'))
    );

    expect(migration).toBeDefined();

    return fs.readFileSync(path.join(migrationsDir, migration as string), 'utf-8');
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Migration scripts configuration', () => {
    it('should have migrate:identity_context script defined', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts['migrate:identity_context']).toBeDefined();
    });

    it('should have migrate:identity_context:up script defined', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts['migrate:identity_context:up']).toBeDefined();
    });

    it('should have migrate:identity_context:down script defined', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts['migrate:identity_context:down']).toBeDefined();
    });
  });

  describe('Script command validity', () => {
    it('should use node-pg-migrate', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const script = packageJson.scripts['migrate:identity_context'];
      expect(script).toContain('node-pg-migrate');
    });

    it('should reference identity_context migration folder', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const script = packageJson.scripts['migrate:identity_context'];
      expect(script).toContain('src/migrations/identity_context');
    });

    it('should reference config from identity_context.ts', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const script = packageJson.scripts['migrate:identity_context'];
      expect(script).toContain('identity_context');
    });

    it('should forward up command', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const upScript = packageJson.scripts['migrate:identity_context:up'];
      expect(upScript).toContain(' up');
    });

    it('should forward down command', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const downScript = packageJson.scripts['migrate:identity_context:down'];
      expect(downScript).toContain(' down');
    });
  });

  describe('Database configuration structure', () => {
    it('should have identity_context.ts config file', () => {
      const configPath = path.resolve(process.cwd(), 'src/config/databases/identity_context.ts');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('config should export identityDbConfig', () => {
      const configContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/config/databases/identity_context.ts'),
        'utf-8'
      );
      expect(configContent).toContain('identityDbConfig');
    });

    it('config should export getIdentityDatabaseConfig', () => {
      const configContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/config/databases/identity_context.ts'),
        'utf-8'
      );
      expect(configContent).toContain('getIdentityDatabaseConfig');
    });
  });

  describe('Migration files exist', () => {
    it('should have initial schema up migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const upMigration = files.find(f => f.includes('initial_schema') && !f.includes('down') && f.endsWith('.sql'));
      expect(upMigration).toBeDefined();
    });

    it('should have initial schema down migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const downMigration = files.find(f => f.includes('initial_schema') && f.includes('down') && f.endsWith('.sql'));
      expect(downMigration).toBeDefined();
    });

    it('should have both up and down migrations', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter(f => f.endsWith('.sql'));
      expect(sqlFiles.length).toBeGreaterThanOrEqual(2);
    });

    it('should have outbox events up migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const upMigration = files.find(f => f.includes('outbox_events') && !f.includes('down') && f.endsWith('.sql'));

      expect(upMigration).toBeDefined();
    });

    it('should have outbox events down migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const downMigration = files.find(f => f.includes('outbox_events') && f.includes('down') && f.endsWith('.sql'));

      expect(downMigration).toBeDefined();
    });
  });

  describe('Outbox migration SQL validation', () => {
    it('should create events table for durable outbox records', () => {
      const sql = readMigration('outbox_events');

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS events');
    });

    it('should define required event envelope columns', () => {
      const sql = readMigration('outbox_events');

      expect(sql).toContain('id uuid PRIMARY KEY');
      expect(sql).toContain('event_name VARCHAR(255) NOT NULL');
      expect(sql).toContain('event_version INTEGER NOT NULL');
      expect(sql).toContain('aggregate_type VARCHAR(255) NOT NULL');
      expect(sql).toContain('aggregate_id VARCHAR(255) NOT NULL');
      expect(sql).toContain('payload JSONB NOT NULL');
      expect(sql).toContain('occurred_on TIMESTAMP NOT NULL');
    });

    it('should define relay status and retry columns', () => {
      const sql = readMigration('outbox_events');

      expect(sql).toContain('status VARCHAR(32) NOT NULL');
      expect(sql).toContain('attempts INTEGER NOT NULL DEFAULT 0');
      expect(sql).toContain('next_attempt_at TIMESTAMP NOT NULL DEFAULT NOW()');
      expect(sql).toContain('last_error TEXT NULL');
      expect(sql).toContain('created_at TIMESTAMP NOT NULL DEFAULT NOW()');
      expect(sql).toContain('processing_started_at TIMESTAMP NULL');
      expect(sql).toContain('published_at TIMESTAMP NULL');
    });

    it('should constrain status to outbox relay states', () => {
      const sql = readMigration('outbox_events');

      expect(sql).toContain("CHECK (status IN ('pending', 'processing', 'published', 'failed'))");
    });

    it('should create polling, aggregate investigation, and event-type indexes', () => {
      const sql = readMigration('outbox_events');

      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_events_status_next_attempt_at ON events(status, next_attempt_at)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_type, aggregate_id)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_events_event_name_version ON events(event_name, event_version)');
    });

    it('rollback should drop outbox objects without dropping users table', () => {
      const sql = readMigration('outbox_events', true);

      expect(sql).toContain('DROP INDEX IF EXISTS idx_events_event_name_version');
      expect(sql).toContain('DROP INDEX IF EXISTS idx_events_aggregate');
      expect(sql).toContain('DROP INDEX IF EXISTS idx_events_status_next_attempt_at');
      expect(sql).toContain('DROP TABLE IF EXISTS events');
      expect(sql).not.toContain('DROP TABLE IF EXISTS users');
    });
  });

  describe('Context isolation via folder structure', () => {
    it('migration folder name follows bounded context naming', () => {
      const folderName = path.basename(migrationsDir);
      expect(folderName).toBe('identity_context');
    });

    it('no other context migrations in folder', () => {
      const files = fs.readdirSync(migrationsDir);
      const nonIdentityFiles = files.filter(f => 
        f.includes('attendance') || f.includes('billing') || f.includes('notification')
      );
      expect(nonIdentityFiles.length).toBe(0);
    });
  });

  describe('Script generation analysis', () => {
    it('npm run migrate:identity_context should use environment variables', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const script = packageJson.scripts['migrate:identity_context'];

      expect(script).toContain('node-pg-migrate');
      expect(script).toContain('PGHOST');
      expect(script).toContain('PGPORT');
      expect(script).toContain('PGDATABASE');
      expect(script).toContain('PGUSER');
      expect(script).toContain('PGPASSWORD');
      expect(script).toContain('identity_context');
    });
  });
});

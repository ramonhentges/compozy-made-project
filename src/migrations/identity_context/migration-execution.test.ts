import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration Execution - Identity Context', () => {
  const migrationsDir = 'src/migrations/identity_context';
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const originalEnv = { ...process.env };

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
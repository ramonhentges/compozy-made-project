import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Identity Context Migration Folder Structure', () => {
  const migrationsDir = 'src/migrations/identity_context';
  const readmePath = 'src/migrations/identity_context/README.md';

  describe('Folder existence', () => {
    it('should have identity_context migrations folder', () => {
      const exists = fs.existsSync(migrationsDir);
      expect(exists).toBe(true);
    });

    it('should be a directory', () => {
      const stats = fs.statSync(migrationsDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('Snake case naming convention', () => {
    it('should use snake_case naming (identity_context)', () => {
      const folderName = path.basename(migrationsDir);
      expect(folderName).toBe('identity_context');
      expect(folderName).toMatch(/^[a-z][a-z0-9_]*$/);
    });
  });

  describe('README documentation', () => {
    it('should have README file in migration folder', () => {
      const exists = fs.existsSync(readmePath);
      expect(exists).toBe(true);
    });

    it('README should explain purpose and usage', () => {
      const content = fs.readFileSync(readmePath, 'utf-8');
      expect(content).toContain('Identity Context Migrations');
      expect(content).toContain('node-pg-migrate');
    });
  });

  describe('Migration tool recognition', () => {
    it('folder should be accessible for migration tool', () => {
      const stats = fs.statSync(migrationsDir);
      expect(stats.isDirectory()).toBe(true);
      expect(fs.accessSync(migrationsDir, fs.constants.R_OK)).toBeUndefined();
    });
  });

  describe('Outbox migration discovery', () => {
    it('should have outbox events up migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const upMigration = files.find(f =>
        f.includes('outbox_events') && !f.includes('down') && f.endsWith('.sql')
      );

      expect(upMigration).toBeDefined();
      expect(upMigration).toMatch(/^\d{14}_outbox_events\.sql$/);
    });

    it('should have matching outbox events down migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const downMigration = files.find(f =>
        f.includes('outbox_events') && f.includes('down') && f.endsWith('.sql')
      );

      expect(downMigration).toBeDefined();
      expect(downMigration).toMatch(/^\d{14}_outbox_events_down\.sql$/);
    });
  });
});

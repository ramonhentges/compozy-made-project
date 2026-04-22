import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('package.json migration scripts', () => {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');

  it('should contain migrate:identity_context script', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.scripts['migrate:identity_context']).toBeDefined();
  });

  it('should contain migrate:identity_context:up script', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.scripts['migrate:identity_context:up']).toBeDefined();
  });

  it('should contain migrate:identity_context:down script', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.scripts['migrate:identity_context:down']).toBeDefined();
  });

  it('should reference correct migration folder path', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const migrateScript = packageJson.scripts['migrate:identity_context'];
    expect(migrateScript).toContain('src/migrations/identity_context');
  });

  it('should reference identity context configuration', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const migrateScript = packageJson.scripts['migrate:identity_context'];
    expect(migrateScript).toContain('identity_context');
  });

  it('should use node-pg-migrate', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const migrateScript = packageJson.scripts['migrate:identity_context'];
    expect(migrateScript).toContain('node-pg-migrate');
  });

  it('should forward up command correctly', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const upScript = packageJson.scripts['migrate:identity_context:up'];
    expect(upScript).toContain('migrate:identity_context');
    expect(upScript).toContain('up');
  });

  it('should forward down command correctly', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const downScript = packageJson.scripts['migrate:identity_context:down'];
    expect(downScript).toContain('migrate:identity_context');
    expect(downScript).toContain('down');
  });
});
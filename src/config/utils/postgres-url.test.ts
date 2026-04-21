import { describe, it, expect } from 'vitest';
import { parsePostgresUrl } from './postgres-url';

describe('parsePostgresUrl', () => {
  it('should parse valid DATABASE_URL', () => {
    const result = parsePostgresUrl('postgresql://user:pass@localhost:5432/mydb');
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(5432);
    expect(result.database).toBe('mydb');
    expect(result.user).toBe('user');
    expect(result.password).toBe('pass');
  });

  it('should throw on invalid format', () => {
    expect(() => parsePostgresUrl('invalid-url')).toThrow('Invalid DATABASE_URL format');
  });

  
});
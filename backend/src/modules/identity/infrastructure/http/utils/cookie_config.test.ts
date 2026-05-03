import { describe, it, expect } from 'vitest';
import { buildRefreshTokenCookieConfig } from './cookie_config';

describe('buildRefreshTokenCookieConfig', () => {
  it('should return cookie config with partitioned=true when secure=true', () => {
    const config = buildRefreshTokenCookieConfig(true, 'lax', 7 * 24 * 60 * 60 * 1000);
    expect(config.httpOnly).toBe(true);
    expect(config.secure).toBe(true);
    expect(config.sameSite).toBe('lax');
    expect(config.path).toBe('/');
    expect(config.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    expect(config.partitioned).toBe(true);
  });

  it('should return cookie config with partitioned=false when secure=false', () => {
    const config = buildRefreshTokenCookieConfig(false, 'lax', 7 * 24 * 60 * 60 * 1000);
    expect(config.httpOnly).toBe(true);
    expect(config.secure).toBe(false);
    expect(config.sameSite).toBe('lax');
    expect(config.path).toBe('/');
    expect(config.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    expect(config.partitioned).toBe(false);
  });
});

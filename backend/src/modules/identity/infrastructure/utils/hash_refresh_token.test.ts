import { describe, it, expect } from 'vitest';
import { hashRefreshToken } from './hash_refresh_token';

describe('hashRefreshToken', () => {
  it('should return a 64-character hex string for a token', () => {
    const hash = hashRefreshToken('some-refresh-token');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should return consistent hash for the same input', () => {
    const hash1 = hashRefreshToken('same-token');
    const hash2 = hashRefreshToken('same-token');
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const hash1 = hashRefreshToken('token-a');
    const hash2 = hashRefreshToken('token-b');
    expect(hash1).not.toBe(hash2);
  });
});

import { describe, it, expect } from 'vitest';
import { loginSearchSchema } from '../router';

describe('loginSearchSchema', () => {
  describe('happy path', () => {
    it('should parse empty object', () => {
      const result = loginSearchSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should parse object with message only', () => {
      const result = loginSearchSchema.safeParse({
        message: 'Registration successful! Please log in.',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Registration successful! Please log in.');
        expect(result.data.redirect).toBeUndefined();
      }
    });

    it('should parse object with redirect only', () => {
      const result = loginSearchSchema.safeParse({
        redirect: '/home',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.redirect).toBe('/home');
        expect(result.data.message).toBeUndefined();
      }
    });

    it('should parse object with both message and redirect', () => {
      const result = loginSearchSchema.safeParse({
        message: 'Please log in.',
        redirect: '/home/settings',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Please log in.');
        expect(result.data.redirect).toBe('/home/settings');
      }
    });
  });

  describe('edge cases', () => {
    it('should parse empty string message', () => {
      const result = loginSearchSchema.safeParse({ message: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('');
      }
    });

    it('should parse empty string redirect', () => {
      const result = loginSearchSchema.safeParse({ redirect: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.redirect).toBe('');
      }
    });

    it('should parse URL-encoded redirect path', () => {
      const result = loginSearchSchema.safeParse({
        redirect: '/home%2Fprofile',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.redirect).toBe('/home%2Fprofile');
      }
    });

    it('should parse deeply nested redirect path', () => {
      const result = loginSearchSchema.safeParse({
        redirect: '/home/projects/123/tasks/456',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.redirect).toBe('/home/projects/123/tasks/456');
      }
    });
  });

  describe('type coercion', () => {
    it('should reject non-string message', () => {
      const result = loginSearchSchema.safeParse({ message: 123 });
      expect(result.success).toBe(false);
    });

    it('should reject non-string redirect', () => {
      const result = loginSearchSchema.safeParse({ redirect: true });
      expect(result.success).toBe(false);
    });

    it('should reject array values', () => {
      const result = loginSearchSchema.safeParse({ redirect: ['/home', '/dashboard'] });
      expect(result.success).toBe(false);
    });
  });

  describe('strip unknown keys', () => {
    it('should ignore extra keys', () => {
      const result = loginSearchSchema.safeParse({
        message: 'Hello',
        redirect: '/home',
        extra: 'value',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('extra');
      }
    });
  });
});

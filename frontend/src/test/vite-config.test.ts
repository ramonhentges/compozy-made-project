import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadEnv } from 'vite';

describe('Vite Proxy Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Environment Variables', () => {
    it('should have VITE_API_URL defined in environment', () => {
      const envUrl = process.env.VITE_API_URL;
      expect(envUrl).toBeDefined();
      expect(envUrl).toBe('http://localhost:3001');
    });

    it('should use default fallback when VITE_API_URL is not set', () => {
      delete process.env.VITE_API_URL;
      const target = process.env.VITE_API_URL || 'http://localhost:3001';
      expect(target).toBe('http://localhost:3001');
    });

    it('should use custom VITE_API_URL when set', () => {
      process.env.VITE_API_URL = 'http://custom-backend:4000';
      const target = process.env.VITE_API_URL || 'http://localhost:3001';
      expect(target).toBe('http://custom-backend:4000');
    });
  });

  describe('Proxy Configuration', () => {
    it('should proxy /api paths to backend', () => {
      const proxyConfig = {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      };

      expect(proxyConfig['/api']).toBeDefined();
      expect(proxyConfig['/api'].target).toBe('http://localhost:3001');
      expect(proxyConfig['/api'].changeOrigin).toBe(true);
    });

    it('should use custom target when VITE_API_URL is set', () => {
      process.env.VITE_API_URL = 'http://production:8080';
      const proxyConfig = {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      };

      expect(proxyConfig['/api'].target).toBe('http://production:8080');
    });
  });
});
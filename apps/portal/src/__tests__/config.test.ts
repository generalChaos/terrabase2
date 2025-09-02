import { config } from '../lib/config';

// Mock environment variables
const originalEnv = process.env;

describe('Config Module', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Detection', () => {
    test('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL = undefined;
      
      // Re-import to get fresh config
      const { config: freshConfig } = require('../lib/config');
      
      expect(freshConfig.environment.isDevelopment).toBe(true);
      expect(freshConfig.environment.isProduction).toBe(false);
      expect(freshConfig.environment.isVercel).toBe(false);
    });

    test('should detect Vercel environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';
      
      const { config: freshConfig } = require('../lib/config');
      
      expect(freshConfig.environment.isDevelopment).toBe(false);
      expect(freshConfig.environment.isProduction).toBe(true);
      expect(freshConfig.environment.isVercel).toBe(true);
    });

    test('should detect production environment (non-Vercel)', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = undefined;
      
      const { config: freshConfig } = require('../lib/config');
      
      expect(freshConfig.environment.isDevelopment).toBe(false);
      expect(freshConfig.environment.isProduction).toBe(true);
      expect(freshConfig.environment.isVercel).toBe(false);
    });
  });

  describe('URL Generation', () => {
    test('should generate development URLs', () => {
      process.env.NODE_ENV = 'development';
      process.env.VERCEL = undefined;
      
      const { config: freshConfig } = require('../lib/config');
      
      expect(freshConfig.urls.partyGame).toBe('http://localhost:3001');
      expect(freshConfig.urls.magicMarker).toBe('http://localhost:3002');
      expect(freshConfig.urls.portal).toBe('http://localhost:3000');
    });

    test('should generate Vercel URLs', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';
      
      const { config: freshConfig } = require('../lib/config');
      
      expect(freshConfig.urls.partyGame).toBe('https://party-game.railway.app');
      expect(freshConfig.urls.magicMarker).toBe('https://magic-marker.railway.app');
      expect(freshConfig.urls.portal).toBe('https://terrabase2.vercel.app');
    });

    test('should generate AWS URLs for future deployment', () => {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = undefined;
      
      const { config: freshConfig } = require('../lib/config');
      
      expect(freshConfig.urls.partyGame).toBe('https://party-game.terrabase2.com');
      expect(freshConfig.urls.magicMarker).toBe('https://magic-marker.terrabase2.com');
      expect(freshConfig.urls.portal).toBe('https://terrabase2.com');
    });
  });

  describe('GitHub URLs', () => {
    test('should have valid GitHub repository URLs', () => {
      expect(config.github.partyGame).toContain('github.com');
      expect(config.github.partyGame).toContain('terrabase2');
      expect(config.github.partyGame).toContain('party-game');
      
      expect(config.github.magicMarker).toContain('github.com');
      expect(config.github.magicMarker).toContain('terrabase2');
      expect(config.github.magicMarker).toContain('magic-marker');
    });
  });

  describe('URL Format Validation', () => {
    test('should generate valid HTTP/HTTPS URLs', () => {
      const urlPattern = /^https?:\/\/.+/;
      
      expect(urlPattern.test(config.urls.partyGame)).toBe(true);
      expect(urlPattern.test(config.urls.magicMarker)).toBe(true);
      expect(urlPattern.test(config.urls.portal)).toBe(true);
    });

    test('should not have trailing slashes in URLs', () => {
      expect(config.urls.partyGame).not.toMatch(/\/$/);
      expect(config.urls.magicMarker).not.toMatch(/\/$/);
      expect(config.urls.portal).not.toMatch(/\/$/);
    });
  });
});

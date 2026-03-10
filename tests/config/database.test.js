import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock objects before vi.mock factories run (vi.hoisted is
// evaluated before any vi.mock factory, so references are safe).
const { mockNeonConfig, mockNeonFn, mockDrizzleFn } = vi.hoisted(() => {
  return {
    mockNeonConfig: {
      fetchEndpoint: undefined,
      useSecureWebSocket: undefined,
      poolQueryViaFetch: undefined,
    },
    mockNeonFn: vi.fn(() => 'mock-sql-client'),
    mockDrizzleFn: vi.fn(() => 'mock-db-instance'),
  };
});

vi.mock('@neondatabase/serverless', () => ({
  neon: mockNeonFn,
  neonConfig: mockNeonConfig,
}));

vi.mock('drizzle-orm/neon-http', () => ({
  drizzle: mockDrizzleFn,
}));

describe('Database configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Reset mock state
    mockNeonConfig.fetchEndpoint = undefined;
    mockNeonConfig.useSecureWebSocket = undefined;
    mockNeonConfig.poolQueryViaFetch = undefined;
    mockNeonFn.mockClear();
    mockDrizzleFn.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('when NEON_LOCAL is "true" (development / Docker dev)', () => {
    it('should configure neonConfig for the local proxy with default host', async () => {
      process.env.NEON_LOCAL = 'true';
      delete process.env.NEON_LOCAL_HOST;
      process.env.DATABASE_URL = 'postgres://neon:npg@db:5432/neondb';

      await import('#config/database.js');

      expect(mockNeonConfig.fetchEndpoint).toBe('http://localhost:5432/sql');
      expect(mockNeonConfig.useSecureWebSocket).toBe(false);
      expect(mockNeonConfig.poolQueryViaFetch).toBe(true);
    });

    it('should use NEON_LOCAL_HOST when provided', async () => {
      process.env.NEON_LOCAL = 'true';
      process.env.NEON_LOCAL_HOST = 'db';
      process.env.DATABASE_URL = 'postgres://neon:npg@db:5432/neondb';

      await import('#config/database.js');

      expect(mockNeonConfig.fetchEndpoint).toBe('http://db:5432/sql');
    });

    it('should still create the neon sql client and drizzle instance', async () => {
      process.env.NEON_LOCAL = 'true';
      process.env.DATABASE_URL = 'postgres://neon:npg@db:5432/neondb';

      const { db, sql } = await import('#config/database.js');

      expect(mockNeonFn).toHaveBeenCalledWith('postgres://neon:npg@db:5432/neondb');
      expect(mockDrizzleFn).toHaveBeenCalledWith('mock-sql-client');
      expect(sql).toBe('mock-sql-client');
      expect(db).toBe('mock-db-instance');
    });
  });

  describe('when NEON_LOCAL is not set (production / Neon Cloud)', () => {
    it('should not modify neonConfig', async () => {
      delete process.env.NEON_LOCAL;
      process.env.DATABASE_URL = 'postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require';

      await import('#config/database.js');

      expect(mockNeonConfig.fetchEndpoint).toBeUndefined();
      expect(mockNeonConfig.useSecureWebSocket).toBeUndefined();
      expect(mockNeonConfig.poolQueryViaFetch).toBeUndefined();
    });

    it('should pass the cloud DATABASE_URL to the neon client', async () => {
      delete process.env.NEON_LOCAL;
      const cloudUrl = 'postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require';
      process.env.DATABASE_URL = cloudUrl;

      await import('#config/database.js');

      expect(mockNeonFn).toHaveBeenCalledWith(cloudUrl);
    });
  });

  describe('when NEON_LOCAL is set to a non-"true" value', () => {
    it('should not modify neonConfig for NEON_LOCAL="false"', async () => {
      process.env.NEON_LOCAL = 'false';
      process.env.DATABASE_URL = 'postgres://user:pass@host/db';

      await import('#config/database.js');

      expect(mockNeonConfig.fetchEndpoint).toBeUndefined();
      expect(mockNeonConfig.useSecureWebSocket).toBeUndefined();
    });
  });
});

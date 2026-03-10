import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

describe('Docker development environment (docker-compose.dev.yml)', () => {
  let compose;

  beforeAll(() => {
    const filePath = resolve(
      import.meta.dirname,
      '../../docker-compose.dev.yml'
    );
    compose = yaml.load(readFileSync(filePath, 'utf8'));
  });

  describe('neon-local service', () => {
    it('should define a neon-local service', () => {
      expect(compose.services).toHaveProperty('neon-local');
    });

    it('should use the official neondatabase/neon_local image', () => {
      expect(compose.services['neon-local'].image).toBe(
        'neondatabase/neon_local:latest'
      );
    });

    it('should expose port 5432', () => {
      expect(compose.services['neon-local'].ports).toContain('5432:5432');
    });

    it('should load .env.development', () => {
      expect(compose.services['neon-local'].env_file).toContain(
        '.env.development'
      );
    });

    it('should have a healthcheck using pg_isready', () => {
      const hc = compose.services['neon-local'].healthcheck;
      expect(hc).toBeDefined();
      expect(hc.test).toEqual(expect.arrayContaining(['CMD', 'pg_isready']));
    });

    it('should be on the acquisition-network', () => {
      expect(compose.services['neon-local'].networks).toContain(
        'acquisition-network'
      );
    });
  });

  describe('app service', () => {
    it('should define an app service', () => {
      expect(compose.services).toHaveProperty('app');
    });

    it('should build with the dev target', () => {
      expect(compose.services.app.build.target).toBe('dev');
    });

    it('should expose port 3000', () => {
      expect(compose.services.app.ports).toContain('3000:3000');
    });

    it('should load .env.development', () => {
      expect(compose.services.app.env_file).toContain('.env.development');
    });

    it('should depend on neon-local being healthy', () => {
      const deps = compose.services.app.depends_on;
      expect(deps).toHaveProperty('neon-local');
      expect(deps['neon-local'].condition).toBe('service_healthy');
    });

    it('should mount source code for hot reload', () => {
      const volumes = compose.services.app.volumes;
      expect(volumes).toEqual(
        expect.arrayContaining([expect.stringContaining('./src:/app/src')])
      );
    });

    it('should be on the acquisition-network', () => {
      expect(compose.services.app.networks).toContain('acquisition-network');
    });

    it('should have a healthcheck on /health', () => {
      const hc = compose.services.app.healthcheck;
      expect(hc).toBeDefined();
      expect(hc.test.join(' ')).toContain('/health');
    });
  });
});

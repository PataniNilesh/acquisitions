import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

describe('Docker production environment (docker-compose.prod.yml)', () => {
  let compose;

  beforeAll(() => {
    const filePath = resolve(import.meta.dirname, '../../docker-compose.prod.yml');
    compose = yaml.load(readFileSync(filePath, 'utf8'));
  });

  describe('service definitions', () => {
    it('should not include a neon-local service', () => {
      expect(compose.services).not.toHaveProperty('neon-local');
    });

    it('should only define the app service', () => {
      expect(Object.keys(compose.services)).toEqual(['app']);
    });
  });

  describe('app service', () => {
    it('should build with the production target', () => {
      expect(compose.services.app.build.target).toBe('production');
    });

    it('should expose port 3000', () => {
      expect(compose.services.app.ports).toContain('3000:3000');
    });

    it('should load .env.production', () => {
      expect(compose.services.app.env_file).toContain('.env.production');
    });

    it('should not depend on any database service', () => {
      expect(compose.services.app.depends_on).toBeUndefined();
    });

    it('should have a healthcheck on /health', () => {
      const hc = compose.services.app.healthcheck;
      expect(hc).toBeDefined();
      expect(hc.test.join(' ')).toContain('/health');
    });

    it('should have resource limits configured', () => {
      const limits = compose.services.app.deploy?.resources?.limits;
      expect(limits).toBeDefined();
      expect(limits.memory).toBeDefined();
      expect(limits.cpus).toBeDefined();
    });

    it('should restart unless stopped or on failure', () => {
      const restart = compose.services.app.restart;
      const restartPolicy = compose.services.app.deploy?.restart_policy;
      expect(restart || restartPolicy).toBeDefined();
    });

    it('should configure logging', () => {
      const logging = compose.services.app.logging;
      expect(logging).toBeDefined();
      expect(logging.driver).toBe('json-file');
    });
  });
});

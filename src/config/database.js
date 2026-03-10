import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// When running with Neon Local (dev Docker), configure the serverless
// driver to talk to the local proxy over plain HTTP instead of wss://.
// NEON_LOCAL=true is only set in .env.development (Docker dev), never locally.
if (process.env.NEON_LOCAL === 'true') {
  const host = process.env.NEON_LOCAL_HOST || 'localhost';
  neonConfig.fetchEndpoint = `http://${host}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export { db, sql };

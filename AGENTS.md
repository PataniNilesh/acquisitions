# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Acquisitions is a Node.js REST API built with Express 5 and ES modules (`"type": "module"`). It uses Neon (serverless PostgreSQL) via Drizzle ORM, with JWT-based auth and Zod validation.

## Commands

### Development
```
npm run dev          # Start dev server with --watch (auto-restart on changes)
```

### Linting & Formatting
```
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check only
```

### Database (Drizzle Kit)
```
npm run db:generate  # Generate migrations from model changes
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Open Drizzle Studio GUI
```

There is no test runner configured yet. The ESLint config includes a `tests/**/*.js` glob with jest globals, but no test framework is installed.

## Architecture

### Request flow
`routes → controllers → services → db (Drizzle)`

- **Routes** (`src/routes/`) — Define Express endpoints and bind controller handlers.
- **Controllers** (`src/controllers/`) — Parse/validate input (via Zod schemas from `validations/`), call services, and return HTTP responses.
- **Services** (`src/services/`) — Business logic and database operations using Drizzle ORM.
- **Validations** (`src/validations/`) — Zod schemas for request body validation. Controllers call `.safeParse()` and use `formatValidationError` from utils to format errors.
- **Models** (`src/models/`) — Drizzle table definitions (`pgTable`). These are also referenced by `drizzle.config.js` for migration generation.

### Entry point
`src/index.js` → loads dotenv → imports `src/server.js` → starts listening. The Express app itself is configured in `src/app.js` (middleware stack: helmet, JSON body parser, cookie-parser, morgan/winston logging, CORS).

### Path aliases
The project uses Node.js subpath imports (defined in `package.json` `"imports"` field). Always use these when importing:
- `#config/*`, `#controllers/*`, `#middleware/*`, `#models/*`, `#routes/*`, `#services/*`, `#utils/*`, `#validations/*`

### Database
- Neon serverless PostgreSQL via `@neondatabase/serverless` + `drizzle-orm/neon-http`.
- Connection is in `src/config/database.js`; exports `db` (Drizzle instance) and `sql` (raw Neon client).
- Migrations live in `drizzle/` and are generated from model files.

### Auth pattern
- Passwords hashed with bcrypt (salt rounds: 10).
- JWT tokens (1-day expiry) set as httpOnly secure cookies via the `cookies` utility.
- `jwttoken` utility wraps `jsonwebtoken` sign/verify.

### Logging
Winston logger (`src/config/logger.js`) — writes JSON to `logs/error.log` and `logs/combined.log`. Console transport is added in non-production environments.

## Code Style
- 2-space indentation, single quotes, semicolons required, LF line endings.
- `prefer-const`, `no-var`, `object-shorthand`, `prefer-arrow-callback` enforced.
- Unused function params prefixed with `_` are allowed (`argsIgnorePattern: "^_"`).

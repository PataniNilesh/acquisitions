# Docker Setup

This project supports two Docker environments:

- **Development** — Uses [Neon Local](https://neon.com/docs/local/neon-local) to proxy to ephemeral database branches
- **Production** — Connects directly to your Neon Cloud database

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- A [Neon](https://neon.tech) account with a project created
- Your Neon **API key** (from [API Keys settings](https://console.neon.tech/app/settings/api-keys))
- Your Neon **Project ID** (from Project Settings → General)
- Your **parent branch ID** (the branch to fork ephemeral branches from, usually `main`)

## Development (Neon Local)

### 1. Create your environment file

```bash
cp .env.development.example .env.development
```

Fill in the required values:

| Variable | Where to find it |
|---|---|
| `NEON_API_KEY` | Neon Console → Settings → API Keys |
| `NEON_PROJECT_ID` | Neon Console → Project Settings → General |
| `PARENT_BRANCH_ID` | Neon Console → Branches (copy the ID of your main branch) |
| `ARCJET_KEY` | Your Arcjet dashboard |

The `DATABASE_URL`, `NEON_LOCAL`, and `NEON_LOCAL_HOST` values are pre-configured and should not be changed.

### 2. Start the development environment

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts two services:

- **db** — Neon Local proxy on port 5432. It creates an ephemeral branch from your `PARENT_BRANCH_ID` on startup and deletes it on shutdown.
- **app** — The Express API on port 3000 with file watching enabled (source is volume-mounted).

### 3. Stop the environment

```bash
docker compose -f docker-compose.dev.yml down
```

The ephemeral database branch is automatically cleaned up.

### 4. Run database migrations (inside dev container)

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

## Production (Neon Cloud)

### 1. Create your environment file

```bash
cp .env.production.example .env.production
```

Fill in:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your full Neon Cloud connection string (e.g. `postgres://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`) |
| `ARCJET_KEY` | Your production Arcjet key |

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### 3. Stop

```bash
docker compose -f docker-compose.prod.yml down
```

## How Environment Switching Works

The key difference between dev and prod is the `DATABASE_URL` and `NEON_LOCAL` environment variables:

| | Development | Production |
|---|---|---|
| `DATABASE_URL` | `postgres://neon:npg@db:5432/neondb` | `postgres://...neon.tech/...` |
| `NEON_LOCAL` | `true` | not set |
| Database | Ephemeral branch via Neon Local proxy | Neon Cloud directly |

When `NEON_LOCAL=true` is set, `src/config/database.js` configures the `@neondatabase/serverless` driver to communicate with the Neon Local proxy over HTTP instead of the default secure WebSocket connection. In production, this variable is absent, so the driver uses its standard cloud configuration.

## Architecture Diagram

```
Development:
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  App     │────▶│  Neon Local     │────▶│  Neon Cloud   │
│ :3000    │     │  proxy :5432    │     │  (ephemeral   │
│          │     │  (db service)   │     │   branch)     │
└──────────┘     └─────────────────┘     └──────────────┘

Production:
┌──────────┐     ┌──────────────┐
│  App     │────▶│  Neon Cloud   │
│ :3000    │     │  (main DB)    │
└──────────┘     └──────────────┘
```

## Troubleshooting

- **App can't connect to db**: Ensure the `db` service is healthy before the app starts. The `depends_on` condition in `docker-compose.dev.yml` handles this, but if the Neon API key or project ID is wrong, the health check will fail.
- **Ephemeral branch not created**: Verify your `NEON_API_KEY`, `NEON_PROJECT_ID`, and `PARENT_BRANCH_ID` are correct.
- **Port conflicts**: If port 5432 or 3000 is already in use, stop the conflicting process or change the port mapping in the compose file.

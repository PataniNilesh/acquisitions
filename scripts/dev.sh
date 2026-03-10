#!/bin/bash

# Development startup script for Acquisition App with Neon Local

echo "🚀 Starting Acquisition App in Development Mode"
echo "================================================"

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development not found!"
    echo "   Run: cp .env.development.example .env.development"
    echo "   Then fill in NEON_API_KEY, NEON_PROJECT_ID, PARENT_BRANCH_ID, ARCJET_KEY."
    exit 1
fi

# Check for unfilled placeholder values
if grep -q "_here" .env.development 2>/dev/null; then
    echo "❌ Error: .env.development still has placeholder values."
    echo "   Please fill in NEON_API_KEY, NEON_PROJECT_ID, PARENT_BRANCH_ID, ARCJET_KEY."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Ensure .neon_local directory exists
mkdir -p .neon_local

echo "📦 Building and starting development containers..."
echo "   - Neon Local proxy will create an ephemeral database branch"
echo "   - Application will run with hot reload enabled"
echo ""

# Start containers in detached mode and wait for healthy status
docker compose -f docker-compose.dev.yml up --build -d

echo "⏳ Waiting for containers to be ready..."
docker compose -f docker-compose.dev.yml wait db 2>/dev/null || true

# Run migrations inside the app container (has all deps + correct DATABASE_URL)
echo "📜 Applying database migrations..."
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

echo ""
echo "🎉 Development environment started!"
echo "   Application: http://localhost:3000"
echo "   Health:      http://localhost:3000/health"
echo "   Database:    postgres://neon:npg@localhost:5432/neondb"
echo ""
echo "Useful commands:"
echo "   Logs:  docker compose -f docker-compose.dev.yml logs -f"
echo "   Stop:  docker compose -f docker-compose.dev.yml down"

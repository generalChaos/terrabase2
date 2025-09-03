#!/bin/bash

# Terrabase2 Development Setup Script

set -e

echo "🚀 Setting up Terrabase2 development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build shared packages
echo "🔨 Building shared packages..."
pnpm --filter @tb2/shared-* build
pnpm --filter @tb2/magic-marker-shared build

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
docker-compose -f docker-compose.dev.yml up -d postgres redis sqlite-volume

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
pnpm --filter @tb2/party-game-api prisma migrate dev

# Seed the database
echo "🌱 Seeding the database..."
pnpm --filter @tb2/party-game-api prisma db seed

echo "✅ Development environment setup complete!"
echo ""
echo "🌐 Available services:"
echo "  - Portal: http://localhost:3000"
echo "  - Party Game API: http://localhost:3001"
echo "  - Party Game Web: http://localhost:3002"
echo "  - Magic Marker API: http://localhost:3003"
echo "  - Magic Marker Web: http://localhost:3004"
echo "  - pgAdmin: http://localhost:5050"
echo "  - Redis Commander: http://localhost:8081"
echo ""
echo "📋 Useful commands:"
echo "  - Start all apps: pnpm dev"
echo "  - Start specific app: pnpm dev:portal|dev:party-game|dev:magic-marker"
echo "  - Stop infrastructure: docker-compose -f docker-compose.dev.yml down"
echo "  - View logs: docker-compose -f docker-compose.dev.yml logs -f"

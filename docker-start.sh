#!/bin/bash

# Docker Quick Start Script for Postmind

set -e

echo "🐳 Postmind Docker Setup"
echo "========================"
echo ""

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo "📝 Creating .env.docker from example..."
    cp .env.docker.example .env.docker
    echo "⚠️  Please edit .env.docker with your configuration before continuing"
    echo ""
    read -p "Press Enter to continue after editing .env.docker..."
fi

# Build images
echo "🔨 Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for web service to be ready
echo "⏳ Waiting for web service to be ready..."
sleep 5

# Initialize database
echo "📦 Initializing database..."
docker-compose exec -T web npx prisma generate || true
docker-compose exec -T web npx prisma db push || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Web UI: http://localhost:3000"
echo "📊 View logs: docker-compose logs -f"
echo "🛠️  Run CLI: docker-compose run --rm cli <command>"
echo ""
echo "📖 For more information, see DOCKER.md"


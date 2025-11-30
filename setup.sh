#!/bin/bash

# Script to setup reqbeam-db, web, and cli projects
# Exit on any error
set -e

echo "🚀 Starting setup process..."

# Build reqbeam-db
echo ""
echo "📦 Setting up reqbeam-db..."
cd reqbeam-db
npm i
npm run db:generate
npm run db:push
npm run build
cd ..

# Install dependencies for web
echo ""
echo "🌐 Installing dependencies for web..."
npm i
npm run db:generate
npm run db:push

# Build and link cli
echo ""
echo "⚙️  Setting up cli..."
cd reqbeam-cli
npm i
npm run build
npm link
cd ..

echo ""
echo "✅ Setup process completed successfully!"


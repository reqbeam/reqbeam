#!/bin/bash

# Script to setup postmind-db, web, and cli projects
# Exit on any error
set -e

echo "🚀 Starting setup process..."

# Build postmind-db
echo ""
echo "📦 Setting up postmind-db..."
cd postmind-db
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
cd postmind-cli
npm i
npm run build
npm link
cd ..

echo ""
echo "✅ Setup process completed successfully!"


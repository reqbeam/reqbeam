#!/bin/bash

# Quick setup script for .env.prd

set -e

echo "🔧 Setting up .env.prd for production deployment"
echo "=============================================="

if [ -f ".env.prd" ]; then
    echo "⚠️  .env.prd already exists!"
    read -p "Do you want to overwrite it? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

echo ""
echo "Creating .env.prd from template..."
cp env.example .env.prd

echo "✅ .env.prd created!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Now you need to edit .env.prd with your production values"
echo ""
echo "Required variables:"
echo "  1. DATABASE_URL - Your database connection URL"
echo "  2. DIRECT_URL - Direct database URL for migrations"
echo "  3. JWT_SECRET - Strong random secret"
echo ""
echo "Generate JWT_SECRET with:"
echo "  openssl rand -base64 32"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Press Enter to open .env.prd in editor (or edit manually)..."

# Try to open in editor
if command -v nano &> /dev/null; then
    nano .env.prd
elif command -v vim &> /dev/null; then
    vim .env.prd
elif command -v vi &> /dev/null; then
    vi .env.prd
else
    echo "No editor found. Please edit .env.prd manually:"
    echo "  nano .env.prd"
fi

echo ""
echo "✅ Setup complete! You can now deploy with:"
echo "  ./deploy.sh"


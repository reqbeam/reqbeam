#!/bin/bash

# Script to validate .env.prd configuration

set -e

echo "🔍 Validating .env.prd configuration..."
echo "========================================"

if [ ! -f ".env.prd" ]; then
    echo "❌ .env.prd file not found!"
    exit 1
fi

# Source the env file
source .env.prd

echo ""
echo "📊 Configuration Check:"
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is missing"
else
    echo "✅ DATABASE_URL is set"
    if [[ $DATABASE_URL == *":6543/"* ]] || [[ $DATABASE_URL == *"pgbouncer=true"* ]]; then
        echo "   ✅ Using connection pooler (recommended for DATABASE_URL)"
    else
        echo "   ⚠️  Not using connection pooler. For better performance, use:"
        echo "      - Port 6543, OR"
        echo "      - Add ?pgbouncer=true to connection string"
    fi
fi

# Check DIRECT_URL
if [ -z "$DIRECT_URL" ]; then
    echo "❌ DIRECT_URL is missing"
else
    echo "✅ DIRECT_URL is set"
    if [[ $DIRECT_URL == *":5432/"* ]] && [[ $DIRECT_URL != *"pgbouncer"* ]]; then
        echo "   ✅ Using direct connection (correct for DIRECT_URL)"
    else
        echo "   ⚠️  DIRECT_URL should use port 5432 without pgbouncer"
    fi
fi

# Check JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is missing"
else
    echo "✅ JWT_SECRET is set"
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo "   ⚠️  JWT_SECRET is short. Consider using a stronger secret:"
        echo "      openssl rand -base64 32"
    else
        echo "   ✅ JWT_SECRET length is good (${#JWT_SECRET} characters)"
    fi
fi

# Check PORT
if [ "$PORT" != "8080" ]; then
    echo "⚠️  PORT should be 8080 for Cloud Run (currently: $PORT)"
else
    echo "✅ PORT is correctly set to 8080"
fi

# Check NODE_ENV
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV should be 'production' (currently: $NODE_ENV)"
else
    echo "✅ NODE_ENV is set to production"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test database connection (optional)
read -p "Test database connection? (y/N): " test_db
if [[ $test_db =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔌 Testing database connection..."
    if npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database connection successful!"
    else
        echo "❌ Database connection failed!"
        echo "   Check your DATABASE_URL and ensure:"
        echo "   - Password is correct"
        echo "   - Database allows connections from your IP"
        echo "   - Connection string format is correct"
    fi
fi

echo ""
echo "💡 Supabase Connection String Format:"
echo ""
echo "DATABASE_URL (pooler - for app queries):"
echo "  postgresql://postgres:[password]@[project-ref].pooler.supabase.com:6543/postgres?pgbouncer=true"
echo ""
echo "DIRECT_URL (direct - for migrations):"
echo "  postgresql://postgres:[password]@db.[project-ref].supabase.com:5432/postgres"
echo ""


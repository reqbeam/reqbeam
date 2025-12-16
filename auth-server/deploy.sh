#!/bin/bash

# Deploy script for Cloud Run
# This script helps you deploy your auth server to Google Cloud Run

set -e

echo "🚀 Auth Server Deployment to Google Cloud Run"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No GCP project configured${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✅ Using GCP Project: ${PROJECT_ID}${NC}"
echo ""

# Ask for deployment configuration
echo -e "${YELLOW}🔧 Deployment Configuration${NC}"
read -p "Region (default: us-central1): " REGION
REGION=${REGION:-us-central1}

read -p "Service name (default: auth-server): " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-auth-server}

read -p "Min instances (0 for scale-to-zero, 1 for always-on): " MIN_INSTANCES
MIN_INSTANCES=${MIN_INSTANCES:-0}

read -p "Max instances (default: 10): " MAX_INSTANCES
MAX_INSTANCES=${MAX_INSTANCES:-10}

read -p "Memory (default: 512Mi): " MEMORY
MEMORY=${MEMORY:-512Mi}

echo ""
echo -e "${YELLOW}🔐 Environment Variables Configuration${NC}"
echo ""

# ===========================================
# HARDCODE YOUR VALUES HERE (or leave empty for interactive input)
# ===========================================
DATABASE_URL="postgresql://postgres.mpkrudrmlvltcwlrexhi:mrxqCfymrFw0Nx3D@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.mpkrudrmlvltcwlrexhi:mrxqCfymrFw0Nx3D@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
JWT_SECRET="2hC14+b/BqWg1tZ3/xjZrDq+1y0p5ZcKmD87gM/ZqF7Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8"
JWT_EXPIRES_IN="7d"
# ===========================================

# If variables are not hardcoded, ask for them interactively
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL (with connection pooler):${NC}"
    echo "  Example: postgresql://postgres:pass@host.pooler.supabase.com:6543/postgres?pgbouncer=true"
    read -p "> " DATABASE_URL
fi

if [ -z "$DIRECT_URL" ]; then
    echo ""
    echo -e "${YELLOW}DIRECT_URL (direct connection for migrations):${NC}"
    echo "  Example: postgresql://postgres:pass@db.host.supabase.com:5432/postgres"
    read -p "> " DIRECT_URL
fi

if [ -z "$JWT_SECRET" ]; then
    echo ""
    echo -e "${YELLOW}JWT_SECRET (generate with: openssl rand -base64 32):${NC}"
    read -s JWT_SECRET
    echo ""
fi

# Validate required variables
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ All environment variables are required!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"

echo ""
echo -e "${YELLOW}🏗️  Building and deploying...${NC}"

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --min-instances $MIN_INSTANCES \
    --max-instances $MAX_INSTANCES \
    --memory $MEMORY \
    --cpu 1 \
    --timeout 300 \
    --execution-environment gen2 \
    --cpu-throttling \
    --cpu-boost \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,DATABASE_URL=${DATABASE_URL},DIRECT_URL=${DIRECT_URL},JWT_SECRET=${JWT_SECRET},JWT_EXPIRES_IN=${JWT_EXPIRES_IN}" \
    --project $PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)' --project $PROJECT_ID)

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🌐 Service URL:${NC} $SERVICE_URL"
echo ""
echo -e "${GREEN}📍 Available endpoints:${NC}"
echo "  Health Check: $SERVICE_URL/health"
echo "  Login:        $SERVICE_URL/api/auth/login"
echo "  Signup:       $SERVICE_URL/api/auth/signup"
echo "  Verify:       $SERVICE_URL/api/auth/verify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}💡 Test your deployment:${NC}"
echo "  curl $SERVICE_URL/health"
echo ""
echo -e "${YELLOW}📊 View logs:${NC}"
echo "  gcloud run services logs read $SERVICE_NAME --region $REGION --project $PROJECT_ID"
echo ""


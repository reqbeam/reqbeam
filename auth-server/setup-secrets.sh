#!/bin/bash

# Script to setup secrets in Google Cloud Secret Manager

set -e

echo "🔐 Setting up secrets in Google Cloud Secret Manager"
echo "===================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
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

# Enable Secret Manager API
echo -e "${YELLOW}🔧 Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID
echo -e "${GREEN}✅ Secret Manager API enabled${NC}"
echo ""

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_description=$2
    
    echo -e "${YELLOW}📝 Enter value for ${secret_name}:${NC}"
    echo -e "${YELLOW}   ${secret_description}${NC}"
    read -s secret_value
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ Value cannot be empty${NC}"
        return 1
    fi
    
    # Check if secret exists
    if gcloud secrets describe $secret_name --project=$PROJECT_ID &>/dev/null; then
        echo -e "${YELLOW}Secret $secret_name already exists. Updating...${NC}"
        echo "$secret_value" | gcloud secrets versions add $secret_name \
            --data-file=- \
            --project=$PROJECT_ID
    else
        echo "$secret_value" | gcloud secrets create $secret_name \
            --data-file=- \
            --replication-policy="automatic" \
            --project=$PROJECT_ID
    fi
    
    echo -e "${GREEN}✅ Secret $secret_name configured${NC}"
    echo ""
}

# Create secrets
echo -e "${YELLOW}🔑 Setting up secrets...${NC}"
echo ""

create_or_update_secret "DATABASE_URL" "Database connection URL (with connection pooler if using Supabase)"

create_or_update_secret "DIRECT_URL" "Direct database connection URL (for migrations)"

create_or_update_secret "JWT_SECRET" "JWT secret key (use a strong random string)"

echo ""
echo -e "${GREEN}✅ All secrets configured successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 To view secrets:${NC}"
echo "  gcloud secrets list --project=$PROJECT_ID"
echo ""
echo -e "${YELLOW}💡 To update a secret later:${NC}"
echo "  ./setup-secrets.sh"
echo ""
echo -e "${YELLOW}💡 To grant Cloud Run access (if needed):${NC}"
echo "  gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "    --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \\"
echo "    --role=roles/secretmanager.secretAccessor"
echo ""


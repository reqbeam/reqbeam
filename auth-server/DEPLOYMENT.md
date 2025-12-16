# 🚀 Deployment Guide - Google Cloud Run

Complete guide to deploy your auth server to Google Cloud Run with zero data loss.

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Download here](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed (optional, Cloud Build handles it)

## 🔐 Important: Database Migrations

### ⚠️ NEVER use `db:push` in production!

- `prisma db push` - **DANGEROUS**: Can delete data, destructive changes
- `prisma migrate deploy` - **SAFE**: Only applies approved migrations, no data loss

### Migration Workflow

```bash
# 1. Create migration locally (development)
npm run db:migrate:dev

# 2. Test migration locally
# Check your database to ensure data is safe

# 3. Commit migration files to git
git add prisma/migrations
git commit -m "Add migration for [feature]"

# 4. Deploy (migrations run automatically in Dockerfile)
./deploy.sh
```

## 🏁 First Time Setup

### Step 1: Initialize Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create auth-server-prod --name="Auth Server"

# Set active project
gcloud config set project auth-server-prod

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 2: Initialize Prisma Migrations

**IMPORTANT**: Do this BEFORE deploying if you have existing data!

```bash
# If you have existing database with data, initialize migrations
# This creates a baseline without running migrations
npx prisma migrate resolve --applied "0_init" --schema=./prisma/schema.prisma

# Or create initial migration from current schema
npm run db:migrate:dev -- --name init
```

This prevents Prisma from trying to recreate existing tables.

### Step 3: Setup Production Environment

Create and configure your `.env.prd` file:

```bash
# Copy the template
cp env.example .env.prd

# Edit with your production values
nano .env.prd  # or use your preferred editor
```

You'll need to configure:

1. **DATABASE_URL**: Your database connection URL
   - For Supabase: `postgresql://postgres:[password]@[project-ref].supabase.co:6543/postgres?pgbouncer=true`
   - For Cloud SQL: `postgresql://user:pass@/db?host=/cloudsql/project:region:instance`

2. **DIRECT_URL**: Direct database connection (for migrations)
   - For Supabase: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
   - For Cloud SQL: Same as DATABASE_URL

3. **JWT_SECRET**: Strong random string
   - Generate: `openssl rand -base64 32`

**⚠️ IMPORTANT**: `.env.prd` is git-ignored to keep your secrets safe!

### Step 4: Deploy

```bash
# Make deploy script executable (already done)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
- ✅ Check your GCP configuration
- ✅ Verify `.env.prd` exists and is valid
- ✅ Build optimized Docker image
- ✅ Run safe migrations (`prisma migrate deploy`)
- ✅ Deploy to Cloud Run
- ✅ Show your service URL

## 🔄 Subsequent Deployments

For every deployment after the first:

```bash
# 1. Make your code changes

# 2. If database schema changed:
npm run db:migrate:dev -- --name describe_your_change

# 3. Test locally
npm run dev

# 4. Deploy
./deploy.sh
```

## 🗺️ Migration Strategy

### For NEW Schema Changes

```bash
# 1. Update schema.prisma
# 2. Create migration
npm run db:migrate:dev -- --name add_user_role

# 3. Review generated migration in prisma/migrations/
# 4. Test locally
npm run dev

# 5. Deploy (migrations run automatically)
./deploy.sh
```

### For EXISTING Database (First Deploy)

If you already have data in production:

```bash
# Option 1: Create baseline (recommended)
# This tells Prisma your current schema is already applied
npx prisma migrate resolve --applied "0_init"

# Option 2: Generate initial migration without running it
npm run db:migrate:create -- --name baseline
# Then manually mark it as applied in production
```

## 💰 Cost Optimization

### Free Tier Strategy (Recommended)

```yaml
Min Instances: 0 (scale to zero)
Max Instances: 10
Memory: 512Mi (minimum for gen2)
CPU: 1
```

**Cost**: $0-3/month for low-moderate traffic

### Add Health Check Pinger (Keep Warm)

```bash
# Create Cloud Scheduler job (free tier: 3 jobs)
gcloud scheduler jobs create http keep-warm-auth \
  --schedule="*/5 * * * *" \
  --uri="https://YOUR-SERVICE-URL/health" \
  --http-method=GET \
  --location=us-central1
```

**Result**: Near-zero cold starts while staying in free tier!

### Always-On (Small Cost)

```yaml
Min Instances: 1 (always ready)
Max Instances: 10
Memory: 512Mi
```

**Cost**: ~$10-15/month for instant responses

## 📊 Monitoring & Debugging

### View Logs

```bash
# Real-time logs
gcloud run services logs tail auth-server --region us-central1

# Read recent logs
gcloud run services logs read auth-server --region us-central1 --limit 50
```

### Test Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe auth-server \
  --region us-central1 \
  --format 'value(status.url)')

# Test health endpoint
curl $SERVICE_URL/health

# Test signup
curl -X POST $SERVICE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'
```

### Update Environment Variables

```bash
# Edit .env.prd with new values
nano .env.prd

# Redeploy with updated environment
./deploy.sh
```

## 🔒 Security Best Practices

1. **Never commit .env.prd** ✅ (already in .gitignore)
2. **Keep .env.prd secure** - Only on your local machine, never share
3. **Use strong JWT_SECRET** - Generate with `openssl rand -base64 32`
4. **Enable Cloud Armor** (optional, for DDoS protection)
5. **Use VPC Connector** (optional, for private Cloud SQL)
6. **Set up alerts** for unauthorized access attempts
7. **Rotate secrets regularly** - Update JWT_SECRET periodically

## 🚨 Troubleshooting

### Deployment Fails

```bash
# Check Cloud Build logs
gcloud builds list --limit 5

# View specific build
gcloud builds log [BUILD_ID]
```

### Migration Fails

```bash
# View logs to see migration error
gcloud run services logs read auth-server --region us-central1 --limit 100

# Common issues:
# - Database not accessible: Check DIRECT_URL secret
# - Migration already applied: Use `prisma migrate resolve`
# - Conflicting changes: May need to reset or fix manually
```

### Service Not Starting

```bash
# Check service details
gcloud run services describe auth-server --region us-central1

# Check logs for errors
gcloud run services logs read auth-server --region us-central1 --limit 100

# Common issues:
# - Missing .env.prd: Ensure file exists before deploying
# - Invalid DATABASE_URL: Check connection string format
# - Port mismatch: Ensure PORT is set to 8080 in .env.prd
# - Migration failed: Check DIRECT_URL in logs
```

### Cold Starts Too Slow

```bash
# Enable CPU boost (already in deploy.sh)
gcloud run services update auth-server \
  --cpu-boost \
  --region us-central1

# Or set min-instances=1 for always-on
gcloud run services update auth-server \
  --min-instances 1 \
  --region us-central1
```

## 🎯 CI/CD Setup (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Run
        run: gcloud builds submit --config cloudbuild.yaml
```

### Cloud Build Trigger

```bash
# Connect GitHub repo
gcloud beta builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## 📈 Scaling Configuration

Update scaling in `deploy.sh` or manually:

```bash
# Scale based on traffic
gcloud run services update auth-server \
  --min-instances 1 \
  --max-instances 100 \
  --concurrency 80 \
  --region us-central1
```

## 🎉 Quick Reference

```bash
# Deploy
./deploy.sh

# Setup secrets
./setup-secrets.sh

# View logs
gcloud run services logs tail auth-server --region us-central1

# Update service
gcloud run services update auth-server --region us-central1

# Delete service
gcloud run services delete auth-server --region us-central1

# List all services
gcloud run services list
```

## 💡 Pro Tips

1. **Use Supabase Free Tier** for database (500MB free)
2. **Enable startup CPU boost** for faster cold starts
3. **Set min-instances=0** to minimize costs
4. **Use Cloud Scheduler** to keep warm (free tier)
5. **Monitor with Cloud Logging** (free tier: 50 GB/month)
6. **Always test migrations locally** before deploying
7. **Keep migration files in git** for rollback capability

---

Need help? Check the logs first:

```bash
gcloud run services logs tail auth-server --region us-central1
```


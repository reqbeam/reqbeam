# 🚀 Quick Start - Deploy to Cloud Run in 5 Minutes

## Prerequisites

- Google Cloud account with billing enabled
- gcloud CLI installed: https://cloud.google.com/sdk/docs/install
- Your database credentials (Supabase or other PostgreSQL)

## Step-by-Step Deployment

### 1. Login to Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Setup Production Environment

```bash
# Create .env.prd file
./setup-env.sh
```

**Fill in these values in `.env.prd`:**

```bash
# Your database connection URL (with pooler for better performance)
DATABASE_URL="postgresql://postgres:password@host.supabase.co:6543/postgres?pgbouncer=true"

# Direct database connection (for migrations)
DIRECT_URL="postgresql://postgres:password@db.host.supabase.co:5432/postgres"

# Generate strong JWT secret
# Run: openssl rand -base64 32
JWT_SECRET="your-generated-secret-here"
```

### 3. Initialize Database Migrations (First Time Only)

If you already have data in your database:

```bash
# Create baseline migration
npm run db:migrate:dev -- --name init
```

### 4. Deploy!

```bash
./deploy.sh
```

The script will:
- ✅ Validate your configuration
- ✅ Build optimized Docker image  
- ✅ Run database migrations safely
- ✅ Deploy to Cloud Run
- ✅ Give you the service URL

### 5. Test Your Deployment

```bash
# Your service URL will be shown after deployment
# Test it:
curl https://your-service-url.run.app/health
```

## 🎉 Done!

Your auth server is now live at: `https://your-service-name-xxx.run.app`

Available endpoints:
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token
- `GET /health` - Health check

## 💰 Expected Cost

With default settings (scale to zero):
- **Free tier**: 2M requests/month FREE
- **After free tier**: ~$0-2/month for low-moderate traffic

## 🔄 Updating Your App

```bash
# Make code changes
# If schema changed, create migration:
npm run db:migrate:dev -- --name your_change_description

# Deploy
./deploy.sh
```

## ⚠️ Important Security Notes

1. **NEVER commit .env.prd to git** ✅ Already in .gitignore
2. Keep .env.prd file secure on your local machine only
3. Generate a strong JWT_SECRET: `openssl rand -base64 32`
4. Rotate secrets regularly (every 90 days)

## 🆘 Troubleshooting

**Deployment fails?**
```bash
# Check logs
gcloud run services logs tail auth-server --region us-central1
```

**Can't connect to database?**
- Verify DATABASE_URL and DIRECT_URL in .env.prd
- Check database allows connections from 0.0.0.0/0

**Need help?**
See detailed guide: [DEPLOYMENT.md](DEPLOYMENT.md)

## 📚 Next Steps

- Set up custom domain
- Configure CORS for your frontend
- Add monitoring/alerts
- Set up CI/CD with GitHub Actions

See [DEPLOYMENT.md](DEPLOYMENT.md) for advanced configuration.


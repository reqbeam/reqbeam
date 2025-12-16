# 🔒 Security Guidelines

## Environment Files Security

### ⚠️ CRITICAL: Never Commit .env.prd to Git

Your `.env.prd` file contains sensitive production credentials:
- Database passwords
- JWT secrets
- API keys

**Already Protected:**
- ✅ `.env.prd` is in `.gitignore`
- ✅ Docker excludes `.env.prd` from non-production builds
- ✅ Only included in production Docker image

### Verify Before Committing

Always check what you're committing:

```bash
# Check git status
git status

# If you see .env.prd listed, DO NOT COMMIT
# If accidentally staged:
git reset .env.prd

# Verify gitignore is working
git check-ignore .env.prd
# Should output: .env.prd
```

### If You Accidentally Committed .env.prd

**⚠️ IMMEDIATE ACTIONS:**

1. **Rotate ALL secrets immediately**
   ```bash
   # Generate new JWT secret
   openssl rand -base64 32
   
   # Update .env.prd with new values
   # Change database password if exposed
   ```

2. **Remove from git history**
   ```bash
   # Remove file from git (keeps local copy)
   git rm --cached .env.prd
   
   # Commit the removal
   git commit -m "Remove accidentally committed .env.prd"
   
   # For history cleanup (if pushed to GitHub)
   # Use git-filter-repo or BFG Repo-Cleaner
   ```

3. **If pushed to GitHub, consider repository private** or rotate all secrets

## Production Credentials Management

### Strong JWT Secret

```bash
# Generate strong random secret
openssl rand -base64 32

# Or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database Security

**For Supabase:**
- Use connection pooler (port 6543) for DATABASE_URL
- Use direct connection (port 5432) for DIRECT_URL
- Enable RLS (Row Level Security) in Supabase dashboard
- Restrict IP access if possible

**For Cloud SQL:**
- Use private IP if possible
- Enable SSL connections
- Set up automatic backups
- Use least privilege database user

### Secret Rotation Schedule

- **JWT_SECRET**: Every 90 days
- **Database Password**: Every 90 days
- **API Keys**: As needed or when team members leave

## Deployment Security Checklist

Before deploying:

- [ ] `.env.prd` exists and has correct values
- [ ] `.env.prd` is NOT in git (`git status` shows it untracked)
- [ ] JWT_SECRET is strong (32+ characters, random)
- [ ] Database URLs are correct
- [ ] No sensitive data in code comments
- [ ] No console.log with sensitive data
- [ ] CORS is properly configured

## Cloud Run Security

### Service Account Permissions

Create a custom service account with minimal permissions:

```bash
# Create service account
gcloud iam service-accounts create auth-server-sa \
  --display-name="Auth Server Service Account"

# Grant only required permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:auth-server-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Use in deployment
gcloud run services update auth-server \
  --service-account=auth-server-sa@PROJECT_ID.iam.gserviceaccount.com
```

### Network Security

```bash
# Restrict ingress to internal only (if using with internal services)
gcloud run services update auth-server \
  --ingress=internal-and-cloud-load-balancing

# Or allow all but use Cloud Armor for protection
gcloud run services update auth-server \
  --ingress=all
```

## Monitoring & Alerts

### Set Up Security Alerts

1. **Failed Authentication Attempts**
   - Log failed login attempts
   - Alert on > 10 failures from same IP in 5 minutes

2. **Unusual Traffic Patterns**
   - Monitor request rates
   - Alert on sudden spikes

3. **Database Access**
   - Monitor slow queries
   - Alert on connection pool exhaustion

### Logging Best Practices

```typescript
// Good - No sensitive data
console.log('User login attempt', { email: user.email });

// Bad - Exposes password
console.log('Login data', { email, password });

// Good - Generic error
console.error('Authentication failed', { reason: 'invalid_credentials' });

// Bad - Exposes internal details
console.error('Database error', { query: 'SELECT * FROM users WHERE...' });
```

## Regular Security Tasks

### Weekly
- [ ] Review Cloud Run logs for suspicious activity
- [ ] Check error rates in monitoring

### Monthly
- [ ] Review IAM permissions
- [ ] Update dependencies (`npm audit`)
- [ ] Check for security patches

### Quarterly
- [ ] Rotate JWT_SECRET
- [ ] Rotate database credentials
- [ ] Security audit of code
- [ ] Review access logs

## Incident Response

If security breach suspected:

1. **Immediate**: Rotate all secrets
2. **Assess**: Check logs for unauthorized access
3. **Contain**: Disable compromised accounts
4. **Investigate**: Determine scope of breach
5. **Notify**: Inform affected users if data exposed
6. **Remediate**: Fix vulnerability
7. **Monitor**: Watch for further attempts

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)


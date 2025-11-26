# Supabase Database Setup for Auth Server

This guide explains how to set up Supabase PostgreSQL database for the auth server.

## Prerequisites

1. A Supabase account ([Sign up here](https://supabase.com))
2. A Supabase project created

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **New Project**
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait for project to be provisioned (2-3 minutes)

## Step 2: Get Database Connection String

1. In your Supabase project, go to **Settings** > **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Add `?schema=public` at the end:
   ```
   postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres?schema=public
   ```

## Step 3: Configure Auth Server

1. Navigate to auth-server directory:
   ```bash
   cd oss-main/auth-server
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres?schema=public"
   JWT_SECRET="your-jwt-secret-key-here"
   PORT=4000
   MAIN_APP_URL="http://localhost:3000"
   ```

## Step 4: Generate Prisma Client

```bash
npm run db:generate
```

## Step 5: Push Schema to Supabase

```bash
npm run db:push
```

This will create all the tables in your Supabase database.

## Step 6: Verify Setup

1. Go to Supabase Dashboard > **Table Editor**
2. You should see the `users` table and other tables
3. Or use Prisma Studio:
   ```bash
   npm run db:studio
   ```

## Connection String Format

The Supabase connection string format is:
```
postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?schema=public
```

Where:
- `[PASSWORD]` - Your database password (set when creating project)
- `[PROJECT-REF]` - Your project reference (found in project settings)

## Security Notes

- **Never commit** `.env` file with real credentials
- Use different Supabase projects for development and production
- Keep your database password secure
- Use connection pooling for production (Supabase provides this)

## Connection Pooling (Optional)

For production, Supabase recommends using connection pooling:

1. Go to **Settings** > **Database**
2. Use the **Connection pooling** connection string instead
3. It uses port `6543` instead of `5432`
4. Format: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true`

## Troubleshooting

### Connection Refused
- Check your Supabase project is active
- Verify the connection string is correct
- Check if your IP is allowed (Supabase allows all by default)

### Authentication Failed
- Verify your database password is correct
- Make sure you replaced `[YOUR-PASSWORD]` in the connection string

### Schema Push Fails
- Check you have proper permissions
- Verify the connection string includes `?schema=public`
- Try using connection pooling string

### Tables Not Created
- Run `npm run db:push` again
- Check Supabase Dashboard > Table Editor
- Verify Prisma schema is correct

## Next Steps

After setting up Supabase:
1. Test the auth server: `npm run dev`
2. Try creating a user via signup
3. Verify user appears in Supabase Table Editor
4. Test login functionality


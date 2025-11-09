# Auth Server Setup Guide

## Quick Start

1. **Navigate to the auth-server directory:**
```bash
cd auth-server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Copy the example file (if .env doesn't exist)
cp .env.example .env

# Edit .env file with your Supabase credentials:
DATABASE_URL="postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres?schema=public"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=4000
MAIN_APP_URL="http://localhost:3000"
```

**Getting Supabase Connection String:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create a new one)
3. Go to **Settings** > **Database**
4. Copy the **Connection string** (URI format)
5. Replace `[YOUR-PASSWORD]` with your database password

4. **Generate Prisma Client:**
```bash
npm run db:generate
```

5. **Push schema to Supabase database:**
```bash
npm run db:push
```

This will create all tables in your Supabase PostgreSQL database.

**Note:** Make sure your Supabase project is created and the connection string is correct.

6. **Start the server:**
```bash
npm run dev
```

The auth server will start on `http://localhost:4000`

7. **(Optional) Open Prisma Studio:**
```bash
npm run db:studio
```

This will open a web interface at `http://localhost:5555` where you can view and edit your database.

## Database Configuration

The auth server uses **Supabase PostgreSQL** database. Make sure:

1. You have a Supabase account and project created
2. The `DATABASE_URL` in `.env` points to your Supabase database
3. Format: `postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?schema=public`
4. Get your connection string from Supabase Dashboard > Settings > Database

**Supabase Setup:**
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** > **Database**
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

## Environment Variables

| Variable | Description | Default |
|----------|-----------|---------|
| `DATABASE_URL` | Database connection string | Required |
| `JWT_SECRET` | Secret key for JWT token signing | Required |
| `PORT` | Server port | 4000 |
| `MAIN_APP_URL` | Main application URL for user sync | http://localhost:3000 |

## Running in Production

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## Testing the Server

### Health Check
```bash
curl http://localhost:4000/health
```

### Signup
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123!"}'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
```

### Verify Token
```bash
curl http://localhost:4000/api/auth/verify \
  -H "Authorization: Bearer <your-token>"
```


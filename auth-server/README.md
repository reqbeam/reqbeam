# Auth Server

Authentication server running on port 4000 for the OSS application.

## Features

- User signup with password validation
- User login with JWT token generation
- Token verification endpoint
- Uses the same database as the main application

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
# Supabase PostgreSQL connection string
DATABASE_URL="postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=4000
MAIN_APP_URL="http://localhost:3000"
```

**Getting Supabase Connection String:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** > **Database**
4. Copy the **Connection string** under "Connection string" section
5. Replace `[YOUR-PASSWORD]` with your database password

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push schema to Supabase database:
```bash
npm run db:push
```

**Note:** This will create all tables in your Supabase database.

6. Run the server:
```bash
npm run dev
```

The server will start on `http://localhost:4000`

7. (Optional) Open Prisma Studio to view/edit database:
```bash
npm run db:studio
```

This will open a web interface at `http://localhost:5555` where you can view and edit your database.

## API Endpoints

### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "expiresAt": "2024-01-08T12:00:00.000Z"
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "expiresAt": "2024-01-08T12:00:00.000Z"
}
```

### GET /api/auth/verify
Verify a JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user-id",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Auth server is running"
}
```

## Token Usage

The JWT token should be included in the `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens expire after 7 days.




# Authentication Server Integration

This document describes the dual authentication system available in the application.

## Authentication Options

### Option 1: Direct Database Authentication (Original)

The original authentication endpoints that use direct database access:

- **Login:** `POST /api/auth/login`
- **Signup:** `POST /api/auth/signup`

These endpoints:
- Use Prisma to access the database directly
- Return a simple base64 token
- Used by NextAuth for web UI authentication
- **This is the default authentication method**

### Option 2: Auth Server Authentication (New)

New authentication endpoints that use the auth server on port 4000:

- **Login:** `POST /api/auth/server/login`
- **Signup:** `POST /api/auth/server/signup`
- **Verify Token:** `GET /api/auth/server/verify`

These endpoints:
- Call the auth server on port 4000
- Return JWT tokens (more secure)
- Can be used for API authentication, CLI tools, or external services
- **This is an additional authentication option**

## Usage Examples

### Using Direct Database Authentication (Original)

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// Signup
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password }),
});
```

### Using Auth Server Authentication (New)

```typescript
// Login - Returns JWT token
const response = await fetch('/api/auth/server/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { token, user, expiresAt } = await response.json();

// Signup - Returns JWT token
const response = await fetch('/api/auth/server/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password }),
});

const { token, user, expiresAt } = await response.json();

// Verify Token
const response = await fetch('/api/auth/server/verify', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
});

const { valid, user } = await response.json();
```

## Response Formats

### Direct Database Authentication Response

**Login:**
```json
{
  "token": "base64-encoded-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "expiresAt": "2024-01-08T12:00:00.000Z"
}
```

**Signup:**
```json
{
  "message": "User created successfully"
}
```

### Auth Server Authentication Response

**Login:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "expiresAt": "2024-01-08T12:00:00.000Z"
}
```

**Signup:**
```json
{
  "message": "User created successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "expiresAt": "2024-01-08T12:00:00.000Z"
}
```

**Verify:**
```json
{
  "valid": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## When to Use Which

### Use Direct Database Authentication (`/api/auth/login`, `/api/auth/signup`) when:
- Building web UI components
- Using NextAuth for session management
- You need simple, fast authentication
- You're already using the existing system

### Use Auth Server Authentication (`/api/auth/server/*`) when:
- Building API clients or CLI tools
- You need JWT tokens for stateless authentication
- You want to verify tokens independently
- You're building external integrations
- You need more secure token-based authentication

## Environment Variables

Make sure to set the auth server URL in your `.env`:

```env
AUTH_SERVER_URL="http://localhost:4000"
```

## Starting the Auth Server

The auth server must be running for the `/api/auth/server/*` endpoints to work:

```bash
cd auth-server
npm install
npm run db:generate
npm run dev
```

The auth server will start on `http://localhost:4000`.

## Notes

- Both authentication methods use the **same database** and **same users table**
- Users created with one method can login with the other
- The auth server provides JWT tokens which are more secure than base64 tokens
- The original endpoints remain unchanged and continue to work as before


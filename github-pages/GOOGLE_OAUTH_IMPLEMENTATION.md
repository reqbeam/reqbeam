# Google OAuth Implementation Summary

Google OAuth has been successfully implemented for both login and signup in the application.

## What Was Implemented

### 1. NextAuth Google Provider
- Added Google OAuth provider to NextAuth configuration
- Handles OAuth sign-in and automatically creates users if they don't exist
- Syncs OAuth users to auth server database

### 2. OAuth Endpoints

**Main App:**
- `/api/auth/oauth/signup` - Creates OAuth users in main database
- `/api/auth/oauth/callback` - Handles OAuth callback and gets JWT token from auth server

**Auth Server:**
- `/api/auth/oauth/signup` - Creates OAuth users in auth server database
- `/api/auth/oauth/login` - Gets JWT token for OAuth users

### 3. UI Updates
- Added "Sign in with Google" button to signin page
- Added "Sign up with Google" button to signup page
- Google OAuth buttons with proper styling and icons

### 4. Database Schema Updates
- Updated `password` field to be optional (`String?`) to support OAuth users
- OAuth users have `null` password (they don't need passwords)

### 5. Token Storage
- OAuth users get JWT tokens from auth server
- Tokens are automatically stored in localStorage after OAuth login
- `OAuthCallbackHandler` component handles token storage

## Setup Instructions

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing one
3. Enable Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Configure OAuth consent screen (if not done)
6. Create OAuth client:
   - Type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

### 2. Update Environment Variables

Add to `.env`:
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Update Database Schema

Run Prisma migrations to update the schema:

```bash
# From main app directory
npm run db:push

# From auth-server directory
cd auth-server
npm run db:push
```

### 4. Start Servers

```bash
# Terminal 1 - Main app
cd oss-main
npm run dev

# Terminal 2 - Auth server
cd oss-main/auth-server
npm run dev
```

## How It Works

### OAuth Login Flow

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. User authorizes → Google redirects to `/api/auth/callback/google`
4. NextAuth processes OAuth and creates/updates user
5. User redirected to `/api/auth/oauth/callback`
6. Custom handler gets JWT token from auth server
7. Token passed to home page via query params
8. `OAuthCallbackHandler` stores token in localStorage
9. User logged in with both NextAuth session and JWT token

### OAuth Signup Flow

Same as login - if user doesn't exist, account is automatically created.

## Features

✅ Google OAuth login  
✅ Google OAuth signup (automatic account creation)  
✅ JWT token stored in localStorage  
✅ User data synced to both databases  
✅ NextAuth session maintained  
✅ OAuth users can't login with password (proper error message)  
✅ Password field is optional in database schema  

## Important Notes

1. **Database Migration Required**: You must run `npm run db:push` to update the schema (password field is now optional)

2. **OAuth Users**: Users created via Google OAuth have `null` password and cannot login with email/password

3. **Token Storage**: JWT tokens from auth server are stored in localStorage with key `authToken`

4. **Redirect URI**: Make sure your Google OAuth redirect URI matches exactly:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

## Testing

1. Go to `http://localhost:3000/auth/signin`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Check browser localStorage for `authToken`
5. Verify user exists in database (password should be null)

## Troubleshooting

### "redirect_uri_mismatch" Error
- Check Google Cloud Console redirect URI matches exactly
- Must include protocol (http/https) and port

### Token Not Stored
- Check browser console for errors
- Verify auth server is running on port 4000
- Check `/api/auth/oauth/callback` route is accessible

### User Creation Fails
- Run database migrations: `npm run db:push`
- Check Prisma schema has `password String?` (optional)



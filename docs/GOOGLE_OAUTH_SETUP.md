# Google OAuth Setup Guide

This guide will help you set up Google OAuth for login and signup in the application.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (for testing) or **Internal** (for Google Workspace)
   - Fill in the required information:
     - App name
     - User support email
     - Developer contact information
   - Add scopes: `email`, `profile`
   - Add test users (if using External)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: Your app name
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Step 3: Test Google OAuth

1. Start your development servers:
   ```bash
   # Terminal 1 - Main app
   cd oss-main
   npm run dev

   # Terminal 2 - Auth server
   cd oss-main/auth-server
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`
3. Click **"Sign in with Google"**
4. Complete the Google OAuth flow
5. The JWT token will be automatically stored in localStorage

## How It Works

### Login Flow

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. User authorizes the application
4. Google redirects back to `/api/auth/callback/google` (NextAuth)
5. NextAuth creates/updates user in database
6. User is redirected to `/api/auth/oauth/callback` (custom handler)
7. Custom handler gets JWT token from auth server
8. Token is passed to home page via query params
9. `OAuthCallbackHandler` component stores token in localStorage
10. User is logged in with both NextAuth session and JWT token

### Signup Flow

The signup flow is identical to login - if the user doesn't exist, they are automatically created.

## Features

- ✅ Google OAuth login
- ✅ Google OAuth signup (automatic account creation)
- ✅ JWT token stored in localStorage
- ✅ User data synced to both databases
- ✅ NextAuth session maintained for backward compatibility

## Troubleshooting

### "Error: redirect_uri_mismatch"

Make sure your redirect URI in Google Cloud Console exactly matches:
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://yourdomain.com/api/auth/callback/google`

### "OAuth consent screen not configured"

Complete the OAuth consent screen configuration in Google Cloud Console.

### Token not stored in localStorage

Check browser console for errors. Make sure:
- Auth server is running on port 4000
- `/api/auth/oauth/callback` route is accessible
- `OAuthCallbackHandler` component is loaded on home page

## Security Notes

- Never commit `.env` file with real credentials
- Use different OAuth credentials for development and production
- Regularly rotate your OAuth client secrets
- Keep your Google Cloud Console secure



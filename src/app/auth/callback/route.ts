import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma, UserService } from '@reqbeam/db';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
// Desktop app clients have a client_secret that's public (meant to be embedded)
// This is different from Web app secrets which must be kept confidential
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/auth/callback';
// Use MAIN_APP_URL or NEXTAUTH_URL to ensure correct hostname (especially in Docker where request.url may contain 0.0.0.0)
const MAIN_APP_URL = process.env.MAIN_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Get the base URL for redirects, normalizing 0.0.0.0 to localhost
 * This is important when running in Docker where the server binds to 0.0.0.0
 */
function getBaseUrl(requestUrl?: string): string {
  // Prefer environment variable (set in docker-compose.yml)
  // MAIN_APP_URL is already set with a fallback, so use it directly
  // This ensures we use localhost instead of 0.0.0.0 when running in Docker
  return MAIN_APP_URL;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

/**
 * Decode JWT token (simple base64 decode, no verification for id_token from Google)
 * In production, you should verify the token signature
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Get base URL for redirects (normalizes 0.0.0.0 to localhost)
    const baseUrl = getBaseUrl(request.url);

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error)}`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=no_code', baseUrl)
      );
    }

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=config_error', baseUrl)
      );
    }

    // Get code_verifier from cookie
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('pkce_code_verifier')?.value;

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=missing_verifier', baseUrl)
      );
    }

    // Exchange code for tokens using PKCE
    // Note: Google's Desktop app clients still require client_secret (it's public, not secret)
    // This is a Google OAuth limitation, not a PKCE requirement
    const tokenParams = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      code_verifier: codeVerifier,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    // Desktop app clients have a public client_secret (meant to be embedded)
    // This is different from Web app secrets which must be kept confidential
    if (GOOGLE_CLIENT_SECRET) {
      tokenParams.append('client_secret', GOOGLE_CLIENT_SECRET);
    } else {
      console.warn(
        '⚠️  GOOGLE_CLIENT_SECRET not set. Desktop app clients require a client_secret.\n' +
        'Get it from Google Cloud Console > Your Desktop app OAuth client > Client secret'
      );
    }

    // Log for debugging
    console.log('Token exchange request (Desktop app - no secret):', {
      client_id: GOOGLE_CLIENT_ID?.substring(0, 30) + '...',
      redirect_uri: REDIRECT_URI,
      has_code_verifier: !!codeVerifier,
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Token exchange failed:', errorData);
      
      // Provide more specific error messages
      let errorMessage = 'token_exchange_failed';
      if (errorData.error === 'invalid_request' && errorData.error_description?.includes('client_secret')) {
        errorMessage = 'pkce_config_error';
        console.error(
          '⚠️  Google OAuth Limitation: Even Desktop app clients require client_secret.\n' +
          'This is a known limitation of Google\'s OAuth implementation.\n\n' +
          'SOLUTION: Desktop app clients DO have a client_secret (it\'s public, not secret).\n' +
          '1. Go to Google Cloud Console > APIs & Services > Credentials\n' +
          '2. Click on your Desktop app OAuth client\n' +
          '3. You\'ll see a "Client secret" field - copy it\n' +
          '4. Add it to your .env.local as: GOOGLE_CLIENT_SECRET="your-desktop-app-secret"\n' +
          '5. Restart your dev server\n\n' +
          'Note: For Desktop apps, the client_secret is considered "public" and can be embedded.\n' +
          'This is different from Web app secrets which must be kept confidential.\n' +
          'Current Client ID: ' + GOOGLE_CLIENT_ID?.substring(0, 30) + '...'
        );
      }
      
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${errorMessage}`, baseUrl)
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Decode id_token to get user info
    const userInfo: GoogleUserInfo = decodeJWT(tokens.id_token);

    if (!userInfo || !userInfo.email) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=invalid_token', baseUrl)
      );
    }

    // Create or update user in database
    const userService = new UserService(prisma);
    let user = await userService.getUserByEmail(userInfo.email);

    if (!user) {
      // Create new user
      user = await userService.createUser({
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split('@')[0],
        password: null, // OAuth users don't have passwords
      });
    }

    // Clear the code_verifier cookie
    cookieStore.delete('pkce_code_verifier');

    // Create a simple session token (in production, use JWT or similar)
    const sessionToken = Buffer.from(
      `${user.id}:${Date.now()}:${userInfo.email}`
    ).toString('base64url');

    // Set session cookie
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Store user info in a separate cookie for client-side access (optional)
    cookieStore.set('user_info', JSON.stringify({
      id: user.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    }), {
      httpOnly: false, // Accessible from client for display
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    console.log('✅ OAuth sign-in successful:', {
      userId: user.id,
      email: userInfo.email,
      sessionTokenSet: !!sessionToken,
    });

    // Redirect to homepage after successful OAuth sign-in
    // Use baseUrl (from environment or normalized) to ensure correct hostname
    const homeUrl = new URL('/', baseUrl);
    return NextResponse.redirect(homeUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    // Get base URL for error redirect as well
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(
      new URL('/auth/signin?error=callback_error', baseUrl)
    );
  }
}


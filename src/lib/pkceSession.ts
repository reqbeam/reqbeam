import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma, UserService } from '@reqbeam/db';

/**
 * Verify PKCE session from cookie
 * Returns user info if session is valid, null otherwise
 */
export async function verifyPKCESession(
  request?: NextRequest
): Promise<{ id: string; email: string; name: string | null } | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      // Debug: Log that no session token was found
      console.log('[PKCE Session] No session_token cookie found');
      return null;
    }

    // Decode session token (format: userId:timestamp:email)
    const decoded = Buffer.from(sessionToken, 'base64url').toString('utf-8');
    const [userId, timestamp] = decoded.split(':');

    if (!userId || !timestamp) {
      return null;
    }

    // Verify user exists
    const userService = new UserService(prisma);
    const user = await userService.getUserById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}


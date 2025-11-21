import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from '@postmind/db';
import { verifyPKCESession } from './pkceSession';

/**
 * Unified authentication helper for API routes
 * Supports:
 * - Session-based auth (NextAuth for web UI)
 * - PKCE session cookies (for OAuth PKCE login)
 * - Token-based auth (Bearer tokens for CLI)
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<{ id: string; email: string; name: string | null } | null> {
  // Try session-based auth first (for web UI with NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null
    };
  }

  // Try PKCE session cookies (for OAuth PKCE login)
  const pkceUser = await verifyPKCESession(request);
  if (pkceUser) {
    return pkceUser;
  }

  // Try token-based auth (for CLI)
  if (request) {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Decode the token (format: base64(userId:timestamp))
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, timestamp] = decoded.split(':');
        
        // Check if token is expired (7 days)
        const tokenDate = new Date(parseInt(timestamp));
        const expiryDate = new Date(tokenDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        if (expiryDate < new Date()) {
          return null; // Token expired
        }
        
        // Verify user exists
        const { UserService } = await import('@postmind/db');
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
        console.error('Token validation error:', error);
        return null;
      }
    }
  }

  return null;
}


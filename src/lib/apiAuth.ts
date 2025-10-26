import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

/**
 * Unified authentication helper for API routes
 * Supports both:
 * - Session-based auth (NextAuth for web UI)
 * - Token-based auth (Bearer tokens for CLI)
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<{ id: string; email: string; name: string | null } | null> {
  // Try session-based auth first (for web UI)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null
    };
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
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true }
        });
        
        return user;
      } catch (error) {
        console.error('Token validation error:', error);
        return null;
      }
    }
  }

  return null;
}


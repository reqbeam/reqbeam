/**
 * @deprecated This file is deprecated. Use `prisma` from `@postmind/db` instead.
 * 
 * This file is kept for backward compatibility but will be removed in a future version.
 * 
 * Migration guide:
 * - Old: import { prisma } from '@/lib/prisma'
 * - New: import { prisma } from '@postmind/db'
 * 
 * All routes have been migrated to use the shared @postmind/db package.
 */

// Re-export from @postmind/db for backward compatibility
export { prisma } from '@postmind/db';

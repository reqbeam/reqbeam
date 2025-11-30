/**
 * @deprecated This file is deprecated. Use `prisma` from `@reqbeam/db` instead.
 * 
 * This file is kept for backward compatibility but will be removed in a future version.
 * 
 * Migration guide:
 * - Old: import { prisma } from '@/lib/prisma'
 * - New: import { prisma } from '@reqbeam/db'
 * 
 * All routes have been migrated to use the shared @reqbeam/db package.
 */

// Re-export from @reqbeam/db for backward compatibility
export { prisma } from '@reqbeam/db';

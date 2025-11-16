import { PrismaClient } from '@prisma/client'

/**
 * Centralized Prisma Client instance
 * This is the ONLY place where database connection is initialized
 * All other parts of the application (CLI, Web, etc.) should import from here
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Initialize Prisma Client with proper error handling
 * DATABASE_URL must be set in environment variables
 */
function createPrismaClient(): PrismaClient {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please set DATABASE_URL in your .env file or environment variables. ' +
      'Example: DATABASE_URL="file:./prisma/dev.db" for SQLite or ' +
      'DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public" for PostgreSQL'
    )
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Prevent multiple instances in development (Next.js hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}


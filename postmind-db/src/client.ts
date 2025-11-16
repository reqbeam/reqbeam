import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Shared Prisma client instance
 * This ensures we use a single instance across the application
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Initialize Prisma client with custom database URL
 * Useful for CLI when connecting to remote database
 */
export function initializePrisma(databaseUrl?: string): PrismaClient {
  if (databaseUrl) {
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  return prisma;
}


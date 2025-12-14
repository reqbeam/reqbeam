import cuid from "cuid";

/**
 * Generate a CUID (Collision-resistant Unique Identifier)
 * Used for database IDs to match Prisma schema
 */
export function generateId(): string {
  return cuid();
}


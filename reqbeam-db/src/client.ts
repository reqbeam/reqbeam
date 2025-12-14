import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Get VS Code global storage path based on the platform
 * @param extensionId - The extension ID (e.g., 'reqbeam.reqbeam')
 * @returns The path to the VS Code global storage directory
 */
export function getVSCodeGlobalStoragePath(extensionId: string = 'reqbeam.reqbeam'): string {
  const platform = os.platform();
  const homeDir = os.homedir();

  let basePath: string;

  switch (platform) {
    case 'win32':
      // Windows: %APPDATA%\Code\User\globalStorage\<extensionId>
      basePath = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      return path.join(basePath, 'Code', 'User', 'globalStorage', extensionId);
    
    case 'darwin':
      // macOS: ~/Library/Application Support/Code/User/globalStorage/<extensionId>
      return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', extensionId);
    
    case 'linux':
      // Linux: ~/.config/Code/User/globalStorage/<extensionId>
      return path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', extensionId);
    
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get the database file path for VS Code extension
 * @param extensionId - The extension ID (e.g., 'reqbeam.reqbeam')
 * @param dbFileName - The database file name (default: 'reqbeam.db')
 * @returns The full path to the database file
 */
export function getVSCodeExtensionDbPath(
  extensionId: string = 'reqbeam.reqbeam',
  dbFileName: string = 'reqbeam.db'
): string {
  const storagePath = getVSCodeGlobalStoragePath(extensionId);
  return path.join(storagePath, dbFileName);
}

/**
 * Get VS Code extension database URL as a string (for use in DATABASE_URL env var)
 * @param extensionId - The extension ID (e.g., 'reqbeam.reqbeam')
 * @param dbFileName - The database file name (default: 'reqbeam.db')
 * @returns The database URL string in Prisma format (file:/path/to/db)
 */
export function getVSCodeExtensionDbUrl(
  extensionId: string = 'reqbeam.reqbeam',
  dbFileName: string = 'reqbeam.db'
): string {
  const dbPath = getVSCodeExtensionDbPath(extensionId, dbFileName);
  // Convert path to file: URL format for Prisma SQLite
  const normalizedPath = dbPath.replace(/\\/g, '/');
  return `file:${normalizedPath}`;
}

/**
 * Get the database URL to use
 * Checks for USE_VSCODE_EXTENSION_DB flag or falls back to DATABASE_URL
 */
function getDatabaseUrl(): string | undefined {
  // Check if we should use VS Code extension database
  const useVSCodeDb = process.env.USE_VSCODE_EXTENSION_DB === 'true' || 
                      process.env.USE_VSCODE_EXTENSION_DB === '1';
  
  if (useVSCodeDb) {
    const extensionId = process.env.VSCODE_EXTENSION_ID || 'reqbeam.reqbeam';
    const dbFileName = process.env.VSCODE_DB_FILE_NAME || 'reqbeam.db';
    return getVSCodeExtensionDbUrl(extensionId, dbFileName);
  }
  
  // Use DATABASE_URL from environment, or undefined to use default Prisma config
  return process.env.DATABASE_URL;
}

/**
 * Shared Prisma client instance
 * This ensures we use a single instance across the application
 * Automatically uses VS Code extension database if USE_VSCODE_EXTENSION_DB is set
 */
const databaseUrl = getDatabaseUrl();
export const prisma = globalForPrisma.prisma ?? (
  databaseUrl 
    ? new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      })
    : new PrismaClient()
);

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


/**
 * Check if the VS Code extension database file exists
 * @param extensionId - The extension ID (e.g., 'reqbeam.reqbeam')
 * @param dbFileName - The database file name (default: 'reqbeam.db')
 * @returns True if the database file exists, false otherwise
 */
export function vscodeExtensionDbExists(
  extensionId: string = 'reqbeam.reqbeam',
  dbFileName: string = 'reqbeam.db'
): boolean {
  const dbPath = getVSCodeExtensionDbPath(extensionId, dbFileName);
  return fs.existsSync(dbPath);
}

/**
 * Initialize Prisma client connected to VS Code extension database
 * @param extensionId - The extension ID (e.g., 'reqbeam.reqbeam')
 * @param dbFileName - The database file name (default: 'reqbeam.db')
 * @returns Prisma client instance connected to the VS Code extension database
 */
export function initializeVSCodeExtensionPrisma(
  extensionId: string = 'reqbeam.reqbeam',
  dbFileName: string = 'reqbeam.db'
): PrismaClient {
  const dbPath = getVSCodeExtensionDbPath(extensionId, dbFileName);
  
  // Ensure the directory exists
  const storagePath = getVSCodeGlobalStoragePath(extensionId);
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  // Convert path to file: URL format for Prisma SQLite
  // Prisma accepts: file:/absolute/path or file:./relative/path
  // Normalize path separators to forward slashes
  const normalizedPath = dbPath.replace(/\\/g, '/');
  const databaseUrl = `file:${normalizedPath}`;

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}


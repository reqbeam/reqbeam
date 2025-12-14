import { PrismaClient } from '@prisma/client';
import { 
  initializePrisma, 
  initializeVSCodeExtensionPrisma,
  getVSCodeExtensionDbPath,
  vscodeExtensionDbExists
} from '@reqbeam/db';
import { AuthManager } from './auth.js';
import chalk from 'chalk';

/**
 * Database connection manager for CLI
 * Handles database connection using DATABASE_URL from auth config or environment
 * Also supports connecting to VS Code extension database
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient | null = null;
  private vscodeExtensionPrisma: PrismaClient | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get Prisma client instance
   * Connects to database using DATABASE_URL from environment variable
   * For SQLite: file:./prisma/dev.db
   * For PostgreSQL: postgresql://user:password@host:port/database
   */
  public async getPrisma(): Promise<PrismaClient> {
    if (this.prisma) {
      return this.prisma;
    }

    // Get DATABASE_URL from environment variable
    // This should be the same database that the web app uses
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL not found. Please set it in your environment.\n' +
        'For SQLite: export DATABASE_URL="file:./prisma/dev.db"\n' +
        'For PostgreSQL: export DATABASE_URL="postgresql://user:password@host:port/database"\n' +
        'Note: The CLI must connect to the same database as the web application.'
      );
    }

    try {
      this.prisma = initializePrisma(databaseUrl);
      return this.prisma;
    } catch (error: any) {
      console.error(chalk.red('Error connecting to database:'), error.message);
      throw new Error('Failed to connect to database. Please check your DATABASE_URL.');
    }
  }

  /**
   * Get Prisma client instance connected to VS Code extension database
   * @param extensionId - The extension ID (default: 'reqbeam.reqbeam')
   * @param dbFileName - The database file name (default: 'reqbeam.db')
   * @returns Prisma client instance connected to VS Code extension database
   */
  public getVSCodeExtensionPrisma(
    extensionId: string = 'reqbeam.reqbeam',
    dbFileName: string = 'reqbeam.db'
  ): PrismaClient {
    if (this.vscodeExtensionPrisma) {
      return this.vscodeExtensionPrisma;
    }

    try {
      const dbPath = getVSCodeExtensionDbPath(extensionId, dbFileName);
      
      if (!vscodeExtensionDbExists(extensionId, dbFileName)) {
        console.warn(
          chalk.yellow(`VS Code extension database not found at: ${dbPath}\n` +
          'The database will be created when the extension is first used.')
        );
      }

      this.vscodeExtensionPrisma = initializeVSCodeExtensionPrisma(extensionId, dbFileName);
      return this.vscodeExtensionPrisma;
    } catch (error: any) {
      console.error(chalk.red('Error connecting to VS Code extension database:'), error.message);
      throw new Error('Failed to connect to VS Code extension database.');
    }
  }

  /**
   * Get current authenticated user ID
   */
  public async getCurrentUserId(): Promise<string> {
    const authManager = AuthManager.getInstance();
    const user = await authManager.getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated. Please run "reqbeam auth login" first.');
    }

    return user.id;
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
    if (this.vscodeExtensionPrisma) {
      await this.vscodeExtensionPrisma.$disconnect();
      this.vscodeExtensionPrisma = null;
    }
  }
}


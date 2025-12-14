import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { generateId } from "../utils/cuid";

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initDatabase(
  context: vscode.ExtensionContext
): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (dbInstance) {
    return dbInstance;
  }

  const storagePath = context.globalStorageUri.fsPath;
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  const dbPath = path.join(storagePath, "reqbeam.db");

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Check if we need to migrate from old schema (INTEGER IDs) to new schema (TEXT IDs)
  const needsMigration = await checkIfNeedsMigration(dbInstance);

  if (needsMigration) {
    // Run migration from INTEGER IDs to TEXT IDs
    await migrateToNewSchema(dbInstance);
  }

  // Create tables matching Prisma schema exactly (using @@map table names)
  await dbInstance.exec(`
    -- Users table (mapped from User model)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      name TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Workspaces table (mapped from Workspace model)
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      ownerId TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Workspace Members table (mapped from WorkspaceMember model)
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(workspaceId, userId)
    );

    -- Collections table (mapped from Collection model)
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      userId TEXT NOT NULL,
      workspaceId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Requests table (mapped from Request model)
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT,
      body TEXT,
      bodyType TEXT,
      auth TEXT,
      collectionId TEXT,
      userId TEXT NOT NULL,
      workspaceId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE SET NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Request Histories table (mapped from RequestHistory model)
    CREATE TABLE IF NOT EXISTS request_histories (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL,
      workspaceId TEXT,
      statusCode INTEGER,
      response TEXT,
      headers TEXT,
      duration INTEGER,
      size INTEGER,
      error TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (requestId) REFERENCES requests(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Environments table (mapped from Environment model)
    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variables TEXT NOT NULL DEFAULT '{}',
      userId TEXT NOT NULL,
      workspaceId TEXT,
      isActive INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Tabs table (mapped from Tab model)
    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT,
      body TEXT,
      bodyType TEXT,
      userId TEXT NOT NULL,
      workspaceId TEXT,
      isActive INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- API History table (mapped from ApiHistory model)
    CREATE TABLE IF NOT EXISTS api_history (
      id TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      statusCode INTEGER,
      source TEXT NOT NULL,
      duration INTEGER,
      error TEXT,
      userId TEXT,
      workspaceId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Mock Servers table (mapped from MockServer model)
    CREATE TABLE IF NOT EXISTS mock_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      baseUrl TEXT,
      collectionId TEXT,
      userId TEXT NOT NULL,
      workspaceId TEXT,
      isRunning INTEGER NOT NULL DEFAULT 0,
      responseDelay INTEGER NOT NULL DEFAULT 0,
      defaultStatusCode INTEGER NOT NULL DEFAULT 200,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE SET NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Mock Endpoints table (mapped from MockEndpoint model)
    CREATE TABLE IF NOT EXISTS mock_endpoints (
      id TEXT PRIMARY KEY,
      mockServerId TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      response TEXT,
      statusCode INTEGER NOT NULL DEFAULT 200,
      headers TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mockServerId) REFERENCES mock_servers(id) ON DELETE CASCADE
    );

    -- Request Params table (extension-specific, not in Prisma schema but needed for extension)
    CREATE TABLE IF NOT EXISTS request_params (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (requestId) REFERENCES requests(id) ON DELETE CASCADE,
      UNIQUE(requestId, key)
    );

    -- Request Auth table (extension-specific, not in Prisma schema but needed for extension)
    CREATE TABLE IF NOT EXISTS request_auth (
      id TEXT PRIMARY KEY,
      requestId TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'none',
      key TEXT,
      value TEXT,
      username TEXT,
      password TEXT,
      in_location TEXT,
      headerName TEXT,
      headerValue TEXT,
      FOREIGN KEY (requestId) REFERENCES requests(id) ON DELETE CASCADE
    );
  `);

  // Create indexes matching Prisma schema
  await dbInstance.exec(`
    -- ApiHistory indexes (from Prisma @@index)
    CREATE INDEX IF NOT EXISTS idx_api_history_createdAt ON api_history(createdAt);
    CREATE INDEX IF NOT EXISTS idx_api_history_source ON api_history(source);
    CREATE INDEX IF NOT EXISTS idx_api_history_workspaceId ON api_history(workspaceId);
    CREATE INDEX IF NOT EXISTS idx_api_history_userId ON api_history(userId);
    
    -- MockServer indexes (from Prisma @@index)
    CREATE INDEX IF NOT EXISTS idx_mock_servers_userId ON mock_servers(userId);
    CREATE INDEX IF NOT EXISTS idx_mock_servers_workspaceId ON mock_servers(workspaceId);
    CREATE INDEX IF NOT EXISTS idx_mock_servers_collectionId ON mock_servers(collectionId);
    
    -- MockEndpoint indexes (from Prisma @@index)
    CREATE INDEX IF NOT EXISTS idx_mock_endpoints_mockServerId ON mock_endpoints(mockServerId);
    CREATE INDEX IF NOT EXISTS idx_mock_endpoints_method_path ON mock_endpoints(method, path);
  `);

  // Add any missing columns to existing tables (for backward compatibility during migration)
  const alterStatements = [
    `ALTER TABLE workspaces ADD COLUMN description TEXT;`,
    `ALTER TABLE workspaces ADD COLUMN ownerId TEXT;`,
    `ALTER TABLE workspaces ADD COLUMN createdAt TEXT;`,
    `ALTER TABLE workspaces ADD COLUMN updatedAt TEXT;`,
    `ALTER TABLE collections ADD COLUMN description TEXT;`,
    `ALTER TABLE collections ADD COLUMN userId TEXT;`,
    `ALTER TABLE collections ADD COLUMN workspaceId TEXT;`,
    `ALTER TABLE collections ADD COLUMN createdAt TEXT;`,
    `ALTER TABLE collections ADD COLUMN updatedAt TEXT;`,
    `ALTER TABLE requests ADD COLUMN workspaceId TEXT;`,
    `ALTER TABLE requests ADD COLUMN userId TEXT;`,
    `ALTER TABLE requests ADD COLUMN bodyType TEXT;`,
    `ALTER TABLE requests ADD COLUMN auth TEXT;`,
    `ALTER TABLE requests ADD COLUMN createdAt TEXT;`,
    `ALTER TABLE requests ADD COLUMN updatedAt TEXT;`,
    `ALTER TABLE environments ADD COLUMN workspaceId TEXT;`,
    `ALTER TABLE environments ADD COLUMN userId TEXT;`,
    `ALTER TABLE environments ADD COLUMN variables TEXT DEFAULT '{}';`,
    `ALTER TABLE environments ADD COLUMN isActive INTEGER DEFAULT 0;`,
    `ALTER TABLE environments ADD COLUMN createdAt TEXT;`,
    `ALTER TABLE environments ADD COLUMN updatedAt TEXT;`,
  ];

  for (const sql of alterStatements) {
    try {
      await dbInstance.exec(sql);
    } catch {
      // Ignore "duplicate column" or other benign migration errors
    }
  }

  return dbInstance;
}

export function getDb(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDatabase first.");
  }
  return dbInstance;
}

/**
 * Check if database needs migration from INTEGER IDs to TEXT IDs
 */
async function checkIfNeedsMigration(
  db: Database<sqlite3.Database, sqlite3.Statement>
): Promise<boolean> {
  try {
    // Check if collections table exists with INTEGER id
    const tableInfo = await db.all<Array<{ type: string; name: string }>>(
      `PRAGMA table_info(collections)`
    );
    
    if (tableInfo.length === 0) {
      // Table doesn't exist, no migration needed
      return false;
    }

    // Check if id column is INTEGER
    const idColumn = tableInfo.find((col) => col.name === "id");
    if (idColumn && idColumn.type === "INTEGER") {
      return true;
    }

    return false;
  } catch {
    // If error, assume no migration needed
    return false;
  }
}

/**
 * Migrate database from INTEGER IDs to TEXT IDs (CUID)
 * This is a one-time migration
 */
async function migrateToNewSchema(
  db: Database<sqlite3.Database, sqlite3.Statement>
): Promise<void> {
  console.log("Starting database migration from INTEGER IDs to TEXT IDs...");
  
  // Note: SQLite doesn't support changing column types directly
  // We'll need to create new tables and copy data
  // For now, we'll just log and let the new schema be created
  // Existing data will need manual migration or will be lost
  console.warn("Migration from INTEGER to TEXT IDs requires manual data migration.");
  console.warn("Old data may be lost. Please backup your database before proceeding.");
  
  // In a production scenario, you would:
  // 1. Create new tables with TEXT IDs
  // 2. Copy data from old tables, generating new CUIDs
  // 3. Update foreign keys
  // 4. Drop old tables
  // 5. Rename new tables
  
  // For now, we'll just proceed with the new schema
  // Users with existing data should backup first
}



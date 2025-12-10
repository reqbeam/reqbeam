import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

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

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      workspaceId INTEGER,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collectionId INTEGER,
      workspaceId INTEGER,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT,
      body TEXT,
      bodyType TEXT,
      auth TEXT,
      FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE SET NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      workspaceId INTEGER,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS environment_variables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      env_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      FOREIGN KEY (env_id) REFERENCES environments(id) ON DELETE CASCADE,
      UNIQUE(env_id, key)
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      status INTEGER,
      duration INTEGER,
      createdAt TEXT NOT NULL,
      workspaceId INTEGER,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS request_params (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (requestId) REFERENCES requests(id) ON DELETE CASCADE,
      UNIQUE(requestId, key)
    );

    CREATE TABLE IF NOT EXISTS request_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL UNIQUE,
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

  // Migration: Add new columns to existing tables if they don't exist.
  // Each ALTER runs in its own try/catch so one failure doesn't block others.
  const alterStatements = [
    `ALTER TABLE workspaces ADD COLUMN description TEXT;`,
    `ALTER TABLE collections ADD COLUMN description TEXT;`,
    `ALTER TABLE collections ADD COLUMN workspaceId INTEGER;`,
    `ALTER TABLE requests ADD COLUMN workspaceId INTEGER;`,
    `ALTER TABLE requests ADD COLUMN bodyType TEXT;`,
    `ALTER TABLE requests ADD COLUMN auth TEXT;`,
    `ALTER TABLE environments ADD COLUMN workspaceId INTEGER;`,
    `ALTER TABLE history ADD COLUMN workspaceId INTEGER;`,
  ];

  // Migration: Migrate from JSON variables to environment_variables table
  try {
    const oldEnvs = await dbInstance.all<Array<{ id: number; variables: string }>>(
      `SELECT id, variables FROM environments WHERE variables IS NOT NULL AND variables != '' AND variables != '{}'`
    );
    
    for (const env of oldEnvs) {
      try {
        const parsed = JSON.parse(env.variables || "{}");
        if (parsed && typeof parsed === "object") {
          for (const [key, value] of Object.entries(parsed)) {
            if (typeof value === "string") {
              await dbInstance.run(
                `INSERT OR IGNORE INTO environment_variables (env_id, key, value) VALUES (?, ?, ?)`,
                env.id,
                key,
                value
              );
            }
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Remove the old variables column after migration
    // Note: SQLite doesn't support DROP COLUMN directly, so we'll leave it for now
    // and just ignore it in queries
  } catch {
    // Migration failed, continue
  }

  for (const sql of alterStatements) {
    try {
      // eslint-disable-next-line no-await-in-loop
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



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
      variables TEXT NOT NULL,
      workspaceId INTEGER,
      isActive INTEGER DEFAULT 0,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
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
    `ALTER TABLE environments ADD COLUMN isActive INTEGER DEFAULT 0;`,
    `ALTER TABLE history ADD COLUMN workspaceId INTEGER;`,
  ];

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



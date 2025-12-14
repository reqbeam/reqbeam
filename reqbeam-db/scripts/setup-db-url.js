#!/usr/bin/env node

/**
 * Setup DATABASE_URL for Prisma commands
 * Automatically uses VS Code extension database if DATABASE_URL is not set
 * and USE_VSCODE_EXTENSION_DB is enabled
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Get VS Code global storage path based on the platform
 */
function getVSCodeGlobalStoragePath(extensionId = 'reqbeam.reqbeam') {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'win32':
      const basePath = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      return path.join(basePath, 'Code', 'User', 'globalStorage', extensionId);
    
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', extensionId);
    
    case 'linux':
      return path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', extensionId);
    
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get VS Code extension database URL
 */
function getVSCodeExtensionDbUrl(extensionId = 'reqbeam.reqbeam', dbFileName = 'reqbeam.db') {
  const storagePath = getVSCodeGlobalStoragePath(extensionId);
  const dbPath = path.join(storagePath, dbFileName);
  
  // Ensure the directory exists
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
  
  // Convert path to file: URL format for Prisma SQLite
  const normalizedPath = dbPath.replace(/\\/g, '/');
  return `file:${normalizedPath}`;
}

/**
 * Get the database URL to use
 */
function getDatabaseUrl() {
  // If DATABASE_URL is explicitly set, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Check if we should use VS Code extension database
  const useVSCodeDb = process.env.USE_VSCODE_EXTENSION_DB === 'true' || 
                      process.env.USE_VSCODE_EXTENSION_DB === '1';
  
  if (useVSCodeDb) {
    const extensionId = process.env.VSCODE_EXTENSION_ID || 'reqbeam.reqbeam';
    const dbFileName = process.env.VSCODE_DB_FILE_NAME || 'reqbeam.db';
    const dbUrl = getVSCodeExtensionDbUrl(extensionId, dbFileName);
    console.log(`Using VS Code extension database: ${dbUrl}`);
    return dbUrl;
  }

  // Default: try to use VS Code extension database if no DATABASE_URL is set
  // This makes it work out of the box for VS Code extension development
  const extensionId = process.env.VSCODE_EXTENSION_ID || 'reqbeam.reqbeam';
  const dbFileName = process.env.VSCODE_DB_FILE_NAME || 'reqbeam.db';
  const dbUrl = getVSCodeExtensionDbUrl(extensionId, dbFileName);
  console.log(`No DATABASE_URL set, using VS Code extension database: ${dbUrl}`);
  return dbUrl;
}

// Get and set the database URL
const databaseUrl = getDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

// Export for use in other scripts
module.exports = { getDatabaseUrl, getVSCodeExtensionDbUrl };


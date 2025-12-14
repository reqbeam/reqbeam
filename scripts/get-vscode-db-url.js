#!/usr/bin/env node

/**
 * Helper script to get the VS Code extension database URL
 * Usage: node scripts/get-vscode-db-url.js
 */

const path = require('path');
const os = require('os');

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

function getVSCodeExtensionDbUrl(extensionId = 'reqbeam.reqbeam', dbFileName = 'reqbeam.db') {
  const storagePath = getVSCodeGlobalStoragePath(extensionId);
  const dbPath = path.join(storagePath, dbFileName);
  const normalizedPath = dbPath.replace(/\\/g, '/');
  return `file:${normalizedPath}`;
}

// Get values from command line args or use defaults
const extensionId = process.argv[2] || 'reqbeam.reqbeam';
const dbFileName = process.argv[3] || 'reqbeam.db';

const dbUrl = getVSCodeExtensionDbUrl(extensionId, dbFileName);
const dbPath = path.join(getVSCodeGlobalStoragePath(extensionId), dbFileName);

console.log('\n=== VS Code Extension Database Configuration ===\n');
console.log('Database URL (for DATABASE_URL in .env.local):');
console.log(dbUrl);
console.log('\nDatabase File Path:');
console.log(dbPath);
console.log('\n=== Add to your .env.local file ===\n');
console.log('# Use VS Code Extension Database');
console.log('USE_VSCODE_EXTENSION_DB=true');
console.log(`VSCODE_EXTENSION_ID="${extensionId}"`);
console.log(`VSCODE_DB_FILE_NAME="${dbFileName}"`);
console.log('\n# OR manually set DATABASE_URL:');
console.log(`DATABASE_URL="${dbUrl}"`);
console.log('');


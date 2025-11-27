const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating Prisma client...');
execSync('prisma generate --schema=./reqbeam-db/prisma/schema.prisma', { stdio: 'inherit' });

// Copy Prisma client from reqbeam-db to root node_modules if needed
const srcPath = path.join('reqbeam-db', 'node_modules', '@prisma', 'client');
const destPath = path.join('node_modules', '@prisma', 'client');
const srcPrismaPath = path.join('reqbeam-db', 'node_modules', '.prisma', 'client');
const destPrismaPath = path.join('node_modules', '.prisma', 'client');

if (fs.existsSync(srcPath)) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
  }
  // Copy @prisma/client
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  fs.cpSync(srcPath, destPath, { recursive: true });
  console.log('✓ Copied @prisma/client to root node_modules');
}

if (fs.existsSync(srcPrismaPath)) {
  if (!fs.existsSync(path.dirname(destPrismaPath))) {
    fs.mkdirSync(path.dirname(destPrismaPath), { recursive: true });
  }
  // Copy .prisma/client
  if (fs.existsSync(destPrismaPath)) {
    fs.rmSync(destPrismaPath, { recursive: true, force: true });
  }
  fs.cpSync(srcPrismaPath, destPrismaPath, { recursive: true });
  console.log('✓ Copied .prisma/client to root node_modules');
}

console.log('Prisma client generation complete!');


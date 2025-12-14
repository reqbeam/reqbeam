#!/usr/bin/env node

/**
 * Wrapper script to run Prisma commands with automatic VS Code extension database setup
 * Usage: node scripts/run-prisma.js <prisma-command> [args...]
 * Example: node scripts/run-prisma.js db push
 */

// Setup DATABASE_URL before running Prisma
require('./setup-db-url.js');

// Get the command and arguments
const [,, ...args] = process.argv;

if (args.length === 0) {
  console.error('Error: No Prisma command provided');
  console.log('Usage: node scripts/run-prisma.js <prisma-command> [args...]');
  console.log('Example: node scripts/run-prisma.js db push');
  process.exit(1);
}

// Run Prisma CLI using npx to ensure we use the local version
const { spawn } = require('child_process');

const prismaProcess = spawn('npx', ['prisma', ...args], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
  cwd: process.cwd()
});

prismaProcess.on('close', (code) => {
  process.exit(code || 0);
});

prismaProcess.on('error', (error) => {
  console.error('Error running Prisma:', error);
  process.exit(1);
});


#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { projectCommand } from './commands/project.js';
import { envCommand } from './commands/env.js';
import { requestCommand } from './commands/request.js';
import { collectionCommand } from './commands/collection.js';
import { runCommand } from './commands/run.js';
import { testCommand } from './commands/test.js';
import { logsCommand } from './commands/logs.js';
import { Scheduler } from './utils/scheduler.js';

const program = new Command();

program
  .name('postmind')
  .description('A TypeScript-based CLI tool for managing API projects, environments, requests, and collections')
  .version('1.0.0');

// Add commands
program.addCommand(initCommand);
program.addCommand(projectCommand);
program.addCommand(envCommand);
program.addCommand(requestCommand);
program.addCommand(collectionCommand);
program.addCommand(runCommand);
program.addCommand(testCommand);
program.addCommand(logsCommand);

// Initialize scheduler on startup
const scheduler = Scheduler.getInstance();
scheduler.startAllJobs().catch(console.error);

// Global error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
  writeOut: (str) => process.stdout.write(str)
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

program.parse();

#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { projectCommand } from './commands/project.js';
import { workspaceCommand } from './commands/workspace.js';
import { envCommand } from './commands/env.js';
import { requestCommand } from './commands/request.js';
import { collectionCommand } from './commands/collection.js';
import { runCommand } from './commands/run.js';
import { testCommand } from './commands/test.js';
import { logsCommand } from './commands/logs.js';
import { authCommand } from './commands/auth.js';
import { helpCommand } from './commands/help.js';
import { Scheduler } from './utils/scheduler.js';
import { AuthManager } from './utils/auth.js';

const program = new Command();

program
  .name('postmind')
  .alias('pm')
  .description('A TypeScript-based CLI tool for managing API projects, environments, requests, and collections')
  .version('1.0.0')
  .usage('[command] [options]')
  .addHelpText('after', '\nAlias: You can also use "pm" instead of "postmind"');

// Add commands
program.addCommand(authCommand);
program.addCommand(initCommand);
program.addCommand(workspaceCommand);
program.addCommand(projectCommand); // Kept for backward compatibility (deprecated)
program.addCommand(envCommand);
program.addCommand(requestCommand);
program.addCommand(collectionCommand);
program.addCommand(runCommand);
program.addCommand(testCommand);
program.addCommand(logsCommand);
program.addCommand(helpCommand);

// Add authentication middleware to all commands except auth and help
program.hook('preAction', async (thisCommand, actionCommand) => {
  const authManager = AuthManager.getInstance();
  const commandName = actionCommand.name() || thisCommand.name();
  
  // Skip auth check for auth and help commands by checking the command path
  const fullCommand = process.argv.slice(2).join(' ');
  const isAuthCommand = fullCommand.startsWith('auth') || fullCommand === 'auth';
  const isHelpCommand = fullCommand.startsWith('help') || fullCommand === 'help' || fullCommand === '';
  
  if (isAuthCommand || isHelpCommand) {
    return;
  }
  
  try {
    await authManager.checkAuthRequired(commandName);
  } catch (error) {
    // Authentication failed - error already handled by AuthManager
    process.exit(1);
  }
});

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

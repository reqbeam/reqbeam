#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { getCommand } from './commands/get.js';
import { postCommand } from './commands/post.js';
import { runCommand } from './commands/run.js';
import { testCommand } from './commands/test.js';
import { interactiveCommand } from './commands/interactive.js';

const program = new Command();

program
  .name('apicli')
  .description('A lightweight Postman CLI alternative for running API requests and tests')
  .version('1.0.0');

// GET command
program
  .command('get <url>')
  .description('Make a GET request to the specified URL')
  .option('-H, --header <headers...>', 'Add headers (format: "Key: Value")')
  .option('-e, --env <file>', 'Load environment variables from file')
  .option('-v, --verbose', 'Show detailed output')
  .action(getCommand);

// POST command
program
  .command('post <url>')
  .description('Make a POST request to the specified URL')
  .option('-d, --data <data>', 'Request body data (JSON string)')
  .option('-H, --header <headers...>', 'Add headers (format: "Key: Value")')
  .option('-e, --env <file>', 'Load environment variables from file')
  .option('-v, --verbose', 'Show detailed output')
  .action(postCommand);

// RUN command
program
  .command('run <collection>')
  .description('Execute all API requests in a collection file')
  .option('-e, --env <file>', 'Load environment variables from file')
  .option('-v, --verbose', 'Show detailed output')
  .option('-r, --report <file>', 'Generate HTML report')
  .action(runCommand);

// TEST command
program
  .command('test <collection>')
  .description('Run test scripts and print pass/fail results')
  .option('-e, --env <file>', 'Load environment variables from file')
  .option('-v, --verbose', 'Show detailed output')
  .option('-r, --report <file>', 'Generate HTML report')
  .action(testCommand);

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive CLI mode')
  .action(interactiveCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}


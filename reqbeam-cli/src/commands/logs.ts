import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { ExportOptions } from '../types.js';

const logsCommand = new Command('logs');

logsCommand
  .description('Logging & Monitoring commands');

// List logs
logsCommand
  .command('list')
  .description('List past executions')
  .option('-l, --limit <number>', 'Limit number of entries to show', '20')
  .option('-t, --type <type>', 'Filter by type (request, test, collection, all)', 'all')
  .action(async (options: { limit?: string; type?: string }) => {
    try {
      const logger = Logger.getInstance();
      const limit = parseInt(options.limit || '20');
      const type = options.type || 'all';
      
      const logs = await logger.listLogs(limit, type);
      
      if (logs.length === 0) {
        console.log(chalk.yellow('No logs found.'));
        return;
      }
      
      console.log(logger.formatLogsList(logs));
      
      // Show summary
      const summary = await logger.getLogSummary();
      console.log(chalk.bold(`\nSummary: ${summary.total} total, ${summary.passed} passed, ${summary.failed} failed`));
      if (summary.lastRun) {
        console.log(chalk.blue(`Last run: ${new Date(summary.lastRun).toLocaleString()}`));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error listing logs:'), error.message);
      process.exit(1);
    }
  });

// View specific log
logsCommand
  .command('view')
  .argument('<log_id>', 'ID of the log to view')
  .description('View details of specific log')
  .action(async (logId: string) => {
    try {
      const logger = Logger.getInstance();
      const log = await logger.getLog(logId);
      
      if (!log) {
        console.log(chalk.red(`Log with ID '${logId}' not found.`));
        process.exit(1);
      }
      
      console.log(logger.formatLogDetails(log));
      
    } catch (error: any) {
      console.error(chalk.red('Error viewing log:'), error.message);
      process.exit(1);
    }
  });

// Export logs
logsCommand
  .command('export')
  .argument('<file_path>', 'Path to export file (relative to logs/ directory or absolute path)')
  .description('Export all logs to JSON or CSV file')
  .option('-f, --format <format>', 'Export format (json, csv)', 'json')
  .option('-t, --type <type>', 'Filter by type (request, test, collection, all)', 'all')
  .option('-s, --start-date <date>', 'Start date filter (YYYY-MM-DD)')
  .option('-e, --end-date <date>', 'End date filter (YYYY-MM-DD)')
  .action(async (filePath: string, options: { format?: string; type?: string; startDate?: string; endDate?: string }) => {
    try {
      const logger = Logger.getInstance();
      
      const exportOptions: ExportOptions = {
        format: (options.format as 'json' | 'csv') || 'json',
        filePath,
        type: (options.type as 'request' | 'test' | 'collection' | 'all') || 'all',
        startDate: options.startDate,
        endDate: options.endDate
      };
      
      await logger.exportLogs(exportOptions);
      
      // Show the actual export path
      const actualPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), 'logs', filePath);
      console.log(chalk.green(`✅ Exported logs to ${actualPath}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error exporting logs:'), error.message);
      process.exit(1);
    }
  });

// Clear logs
logsCommand
  .command('clear')
  .description('Clear all local logs')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options: { yes?: boolean }) => {
    try {
      const logger = Logger.getInstance();
      
      if (!options.yes) {
        const { confirmed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmed',
            message: 'Are you sure you want to clear all logs?',
            default: false
          }
        ]);
        
        if (!confirmed) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
      }
      
      await logger.clearLogs();
      console.log(chalk.green('✅ All logs cleared.'));
      
    } catch (error: any) {
      console.error(chalk.red('Error clearing logs:'), error.message);
      process.exit(1);
    }
  });

// Show log summary
logsCommand
  .command('summary')
  .description('Show log summary statistics')
  .action(async () => {
    try {
      const logger = Logger.getInstance();
      const summary = await logger.getLogSummary();
      
      console.log(chalk.bold('\n📊 Log Summary\n'));
      console.log(`Total executions: ${summary.total}`);
      console.log(`Passed: ${chalk.green(summary.passed)}`);
      console.log(`Failed: ${chalk.red(summary.failed)}`);
      console.log(`Average duration: ${summary.averageDuration}ms`);
      
      if (summary.lastRun) {
        console.log(`Last run: ${new Date(summary.lastRun).toLocaleString()}`);
      }
      
      if (summary.total > 0) {
        const successRate = ((summary.passed / summary.total) * 100).toFixed(1);
        console.log(`Success rate: ${successRate}%`);
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error getting log summary:'), error.message);
      process.exit(1);
    }
  });

export { logsCommand };

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { StorageManager } from '../utils/storage.js';
import { TestRunner } from '../utils/testRunner.js';
import { Logger } from '../utils/logger.js';
import { Scheduler } from '../utils/scheduler.js';

const testCommand = new Command('test');

testCommand
  .description('Testing & Automation commands');

// Run tests
testCommand
  .command('run')
  .description('Run tests for single request or all')
  .option('-r, --request <name>', 'Run tests for specific request only')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: { request?: string; verbose?: boolean }) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      const projectPath = storage.getProjectPath(currentProject);
      const testRunner = TestRunner.getInstance();
      const logger = Logger.getInstance();

      const spinner = ora('Running tests...').start();
      
      const testSuite = await testRunner.runTests(projectPath, options.request);
      
      spinner.stop();
      
      // Display results
      console.log(testRunner.formatTestResults(testSuite));
      
      // Log test results
      await logger.logTest(
        testSuite.name,
        testSuite.passedTests,
        testSuite.totalTests,
        testSuite.duration,
        testSuite.failedTests === 0,
        testSuite
      );
      
      // Display summary
      const status = testSuite.failedTests === 0 ? '✅' : '❌';
      const summary = `${status} Passed: ${testSuite.passedTests} | ❌ Failed: ${testSuite.failedTests} | ⏱ Duration: ${(testSuite.duration / 1000).toFixed(1)}s`;
      console.log(chalk.bold(summary));
      
    } catch (error: any) {
      console.error(chalk.red('Error running tests:'), error.message);
      process.exit(1);
    }
  });

// Generate test files
testCommand
  .command('generate')
  .description('Auto-generate test skeleton files for all requests')
  .option('-f, --force', 'Overwrite existing test files')
  .action(async (options: { force?: boolean }) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      const projectPath = storage.getProjectPath(currentProject);
      const testRunner = TestRunner.getInstance();

      if (config.requests.length === 0) {
        console.log(chalk.yellow('No requests found. Create some requests first.'));
        return;
      }

      const requestNames = config.requests.map(r => r.name);
      const generatedFiles = await testRunner.generateTestFiles(projectPath, requestNames);
      
      if (generatedFiles.length === 0) {
        console.log(chalk.yellow('All requests already have test files.'));
      } else {
        console.log(chalk.green(`Generated ${generatedFiles.length} new test files:`));
        generatedFiles.forEach(file => {
          console.log(chalk.blue(`  - ${file}`));
        });
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error generating tests:'), error.message);
      process.exit(1);
    }
  });

// Schedule tests
testCommand
  .command('schedule')
  .argument('<cron_expression>', 'Cron expression for scheduling (e.g., "0 * * * *" for hourly)')
  .description('Schedule periodic test runs')
  .option('-n, --name <name>', 'Custom name for the scheduled job')
  .action(async (cronExpression: string, options: { name?: string }) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const scheduler = Scheduler.getInstance();
      const command = `postmind test run`;
      const jobName = options.name || `Test Run - ${new Date().toLocaleString()}`;
      
      const jobId = await scheduler.scheduleTestRun(cronExpression, command);
      
      console.log(chalk.green(`🕒 Scheduled test suite to run with expression: ${cronExpression}`));
      console.log(chalk.blue(`Job ID: ${jobId}`));
      console.log(chalk.blue(`Command: ${command}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error scheduling tests:'), error.message);
      process.exit(1);
    }
  });

// List scheduled jobs
testCommand
  .command('schedule-list')
  .description('List all scheduled test jobs')
  .action(async () => {
    try {
      const scheduler = Scheduler.getInstance();
      const jobs = await scheduler.listScheduledJobs();
      
      console.log(scheduler.formatScheduledJobs(jobs));
      
    } catch (error: any) {
      console.error(chalk.red('Error listing scheduled jobs:'), error.message);
      process.exit(1);
    }
  });

// Stop scheduled job
testCommand
  .command('schedule-stop')
  .argument('<job_id>', 'ID of the job to stop')
  .description('Stop a scheduled test job')
  .action(async (jobId: string) => {
    try {
      const scheduler = Scheduler.getInstance();
      await scheduler.stopJob(jobId);
      
      console.log(chalk.green(`✅ Stopped scheduled job: ${jobId}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error stopping scheduled job:'), error.message);
      process.exit(1);
    }
  });

// Delete scheduled job
testCommand
  .command('schedule-delete')
  .argument('<job_id>', 'ID of the job to delete')
  .description('Delete a scheduled test job')
  .action(async (jobId: string) => {
    try {
      const scheduler = Scheduler.getInstance();
      await scheduler.deleteJob(jobId);
      
      console.log(chalk.green(`✅ Deleted scheduled job: ${jobId}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error deleting scheduled job:'), error.message);
      process.exit(1);
    }
  });

export { testCommand };

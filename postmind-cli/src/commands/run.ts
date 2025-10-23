import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { StorageManager } from '../utils/storage.js';
import { RequestExecutor } from '../utils/request.js';
import { Formatter } from '../utils/formatter.js';
import { Logger } from '../utils/logger.js';
import { ExecutionResult, HistoryEntry, RunOptions } from '../types.js';

const runCommand = new Command('run');

runCommand
  .description('Execute requests and collections');

// Run single request
runCommand
  .command('request')
  .argument('<request_name>', 'Name of the request to run')
  .description('Run a single request')
  .option('-e, --env <environment>', 'Environment to use')
  .option('-s, --save-response', 'Save response to file')
  .option('-v, --verbose', 'Verbose output')
  .action(async (requestName: string, options: RunOptions) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      
      // Find request
      const request = config.requests.find(r => r.name === requestName);
      if (!request) {
        console.log(chalk.red(`Request '${requestName}' not found`));
        process.exit(1);
      }

      // Get environment
      let environment = null;
      if (options.env) {
        environment = config.environments.find(e => e.name === options.env);
        if (!environment) {
          console.log(chalk.red(`Environment '${options.env}' not found`));
          process.exit(1);
        }
      } else if (config.currentEnvironment) {
        environment = config.environments.find(e => e.name === config.currentEnvironment);
      }

      const spinner = ora(`Running request '${requestName}'...`).start();
      
      const result = await RequestExecutor.executeRequest(request, environment || undefined, options.verbose);
      
      spinner.stop();
      
      console.log(Formatter.formatExecutionResult(result));
      
      // Log the execution
      const logger = Logger.getInstance();
      const logId = await logger.logRequest(
        requestName,
        result.status,
        result.duration,
        result.success,
        environment?.name,
        result
      );
      
      // Save to history
      const historyEntry: HistoryEntry = {
        id: generateId(),
        type: 'request',
        name: requestName,
        timestamp: new Date().toISOString(),
        duration: result.duration,
        status: result.status,
        success: result.success,
        environment: environment?.name,
        response: options.saveResponse ? result.response : undefined
      };

      config.history.unshift(historyEntry);
      // Keep only last 100 history entries
      config.history = config.history.slice(0, 100);
      
      await storage.saveProjectConfig(currentProject, config);
      
      if (options.saveResponse && result.response) {
        console.log(chalk.blue(`Response saved to history (ID: ${historyEntry.id})`));
      }
      
      console.log(chalk.blue(`Execution logged (ID: ${logId})`));
      
    } catch (error: any) {
      console.error(chalk.red('Error running request:'), error.message);
      process.exit(1);
    }
  });

// Run collection
runCommand
  .command('collection')
  .argument('<collection_name>', 'Name of the collection to run')
  .description('Run all requests in a collection')
  .option('-e, --env <environment>', 'Environment to use')
  .option('-p, --parallel', 'Run requests in parallel')
  .option('-s, --save-response', 'Save responses to files')
  .option('-v, --verbose', 'Verbose output')
  .action(async (collectionName: string, options: RunOptions) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      
      // Find collection
      const collection = config.collections.find(c => c.name === collectionName);
      if (!collection) {
        console.log(chalk.red(`Collection '${collectionName}' not found`));
        process.exit(1);
      }

      // Get requests in collection
      const requests = config.requests.filter(r => collection.requests.includes(r.name));
      if (requests.length === 0) {
        console.log(chalk.yellow(`Collection '${collectionName}' has no requests`));
        return;
      }

      // Get environment
      let environment = null;
      if (options.env) {
        environment = config.environments.find(e => e.name === options.env);
        if (!environment) {
          console.log(chalk.red(`Environment '${options.env}' not found`));
          process.exit(1);
        }
      } else if (config.currentEnvironment) {
        environment = config.environments.find(e => e.name === config.currentEnvironment);
      }

      console.log(chalk.bold(`Running collection '${collectionName}' (${requests.length} requests)...`));
      
      const results: ExecutionResult[] = [];
      
      if (options.parallel) {
        // Run requests in parallel
        const spinner = ora('Running requests in parallel...').start();
        
        const promises = requests.map(request => 
          RequestExecutor.executeRequest(request, environment || undefined, options.verbose)
        );
        
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
        
        spinner.stop();
      } else {
        // Run requests sequentially
        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];
          const spinner = ora(`[${i + 1}/${requests.length}] Running '${request.name}'...`).start();
          
          const result = await RequestExecutor.executeRequest(request, environment || undefined, options.verbose);
          results.push(result);
          
          spinner.stop();
          console.log(Formatter.formatExecutionResult(result));
        }
      }

      // Display results
      if (!options.parallel) {
        console.log('\n' + Formatter.formatExecutionResults(results));
      } else {
        console.log(Formatter.formatExecutionResults(results));
      }
      
      console.log(Formatter.formatSummary(results));
      
      // Log the collection execution
      const logger = Logger.getInstance();
      const logId = await logger.logCollection(
        collectionName,
        results.every(r => r.success) ? 200 : 500,
        results.reduce((sum, r) => sum + r.duration, 0),
        results.every(r => r.success),
        environment?.name,
        results
      );
      
      // Save to history
      const historyEntry: HistoryEntry = {
        id: generateId(),
        type: 'collection',
        name: collectionName,
        timestamp: new Date().toISOString(),
        duration: results.reduce((sum, r) => sum + r.duration, 0),
        status: results.every(r => r.success) ? 200 : 500,
        success: results.every(r => r.success),
        environment: environment?.name,
        response: options.saveResponse ? results : undefined
      };

      config.history.unshift(historyEntry);
      // Keep only last 100 history entries
      config.history = config.history.slice(0, 100);
      
      await storage.saveProjectConfig(currentProject, config);
      
      if (options.saveResponse) {
        console.log(chalk.blue(`Results saved to history (ID: ${historyEntry.id})`));
      }
      
      console.log(chalk.blue(`Collection execution logged (ID: ${logId})`));
      
    } catch (error: any) {
      console.error(chalk.red('Error running collection:'), error.message);
      process.exit(1);
    }
  });

// Run from history
runCommand
  .command('history')
  .argument('<history_id>', 'ID of the history entry to replay')
  .description('Replay a past request or collection execution')
  .option('-v, --verbose', 'Verbose output')
  .action(async (historyId: string, options: { verbose?: boolean }) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      
      // Find history entry
      const historyEntry = config.history.find(h => h.id === historyId);
      if (!historyEntry) {
        console.log(chalk.red(`History entry '${historyId}' not found`));
        process.exit(1);
      }

      console.log(chalk.bold(`Replaying ${historyEntry.type} '${historyEntry.name}' from ${new Date(historyEntry.timestamp).toLocaleString()}...`));
      
      if (historyEntry.type === 'request') {
        // Replay single request
        const request = config.requests.find(r => r.name === historyEntry.name);
        if (!request) {
          console.log(chalk.red(`Request '${historyEntry.name}' not found`));
          process.exit(1);
        }

        const environment = historyEntry.environment 
          ? config.environments.find(e => e.name === historyEntry.environment)
          : null;

        const result = await RequestExecutor.executeRequest(request, environment || undefined, options.verbose);
        console.log(Formatter.formatExecutionResult(result));
        
      } else if (historyEntry.type === 'collection') {
        // Replay collection
        const collection = config.collections.find(c => c.name === historyEntry.name);
        if (!collection) {
          console.log(chalk.red(`Collection '${historyEntry.name}' not found`));
          process.exit(1);
        }

        const requests = config.requests.filter(r => collection.requests.includes(r.name));
        const environment = historyEntry.environment 
          ? config.environments.find(e => e.name === historyEntry.environment)
          : null;

        const results: ExecutionResult[] = [];
        
        for (const request of requests) {
          const result = await RequestExecutor.executeRequest(request, environment || undefined, options.verbose);
          results.push(result);
          console.log(Formatter.formatExecutionResult(result));
        }

        console.log('\n' + Formatter.formatExecutionResults(results));
        console.log(Formatter.formatSummary(results));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error replaying history:'), error.message);
      process.exit(1);
    }
  });

// List history
runCommand
  .command('history-list')
  .description('List execution history')
  .option('-l, --limit <number>', 'Limit number of entries to show', '10')
  .action(async (options: { limit?: string }) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      const limit = parseInt(options.limit || '10');
      
      console.log(chalk.bold('Execution History:'));
      console.log(Formatter.formatHistory(config.history.slice(0, limit)));
      
    } catch (error: any) {
      console.error(chalk.red('Error listing history:'), error.message);
      process.exit(1);
    }
  });

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export { runCommand };

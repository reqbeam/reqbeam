import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ApiStorageManager } from '../utils/apiStorage.js';
import { RequestExecutor } from '../utils/request.js';
import { Formatter } from '../utils/formatter.js';
import { Logger } from '../utils/logger.js';
import { RunOptions } from '../types.js';

const runCommand = new Command('run');

runCommand
  .description('Execute requests and collections');

// Run single request
runCommand
  .command('request')
  .argument('<request_name>', 'Name of the request to run')
  .description('Run a single request')
  .option('-e, --env <environment>', 'Environment to use')
  .option('-v, --verbose', 'Verbose output')
  .action(async (requestName: string, options: RunOptions) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find request
      const request = await storage.findRequestByName(requestName);
      if (!request) {
        console.log(chalk.red(`Request '${requestName}' not found`));
        process.exit(1);
      }

      // Get environment
      let environment = null;
      if (options.env) {
        environment = await storage.findEnvironmentByName(options.env);
        if (!environment) {
          console.log(chalk.red(`Environment '${options.env}' not found`));
          process.exit(1);
        }
      } else {
        environment = await storage.getActiveEnvironment();
      }

      const spinner = ora(`Running request '${requestName}'...`).start();
      
      // Parse headers from JSON string to object
      let parsedHeaders: Record<string, string> | undefined = undefined;
      if (request.headers) {
        try {
          parsedHeaders = typeof request.headers === 'string' 
            ? JSON.parse(request.headers) 
            : request.headers;
        } catch {
          // If parsing fails, treat as empty
          parsedHeaders = undefined;
        }
      }
      
      // Convert API request format to executor format
      const execRequest = {
        name: request.name,
        method: request.method as any,
        url: request.url,
        headers: parsedHeaders,
        body: request.body || undefined,
        createdAt: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
        updatedAt: request.updatedAt instanceof Date ? request.updatedAt.toISOString() : request.updatedAt
      };

      const result = await RequestExecutor.executeRequest(
        execRequest,
        environment || undefined,
        options.verbose
      );
      
      spinner.stop();
      
      console.log(Formatter.formatExecutionResult(result));
      
      // Save to history database
      await storage.saveToHistory({
        method: result.method,
        url: result.url,
        statusCode: result.status,
        duration: result.duration,
        error: result.error
      });
      
      // Log to local log file
      const logger = Logger.getInstance();
      await logger.logRequest(
        request.name,
        result.status,
        result.duration,
        result.success,
        environment?.name,
        result
      );
      
      console.log(chalk.blue(`Execution completed in ${result.duration}ms`));
      
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
  .option('-v, --verbose', 'Verbose output')
  .action(async (collectionName: string, options: RunOptions) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find collection
      const collections = await storage.listCollections();
      const collection = collections.find(c => c.name === collectionName);
      
      if (!collection) {
        console.log(chalk.red(`Collection '${collectionName}' not found`));
        process.exit(1);
      }

      // Get requests in collection
      const requests = collection.requests || [];
      
      if (requests.length === 0) {
        console.log(chalk.yellow(`Collection '${collectionName}' has no requests`));
        return;
      }

      // Get environment
      let environment = null;
      if (options.env) {
        environment = await storage.findEnvironmentByName(options.env);
        if (!environment) {
          console.log(chalk.red(`Environment '${options.env}' not found`));
          process.exit(1);
        }
      } else {
        environment = await storage.getActiveEnvironment();
      }

      console.log(chalk.bold(`Running collection '${collectionName}' (${requests.length} requests)...`));
      
      const startTime = Date.now();
      const results: any[] = [];
      
      if (options.parallel) {
        // Run requests in parallel
        const spinner = ora('Running requests in parallel...').start();
        
        const promises = requests.map(request => {
          // Parse headers from JSON string to object
          let parsedHeaders: Record<string, string> | undefined = undefined;
          if (request.headers) {
            try {
              parsedHeaders = typeof request.headers === 'string' 
                ? JSON.parse(request.headers) 
                : request.headers;
            } catch {
              parsedHeaders = undefined;
            }
          }
          
          const execRequest = {
            name: request.name,
            method: request.method as any,
            url: request.url,
            headers: parsedHeaders,
            body: request.body || undefined,
            createdAt: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
            updatedAt: request.updatedAt instanceof Date ? request.updatedAt.toISOString() : request.updatedAt
          };
          return RequestExecutor.executeRequest(execRequest, environment || undefined, options.verbose);
        });
        
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
        
        spinner.stop();
        
        // Save all to history database
        for (const result of parallelResults) {
          await storage.saveToHistory({
            method: result.method,
            url: result.url,
            statusCode: result.status,
            duration: result.duration,
            error: result.error
          });
        }
        
        // Display all results
        console.log(Formatter.formatExecutionResults(results));
      } else {
        // Run requests sequentially
        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];
          const spinner = ora(`[${i + 1}/${requests.length}] Running '${request.name}'...`).start();
          
          // Parse headers from JSON string to object
          let parsedHeaders: Record<string, string> | undefined = undefined;
          if (request.headers) {
            try {
              parsedHeaders = typeof request.headers === 'string' 
                ? JSON.parse(request.headers) 
                : request.headers;
            } catch {
              parsedHeaders = undefined;
            }
          }
          
          const execRequest = {
            name: request.name,
            method: request.method as any,
            url: request.url,
            headers: parsedHeaders,
            body: request.body || undefined,
            createdAt: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
            updatedAt: request.updatedAt instanceof Date ? request.updatedAt.toISOString() : request.updatedAt
          };
          
          const result = await RequestExecutor.executeRequest(execRequest, environment || undefined, options.verbose);
          results.push(result);
          
          spinner.stop();
          console.log(Formatter.formatExecutionResult(result));
          
          // Save to history database
          await storage.saveToHistory({
            method: result.method,
            url: result.url,
            statusCode: result.status,
            duration: result.duration,
            error: result.error
          });
        }
      }

      console.log(Formatter.formatSummary(results));
      
      // Log collection execution
      const totalDuration = Date.now() - startTime;
      const passed = results.filter(r => r.success).length;
      const failed = results.length - passed;
      const collectionStatus = failed === 0 ? 200 : 500;
      
      const logger = Logger.getInstance();
      await logger.logCollection(
        collectionName,
        collectionStatus,
        totalDuration,
        failed === 0,
        environment?.name,
        {
          totalRequests: results.length,
          passed,
          failed,
          results: results.map(r => ({
            name: r.name,
            status: r.status,
            success: r.success,
            duration: r.duration
          }))
        }
      );
      
    } catch (error: any) {
      console.error(chalk.red('Error running collection:'), error.message);
      process.exit(1);
    }
  });

export { runCommand };



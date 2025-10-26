import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ApiStorageManager } from '../utils/apiStorage.js';
import { Formatter } from '../utils/formatter.js';

const requestCommand = new Command('request');

requestCommand
  .description('Manage API requests');

// Create request
requestCommand
  .command('create')
  .description('Create a new request')
  .option('-n, --name <name>', 'Name of the request')
  .option('-m, --method <method>', 'HTTP method (GET, POST, PUT, DELETE, PATCH)')
  .option('-u, --url <url>', 'Request URL')
  .option('-H, --headers <headers>', 'Headers as key:value pairs (comma-separated)')
  .option('-b, --body <body>', 'Request body (JSON string)')
  .option('-c, --collection <collection>', 'Collection name to add request to')
  .option('-i, --interactive', 'Create request interactively')
  .action(async (options: {
    name?: string;
    method?: string;
    url?: string;
    headers?: string;
    body?: string;
    collection?: string;
    interactive?: boolean;
  }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      let requestData: any = {};

      if (options.interactive || !options.name) {
        // Get list of collections for selection
        const collections = await storage.listCollections();
        const collectionChoices = ['None', ...collections.map(c => c.name)];
        
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Request name:',
            validate: (input: string) => input.trim() ? true : 'Name is required'
          },
          {
            type: 'list',
            name: 'method',
            message: 'HTTP method:',
            choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            default: 'GET'
          },
          {
            type: 'input',
            name: 'url',
            message: 'Request URL:',
            validate: (input: string) => input.trim() ? true : 'URL is required'
          },
          {
            type: 'input',
            name: 'headers',
            message: 'Headers (key:value pairs, comma-separated):',
            default: ''
          },
          {
            type: 'input',
            name: 'body',
            message: 'Request body (JSON string):',
            default: ''
          },
          {
            type: 'list',
            name: 'collection',
            message: 'Add to collection:',
            choices: collectionChoices,
            default: 'None'
          }
        ]);

        requestData = answers;
      } else {
        requestData = {
          name: options.name,
          method: options.method || 'GET',
          url: options.url || '',
          headers: options.headers,
          body: options.body,
          collection: options.collection
        };
      }

      // Validate required fields
      if (!requestData.name || !requestData.url) {
        console.log(chalk.red('Name and URL are required'));
        process.exit(1);
      }

      // Check if request already exists
      const existingRequest = await storage.findRequestByName(requestData.name);
      if (existingRequest) {
        console.log(chalk.red(`Request '${requestData.name}' already exists`));
        process.exit(1);
      }

      // Parse headers if provided
      let headers = undefined;
      if (requestData.headers && requestData.headers.trim()) {
        headers = parseHeaders(requestData.headers);
      }

      // Find collection ID if specified
      let collectionId = undefined;
      if (requestData.collection && requestData.collection !== 'None') {
        const collections = await storage.listCollections();
        const collection = collections.find(c => c.name === requestData.collection);
        if (collection) {
          collectionId = collection.id;
        }
      }

      const request = await storage.createRequest({
        name: requestData.name,
        method: requestData.method.toUpperCase(),
        url: requestData.url,
        headers,
        body: requestData.body || undefined,
        bodyType: 'json',
        collectionId
      });
      
      if (!request) {
        console.log(chalk.red('Failed to create request'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Request '${request.name}' created successfully`));
      console.log(chalk.gray(`  ID: ${request.id}`));
      if (collectionId) {
        console.log(chalk.gray(`  Collection: ${requestData.collection}`));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error creating request:'), error.message);
      process.exit(1);
    }
  });

// List requests
requestCommand
  .command('list')
  .description('List all requests')
  .option('-c, --collection <collection>', 'Filter by collection name')
  .action(async (options: { collection?: string }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      let requests;
      
      if (options.collection) {
        // Find collection first
        const collections = await storage.listCollections();
        const collection = collections.find(c => c.name === options.collection);
        
        if (!collection) {
          console.log(chalk.red(`Collection '${options.collection}' not found`));
          process.exit(1);
        }
        
        requests = await storage.listRequests(collection.id);
      } else {
        requests = await storage.listRequests();
      }
      
      if (requests.length === 0) {
        console.log(chalk.yellow('No requests found'));
        console.log(chalk.gray('Create one with: postmind request create -i'));
        return;
      }
      
      console.log(chalk.bold('Requests:'));
      // Convert API requests to formatter-compatible format
      const formattedRequests = requests.map(r => ({
        ...r,
        method: r.method as any
      }));
      console.log(Formatter.formatRequests(formattedRequests as any));
      
    } catch (error: any) {
      console.error(chalk.red('Error listing requests:'), error.message);
      process.exit(1);
    }
  });

// Update request
requestCommand
  .command('update')
  .argument('<name>', 'Name of the request to update')
  .description('Update an existing request')
  .option('-m, --method <method>', 'HTTP method')
  .option('-u, --url <url>', 'Request URL')
  .option('-H, --headers <headers>', 'Headers as key:value pairs')
  .option('-b, --body <body>', 'Request body')
  .option('-c, --collection <collection>', 'Collection name')
  .action(async (name: string, options: {
    method?: string;
    url?: string;
    headers?: string;
    body?: string;
    collection?: string;
  }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find request
      const request = await storage.findRequestByName(name);
      
      if (!request) {
        console.log(chalk.red(`Request '${name}' not found`));
        process.exit(1);
      }

      // Build update data
      const updateData: any = {};
      
      if (options.method) updateData.method = options.method.toUpperCase();
      if (options.url) updateData.url = options.url;
      if (options.headers) updateData.headers = parseHeaders(options.headers);
      if (options.body !== undefined) updateData.body = options.body;
      
      if (options.collection) {
        const collections = await storage.listCollections();
        const collection = collections.find(c => c.name === options.collection);
        if (collection) {
          updateData.collectionId = collection.id;
        } else {
          console.log(chalk.red(`Collection '${options.collection}' not found`));
          process.exit(1);
        }
      }

      const updated = await storage.updateRequest(request.id, updateData);
      
      if (!updated) {
        console.log(chalk.red('Failed to update request'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Request '${name}' updated successfully`));
      
    } catch (error: any) {
      console.error(chalk.red('Error updating request:'), error.message);
      process.exit(1);
    }
  });

// Delete request
requestCommand
  .command('delete')
  .argument('<name>', 'Name of the request to delete')
  .description('Delete a request')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (name: string, options: { force?: boolean }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find request
      const request = await storage.findRequestByName(name);
      
      if (!request) {
        console.log(chalk.red(`Request '${name}' not found`));
        process.exit(1);
      }

      // Confirm deletion unless -f flag is used
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete request '${name}'?`,
            default: false
          }
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Request deletion cancelled'));
          process.exit(0);
        }
      }

      const deleted = await storage.deleteRequest(request.id);
      
      if (!deleted) {
        console.log(chalk.red('Failed to delete request'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Request '${name}' deleted successfully`));
      
    } catch (error: any) {
      console.error(chalk.red('Error deleting request:'), error.message);
      process.exit(1);
    }
  });

// Helper function to parse headers
function parseHeaders(headersString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (!headersString || !headersString.trim()) return headers;
  
  headersString.split(',').forEach(pair => {
    const trimmedPair = pair.trim();
    if (trimmedPair) {
      const colonIndex = trimmedPair.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmedPair.substring(0, colonIndex).trim();
        const value = trimmedPair.substring(colonIndex + 1).trim();
        if (key && value) {
          headers[key] = value;
        }
      }
    }
  });
  
  return headers;
}

export { requestCommand };

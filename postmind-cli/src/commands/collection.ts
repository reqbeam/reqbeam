import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { StorageManager } from '../utils/storage.js';
import { Formatter } from '../utils/formatter.js';
import { Collection } from '../types.js';

const collectionCommand = new Command('collection');

collectionCommand
  .description('Manage collections');

// Create collection
collectionCommand
  .command('create')
  .argument('<name>', 'Name of the collection to create')
  .description('Create a new collection')
  .option('-d, --description <description>', 'Collection description')
  .action(async (name: string, options: { description?: string }) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      
      // Check if collection already exists
      const collectionExists = config.collections.some(c => c.name === name);
      if (collectionExists) {
        console.log(chalk.red(`Collection '${name}' already exists`));
        process.exit(1);
      }

      const collection: Collection = {
        name,
        description: options.description,
        requests: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      config.collections.push(collection);
      await storage.saveProjectConfig(currentProject, config);
      
      console.log(chalk.green(`✓ Collection '${name}' created successfully`));
      
    } catch (error: any) {
      console.error(chalk.red('Error creating collection:'), error.message);
      process.exit(1);
    }
  });

// List collections
collectionCommand
  .command('list')
  .description('List all collections in the current project')
  .action(async () => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      console.log(chalk.bold('Collections:'));
      console.log(Formatter.formatCollections(config.collections));
      
    } catch (error: any) {
      console.error(chalk.red('Error listing collections:'), error.message);
      process.exit(1);
    }
  });

// Add request to collection
collectionCommand
  .command('add')
  .argument('<collection_name>', 'Name of the collection')
  .argument('<request_name>', 'Name of the request to add')
  .description('Add a request to a collection')
  .action(async (collectionName: string, requestName: string) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      
      // Check if collection exists
      const collection = config.collections.find(c => c.name === collectionName);
      if (!collection) {
        console.log(chalk.red(`Collection '${collectionName}' not found`));
        process.exit(1);
      }

      // Check if request exists
      const request = config.requests.find(r => r.name === requestName);
      if (!request) {
        console.log(chalk.red(`Request '${requestName}' not found`));
        process.exit(1);
      }

      // Check if request is already in collection
      if (collection.requests.includes(requestName)) {
        console.log(chalk.yellow(`Request '${requestName}' is already in collection '${collectionName}'`));
        return;
      }

      collection.requests.push(requestName);
      collection.updatedAt = new Date().toISOString();
      
      await storage.saveProjectConfig(currentProject, config);
      
      console.log(chalk.green(`✓ Request '${requestName}' added to collection '${collectionName}'`));
      
    } catch (error: any) {
      console.error(chalk.red('Error adding request to collection:'), error.message);
      process.exit(1);
    }
  });

// Remove request from collection
collectionCommand
  .command('remove')
  .argument('<collection_name>', 'Name of the collection')
  .argument('<request_name>', 'Name of the request to remove')
  .description('Remove a request from a collection')
  .action(async (collectionName: string, requestName: string) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      
      // Check if collection exists
      const collection = config.collections.find(c => c.name === collectionName);
      if (!collection) {
        console.log(chalk.red(`Collection '${collectionName}' not found`));
        process.exit(1);
      }

      // Check if request is in collection
      const requestIndex = collection.requests.indexOf(requestName);
      if (requestIndex === -1) {
        console.log(chalk.yellow(`Request '${requestName}' is not in collection '${collectionName}'`));
        return;
      }

      collection.requests.splice(requestIndex, 1);
      collection.updatedAt = new Date().toISOString();
      
      await storage.saveProjectConfig(currentProject, config);
      
      console.log(chalk.green(`✓ Request '${requestName}' removed from collection '${collectionName}'`));
      
    } catch (error: any) {
      console.error(chalk.red('Error removing request from collection:'), error.message);
      process.exit(1);
    }
  });

// Export collection
collectionCommand
  .command('export')
  .argument('<collection_name>', 'Name of the collection to export')
  .argument('<file_path>', 'Path to export the collection to')
  .description('Export a collection to JSON or YAML file')
  .option('-f, --format <format>', 'Export format (json, yaml)', 'json')
  .action(async (collectionName: string, filePath: string, options: { format?: string }) => {
    try {
      const storage = StorageManager.getInstance();
      const currentProject = await storage.getCurrentProject();
      
      if (!currentProject) {
        console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
        process.exit(1);
      }

      const config = await storage.loadProjectConfig(currentProject);
      
      // Check if collection exists
      const collection = config.collections.find(c => c.name === collectionName);
      if (!collection) {
        console.log(chalk.red(`Collection '${collectionName}' not found`));
        process.exit(1);
      }

      // Get all requests in the collection
      const collectionRequests = config.requests.filter(r => collection.requests.includes(r.name));

      const exportData = {
        name: collection.name,
        description: collection.description,
        requests: collectionRequests,
        exportedAt: new Date().toISOString()
      };

      // Determine format from file extension if not specified
      const format = options.format || path.extname(filePath).slice(1).toLowerCase() || 'json';

      if (format === 'yaml' || format === 'yml') {
        const yaml = await import('js-yaml');
        const yamlContent = yaml.dump(exportData, { indent: 2 });
        await fs.writeFile(filePath, yamlContent);
      } else {
        await fs.writeJson(filePath, exportData, { spaces: 2 });
      }

      console.log(chalk.green(`✓ Collection '${collectionName}' exported to ${filePath}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error exporting collection:'), error.message);
      process.exit(1);
    }
  });

export { collectionCommand };

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ApiStorageManager } from '../utils/apiStorage.js';
import { ContextManager } from '../utils/context.js';
import { Formatter } from '../utils/formatter.js';

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
      const storage = ApiStorageManager.getInstance();
      
      // Check if collection already exists
      const collections = await storage.listCollections();
      const collectionExists = collections.some(c => c.name === name);
      
      if (collectionExists) {
        console.log(chalk.red(`Collection '${name}' already exists`));
        process.exit(1);
      }

      const collection = await storage.createCollection(name, options.description);
      
      if (!collection) {
        console.log(chalk.red('Failed to create collection'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Collection '${name}' created successfully`));
      console.log(chalk.gray(`  ID: ${collection.id}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error creating collection:'), error.message);
      process.exit(1);
    }
  });

// List collections
collectionCommand
  .command('list')
  .description('List all collections')
  .action(async () => {
    try {
      const storage = ApiStorageManager.getInstance();
      const collections = await storage.listCollections();
      
      if (collections.length === 0) {
        console.log(chalk.yellow('No collections found'));
        console.log(chalk.gray('Create one with: reqbeam collection create <name>'));
        return;
      }
      
      console.log(chalk.bold('Collections:'));
      
      // Format collections with request counts - convert to old format
      const formattedCollections = collections.map(col => ({
        name: col.name,
        description: col.description,
        requests: (col.requests || []).map(r => r.name), // Convert to array of names
        createdAt: col.createdAt,
        updatedAt: col.updatedAt
      }));
      
      console.log(Formatter.formatCollections(formattedCollections as any));
      
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
  .description('Add an existing request to a collection')
  .action(async (collectionName: string, requestName: string) => {
    try {
      const storage = ApiStorageManager.getInstance();
      const ctx = ContextManager.getInstance();
      
      // Find collection
      const collections = await storage.listCollections();
      const collection = collections.find(c => c.name === collectionName);
      
      if (!collection) {
        console.log(chalk.red(`Collection '${collectionName}' not found`));
        process.exit(1);
      }

      // Find request
      // Prefer within selected collection
      const activeCollection = await ctx.getActiveCollection();
      const request = await storage.findRequestByName(requestName, activeCollection?.id);
      
      if (!request) {
        console.log(chalk.red(`Request '${requestName}' not found`));
        process.exit(1);
      }

      // Update request to assign it to the collection
      const updated = await storage.updateRequest(request.id, {
        collectionId: collection.id
      });
      
      if (!updated) {
        console.log(chalk.red('Failed to add request to collection'));
        process.exit(1);
      }
      
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
      const storage = ApiStorageManager.getInstance();
      
      // Find collection
      const collections = await storage.listCollections();
      const collection = collections.find(c => c.name === collectionName);
      
      if (!collection) {
        console.log(chalk.red(`Collection '${collectionName}' not found`));
        process.exit(1);
      }

      // Find request in this collection
      const request = await storage.findRequestByName(requestName, collection.id);
      
      if (!request) {
        console.log(chalk.red(`Request '${requestName}' not found in collection '${collectionName}'`));
        process.exit(1);
      }

      // Update request to remove collection assignment
      const updated = await storage.updateRequest(request.id, {
        collectionId: undefined
      });
      
      if (!updated) {
        console.log(chalk.red('Failed to remove request from collection'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Request '${requestName}' removed from collection '${collectionName}'`));
      
    } catch (error: any) {
      console.error(chalk.red('Error removing request from collection:'), error.message);
      process.exit(1);
    }
  });

// Delete collection
collectionCommand
  .command('delete')
  .argument('<name>', 'Name of the collection to delete')
  .description('Delete a collection')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (name: string, options: { force?: boolean }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find collection
      const collections = await storage.listCollections();
      const collection = collections.find(c => c.name === name);
      
      if (!collection) {
        console.log(chalk.red(`Collection '${name}' not found`));
        process.exit(1);
      }

      // Confirm deletion unless -f flag is used
      if (!options.force) {
        const requestCount = collection.requests?.length || 0;
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete collection '${name}'? ${requestCount > 0 ? `(${requestCount} requests will be unassigned)` : ''}`,
            default: false
          }
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Collection deletion cancelled'));
          process.exit(0);
        }
      }

      const deleted = await storage.deleteCollection(collection.id);
      
      if (!deleted) {
        console.log(chalk.red('Failed to delete collection'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Collection '${name}' deleted successfully`));
      
    } catch (error: any) {
      console.error(chalk.red('Error deleting collection:'), error.message);
      process.exit(1);
    }
  });

// Update collection
collectionCommand
  .command('update')
  .argument('<name>', 'Current name of the collection')
  .description('Update a collection')
  .option('-n, --new-name <newName>', 'New name for the collection')
  .option('-d, --description <description>', 'New description')
  .action(async (name: string, options: { newName?: string; description?: string }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find collection
      const collections = await storage.listCollections();
      const collection = collections.find(c => c.name === name);
      
      if (!collection) {
        console.log(chalk.red(`Collection '${name}' not found`));
        process.exit(1);
      }

      const updated = await storage.updateCollection(
        collection.id,
        options.newName,
        options.description
      );
      
      if (!updated) {
        console.log(chalk.red('Failed to update collection'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Collection updated successfully`));
      
    } catch (error: any) {
      console.error(chalk.red('Error updating collection:'), error.message);
      process.exit(1);
    }
  });

export { collectionCommand };

// Select collection
collectionCommand
  .command('select')
  .argument('<name>', 'Collection name')
  .description('Select a collection to work on (affects request defaults)')
  .action(async (name: string) => {
    try {
      const storage = ApiStorageManager.getInstance();
      const collections = await storage.listCollections();
      const collection = collections.find(c => c.name === name || c.id === name);
      if (!collection) {
        console.log(chalk.red(`Collection '${name}' not found`));
        process.exit(1);
      }
      await ContextManager.getInstance().setActiveCollection({ id: collection.id, name: collection.name });
      console.log(chalk.green(`✓ Selected collection '${collection.name}'`));
    } catch (error: any) {
      console.error(chalk.red('Error selecting collection:'), error.message);
      process.exit(1);
    }
  });

import { Command } from 'commander';
import chalk from 'chalk';
import { ApiStorageManager } from '../utils/apiStorage.js';
import { Formatter } from '../utils/formatter.js';

const projectCommand = new Command('project');

projectCommand
  .description('Manage projects (now mapped to collections)');

// List projects (collections)
projectCommand
  .command('list')
  .description('List all collections (projects)')
  .action(async () => {
    try {
      console.log(chalk.yellow('ℹ️  Projects are now mapped to Collections in the web UI\n'));
      
      const storage = ApiStorageManager.getInstance();
      const collections = await storage.listCollections();
      
      if (collections.length === 0) {
        console.log(chalk.yellow('No collections found'));
        console.log(chalk.gray('Create one with: postmind collection create <name>'));
        return;
      }
      
      console.log(chalk.bold('Collections:'));
      
      // Convert to old format for formatter
      const formattedCollections = collections.map(col => ({
        name: col.name,
        description: col.description,
        requests: (col.requests || []).map(r => r.name),
        createdAt: col.createdAt,
        updatedAt: col.updatedAt
      }));
      
      console.log(Formatter.formatCollections(formattedCollections as any));
      
      console.log(chalk.gray('\nTip: Use "postmind collection list" instead'));
      
    } catch (error: any) {
      console.error(chalk.red('Error listing collections:'), error.message);
      process.exit(1);
    }
  });

// Switch project (deprecated)
projectCommand
  .command('switch')
  .argument('<name>', 'Collection name')
  .description('Switch project (deprecated - use collections instead)')
  .action(async (name: string) => {
    console.log(chalk.yellow('⚠️  The "project switch" command is deprecated.'));
    console.log(chalk.gray('\nPostmind CLI now works directly with all your collections.'));
    console.log(chalk.gray('You can filter requests by collection using:'));
    console.log(chalk.cyan('  postmind request list -c "' + name + '"'));
  });

// Delete project (deprecated)
projectCommand
  .command('delete')
  .argument('<name>', 'Collection name')
  .description('Delete project (deprecated - use collections instead)')
  .action(async (name: string) => {
    console.log(chalk.yellow('⚠️  The "project delete" command is deprecated.'));
    console.log(chalk.gray('\nTo delete a collection, use:'));
    console.log(chalk.cyan('  postmind collection delete "' + name + '"'));
  });

export { projectCommand };

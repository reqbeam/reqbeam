import { Command } from 'commander';
import chalk from 'chalk';
import { ApiStorageManager } from '../utils/apiStorage.js';

const projectCommand = new Command('project');

projectCommand
  .description('Manage projects (deprecated - use workspace commands instead)');

// List projects (redirects to workspace list)
projectCommand
  .command('list')
  .description('List all projects (deprecated - use workspace list)')
  .action(async () => {
    console.log(chalk.yellow('⚠️  The "project" command is deprecated.'));
    console.log(chalk.gray('\nPlease use "workspace" commands instead:'));
    console.log(chalk.cyan('  reqbeam workspace list\n'));
    
    try {
      const storage = ApiStorageManager.getInstance();
      const workspaces = await storage.listWorkspaces();
      
      if (workspaces.length === 0) {
        console.log(chalk.yellow('No workspaces found'));
        console.log(chalk.gray('Create one with: reqbeam workspace create <name>'));
        return;
      }
      
      console.log(chalk.bold('Workspaces (using workspace command):'));
      workspaces.forEach((workspace) => {
        console.log(chalk.cyan(`  - ${workspace.name}`));
        if (workspace.description) {
          console.log(chalk.gray(`    ${workspace.description}`));
        }
      });
      
    } catch (error: any) {
      console.error(chalk.red('Error listing workspaces:'), error.message);
      process.exit(1);
    }
  });

// Switch project (deprecated, redirects to workspace switch)
projectCommand
  .command('switch')
  .argument('<name>', 'Workspace name or ID')
  .description('Switch project (deprecated - use workspace switch)')
  .action(async (name: string) => {
    console.log(chalk.yellow('⚠️  The "project switch" command is deprecated.'));
    console.log(chalk.gray('\nPlease use:'));
    console.log(chalk.cyan(`  reqbeam workspace switch "${name}"\n`));
    
    try {
      const storage = ApiStorageManager.getInstance();
      
      let workspace = await storage.findWorkspaceByName(name);
      if (!workspace) {
        workspace = await storage.getWorkspace(name);
      }
      
      if (!workspace) {
        console.error(chalk.red(`Workspace "${name}" not found`));
        process.exit(1);
      }
      
      const activated = await storage.activateWorkspace(workspace.id);
      if (activated) {
        console.log(chalk.green(`✓ Switched to workspace "${activated.name}"`));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error switching workspace:'), error.message);
      process.exit(1);
    }
  });

// Delete project (deprecated, redirects to workspace delete)
projectCommand
  .command('delete')
  .argument('<name>', 'Workspace name or ID')
  .description('Delete project (deprecated - use workspace delete)')
  .action(async (name: string) => {
    console.log(chalk.yellow('⚠️  The "project delete" command is deprecated.'));
    console.log(chalk.gray('\nPlease use:'));
    console.log(chalk.cyan(`  reqbeam workspace delete "${name}"\n`));
    
    try {
      const storage = ApiStorageManager.getInstance();
      
      let workspace = await storage.findWorkspaceByName(name);
      if (!workspace) {
        workspace = await storage.getWorkspace(name);
      }
      
      if (!workspace) {
        console.error(chalk.red(`Workspace "${name}" not found`));
        process.exit(1);
      }
      
      const deleted = await storage.deleteWorkspace(workspace.id);
      if (deleted) {
        console.log(chalk.green(`✓ Workspace "${workspace.name}" deleted successfully`));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error deleting workspace:'), error.message);
      process.exit(1);
    }
  });

export { projectCommand };

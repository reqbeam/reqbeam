import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ApiStorageManager } from '../utils/apiStorage.js';

const workspaceCommand = new Command('workspace');

workspaceCommand
  .description('Manage workspaces');

// List workspaces
workspaceCommand
  .command('list')
  .description('List all workspaces')
  .action(async () => {
    try {
      const storage = ApiStorageManager.getInstance();
      const workspaces = await storage.listWorkspaces();
      
      if (workspaces.length === 0) {
        console.log(chalk.yellow('No workspaces found'));
        console.log(chalk.gray('Create one with: postmind workspace create <name>'));
        return;
      }
      
      console.log(chalk.bold('Workspaces:'));
      console.log('');
      
      workspaces.forEach((workspace, index) => {
        const isLast = index === workspaces.length - 1;
        const prefix = isLast ? '└──' : '├──';
        
        console.log(chalk.cyan(`${prefix} ${workspace.name}`));
        if (workspace.description) {
          console.log(chalk.gray(`   ${workspace.description}`));
        }
        
        const counts = workspace._count || { collections: 0, requests: 0, environments: 0 };
        const stats = [];
        if (counts.collections) stats.push(`${counts.collections} collections`);
        if (counts.requests) stats.push(`${counts.requests} requests`);
        if (counts.environments) stats.push(`${counts.environments} environments`);
        
        if (stats.length > 0) {
          console.log(chalk.gray(`   ${stats.join(', ')}`));
        }
        
        if (workspace.owner) {
          console.log(chalk.gray(`   Owner: ${workspace.owner.name || workspace.owner.email}`));
        }
        
        if (!isLast) {
          console.log('');
        }
      });
      
    } catch (error: any) {
      console.error(chalk.red('Error listing workspaces:'), error.message);
      process.exit(1);
    }
  });

// Create workspace
workspaceCommand
  .command('create')
  .argument('[name]', 'Workspace name')
  .option('-d, --description <description>', 'Workspace description')
  .option('-i, --interactive', 'Interactive mode')
  .description('Create a new workspace')
  .action(async (name?: string, options?: { description?: string; interactive?: boolean }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      let workspaceName = name;
      let description = options?.description;
      
      if (options?.interactive || !workspaceName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Workspace name:',
            default: workspaceName,
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Workspace name is required';
              }
              return true;
            },
          },
          {
            type: 'input',
            name: 'description',
            message: 'Workspace description (optional):',
            default: description || '',
          },
        ]);
        
        workspaceName = answers.name;
        description = answers.description || undefined;
      }
      
      if (!workspaceName) {
        console.error(chalk.red('Error: Workspace name is required'));
        process.exit(1);
      }
      
      console.log(chalk.yellow(`Creating workspace "${workspaceName}"...`));
      
      const workspace = await storage.createWorkspace(workspaceName.trim(), description?.trim());
      
      if (!workspace) {
        console.error(chalk.red('Failed to create workspace'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Workspace "${workspace.name}" created successfully`));
      
      if (workspace.description) {
        console.log(chalk.gray(`  Description: ${workspace.description}`));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error creating workspace:'), error.message);
      process.exit(1);
    }
  });

// Switch workspace
workspaceCommand
  .command('switch')
  .argument('<name>', 'Workspace name or ID')
  .description('Switch to a workspace')
  .action(async (name: string) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Try to find by name first
      let workspace = await storage.findWorkspaceByName(name);
      
      // If not found by name, try by ID
      if (!workspace) {
        workspace = await storage.getWorkspace(name);
      }
      
      if (!workspace) {
        console.error(chalk.red(`Workspace "${name}" not found`));
        console.log(chalk.gray('\nAvailable workspaces:'));
        const workspaces = await storage.listWorkspaces();
        workspaces.forEach(w => {
          console.log(chalk.cyan(`  - ${w.name} (${w.id})`));
        });
        process.exit(1);
      }
      
      // Activate the workspace
      const activated = await storage.activateWorkspace(workspace.id);
      
      if (!activated) {
        console.error(chalk.red('Failed to activate workspace'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Switched to workspace "${activated.name}"`));
      
      const counts = activated._count || { collections: 0, requests: 0, environments: 0 };
      if (counts.collections || counts.requests || counts.environments) {
        console.log(chalk.gray(
          `  Collections: ${counts.collections || 0}, ` +
          `Requests: ${counts.requests || 0}, ` +
          `Environments: ${counts.environments || 0}`
        ));
      }
      
    } catch (error: any) {
      console.error(chalk.red('Error switching workspace:'), error.message);
      process.exit(1);
    }
  });

// Delete workspace
workspaceCommand
  .command('delete')
  .argument('<name>', 'Workspace name or ID')
  .option('-f, --force', 'Force deletion without confirmation')
  .description('Delete a workspace')
  .action(async (name: string, options?: { force?: boolean }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Try to find by name first
      let workspace = await storage.findWorkspaceByName(name);
      
      // If not found by name, try by ID
      if (!workspace) {
        workspace = await storage.getWorkspace(name);
      }
      
      if (!workspace) {
        console.error(chalk.red(`Workspace "${name}" not found`));
        process.exit(1);
      }
      
      // Check if user owns the workspace
      if (workspace.ownerId && workspace.owner) {
        // Note: We can't easily check the current user ID from CLI, so we'll rely on the API
        // The API will return an error if the user doesn't have permission
      }
      
      // Confirm deletion unless force flag is set
      if (!options?.force) {
        const counts = workspace._count || { collections: 0, requests: 0, environments: 0 };
        const itemCount = (counts.collections || 0) + (counts.requests || 0) + (counts.environments || 0);
        
        if (itemCount > 0) {
          console.log(chalk.yellow(`⚠️  Warning: This workspace contains:`));
          console.log(chalk.yellow(`   - ${counts.collections || 0} collections`));
          console.log(chalk.yellow(`   - ${counts.requests || 0} requests`));
          console.log(chalk.yellow(`   - ${counts.environments || 0} environments`));
          console.log(chalk.yellow(`All data in this workspace will be deleted!`));
        }
        
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete workspace "${workspace.name}"?`,
            default: false,
          },
        ]);
        
        if (!confirm) {
          console.log(chalk.gray('Deletion cancelled'));
          return;
        }
      }
      
      console.log(chalk.yellow(`Deleting workspace "${workspace.name}"...`));
      
      const deleted = await storage.deleteWorkspace(workspace.id);
      
      if (!deleted) {
        console.error(chalk.red('Failed to delete workspace'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Workspace "${workspace.name}" deleted successfully`));
      
    } catch (error: any) {
      console.error(chalk.red('Error deleting workspace:'), error.message);
      process.exit(1);
    }
  });

// Activate workspace (alias for switch)
workspaceCommand
  .command('activate')
  .argument('<name>', 'Workspace name or ID')
  .description('Activate a workspace (alias for switch)')
  .action(async (name: string) => {
    // Reuse the switch command logic
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
      
      if (!activated) {
        console.error(chalk.red('Failed to activate workspace'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Activated workspace "${activated.name}"`));
      
    } catch (error: any) {
      console.error(chalk.red('Error activating workspace:'), error.message);
      process.exit(1);
    }
  });

export { workspaceCommand };


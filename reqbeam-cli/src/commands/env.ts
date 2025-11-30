import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ApiStorageManager } from '../utils/apiStorage.js';
import { Formatter } from '../utils/formatter.js';

const envCommand = new Command('env');

envCommand
  .description('Manage environments');

// List environments
envCommand
  .command('list')
  .description('List all environments')
  .action(async () => {
    try {
      const storage = ApiStorageManager.getInstance();
      const environments = await storage.listEnvironments();
      
      if (environments.length === 0) {
        console.log(chalk.yellow('No environments found'));
        console.log(chalk.gray('Create one with: reqbeam env add <name> -i'));
        return;
      }
      
      console.log(chalk.bold('Environments:'));
      console.log(Formatter.formatEnvironments(environments));
      
    } catch (error: any) {
      console.error(chalk.red('Error listing environments:'), error.message);
      process.exit(1);
    }
  });

// Add environment
envCommand
  .command('add')
  .argument('<name>', 'Name of the environment to add')
  .description('Add a new environment')
  .option('-i, --interactive', 'Add variables interactively')
  .action(async (name: string, options: { interactive?: boolean }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Check if environment already exists
      const existingEnv = await storage.findEnvironmentByName(name);
      if (existingEnv) {
        console.log(chalk.red(`Environment '${name}' already exists`));
        process.exit(1);
      }

      let variables: Record<string, string> = {};

      if (options.interactive) {
        const { variablesList } = await inquirer.prompt([
          {
            type: 'input',
            name: 'variablesList',
            message: 'Enter variables as key=value pairs (comma-separated):',
            validate: (input: string) => {
              if (!input.trim()) return true; // Allow empty
              const pairs = input.split(',').map(pair => pair.trim());
              return pairs.every(pair => pair.includes('=')) || 'Each variable must be in key=value format';
            }
          }
        ]);

        if (variablesList.trim()) {
          variablesList.split(',').forEach((pair: string) => {
            const [key, value] = pair.trim().split('=');
            if (key && value) {
              variables[key.trim()] = value.trim();
            }
          });
        }
      }

      const environment = await storage.createEnvironment(name, variables);
      
      if (!environment) {
        console.log(chalk.red('Failed to create environment'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Environment '${name}' added successfully`));
      console.log(chalk.gray(`  ID: ${environment.id}`));
      console.log(chalk.gray(`  Variables: ${Object.keys(variables).length}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error adding environment:'), error.message);
      process.exit(1);
    }
  });

// Remove environment
envCommand
  .command('remove')
  .argument('<name>', 'Name of the environment to remove')
  .description('Remove an environment')
  .option('-f, --force', 'Force removal without confirmation')
  .action(async (name: string, options: { force?: boolean }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find environment
      const environment = await storage.findEnvironmentByName(name);
      
      if (!environment) {
        console.log(chalk.red(`Environment '${name}' not found`));
        process.exit(1);
      }

      // Confirm removal unless -f flag is used
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to remove environment '${name}'?`,
            default: false
          }
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Environment removal cancelled'));
          process.exit(0);
        }
      }

      const deleted = await storage.deleteEnvironment(environment.id);
      
      if (!deleted) {
        console.log(chalk.red('Failed to delete environment'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Environment '${name}' removed successfully`));
      
    } catch (error: any) {
      console.error(chalk.red('Error removing environment:'), error.message);
      process.exit(1);
    }
  });

// Switch environment
envCommand
  .command('switch')
  .argument('<name>', 'Name of the environment to activate')
  .description('Switch to a different environment (activate it)')
  .action(async (name: string) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find environment
      const environment = await storage.findEnvironmentByName(name);
      
      if (!environment) {
        console.log(chalk.red(`Environment '${name}' not found`));
        process.exit(1);
      }

      const activated = await storage.activateEnvironment(environment.id);
      
      if (!activated) {
        console.log(chalk.red('Failed to activate environment'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Switched to environment '${name}'`));
      
    } catch (error: any) {
      console.error(chalk.red('Error switching environment:'), error.message);
      process.exit(1);
    }
  });

// Update environment
envCommand
  .command('update')
  .argument('<name>', 'Name of the environment to update')
  .description('Update environment variables')
  .option('-a, --add <variables>', 'Add/update variables as key=value pairs (comma-separated)')
  .option('-r, --remove <keys>', 'Remove variables by keys (comma-separated)')
  .action(async (name: string, options: { add?: string; remove?: string }) => {
    try {
      const storage = ApiStorageManager.getInstance();
      
      // Find environment
      const environment = await storage.findEnvironmentByName(name);
      
      if (!environment) {
        console.log(chalk.red(`Environment '${name}' not found`));
        process.exit(1);
      }

      const variables = { ...environment.variables };

      // Add/update variables
      if (options.add) {
        options.add.split(',').forEach((pair: string) => {
          const [key, value] = pair.trim().split('=');
          if (key && value) {
            variables[key.trim()] = value.trim();
          }
        });
      }

      // Remove variables
      if (options.remove) {
        options.remove.split(',').forEach((key: string) => {
          delete variables[key.trim()];
        });
      }

      const updated = await storage.updateEnvironment(environment.id, undefined, variables);
      
      if (!updated) {
        console.log(chalk.red('Failed to update environment'));
        process.exit(1);
      }
      
      console.log(chalk.green(`✓ Environment '${name}' updated successfully`));
      console.log(chalk.gray(`  Variables: ${Object.keys(variables).length}`));
      
    } catch (error: any) {
      console.error(chalk.red('Error updating environment:'), error.message);
      process.exit(1);
    }
  });

export { envCommand };

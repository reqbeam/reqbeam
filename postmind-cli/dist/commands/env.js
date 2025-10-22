import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { StorageManager } from '../utils/storage.js';
import { Formatter } from '../utils/formatter.js';
const envCommand = new Command('env');
envCommand
    .description('Manage environments');
// List environments
envCommand
    .command('list')
    .description('List all environments in the current project')
    .action(async () => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        console.log(chalk.bold('Environments:'));
        console.log(Formatter.formatEnvironments(config.environments));
    }
    catch (error) {
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
    .action(async (name, options) => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        // Check if environment already exists
        const envExists = config.environments.some(e => e.name === name);
        if (envExists) {
            console.log(chalk.red(`Environment '${name}' already exists`));
            process.exit(1);
        }
        let variables = {};
        if (options.interactive) {
            const { variablesList } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'variablesList',
                    message: 'Enter variables as key=value pairs (comma-separated):',
                    validate: (input) => {
                        if (!input.trim())
                            return true; // Allow empty
                        const pairs = input.split(',').map(pair => pair.trim());
                        return pairs.every(pair => pair.includes('=')) || 'Each variable must be in key=value format';
                    }
                }
            ]);
            if (variablesList.trim()) {
                variablesList.split(',').forEach((pair) => {
                    const [key, value] = pair.trim().split('=');
                    if (key && value) {
                        variables[key.trim()] = value.trim();
                    }
                });
            }
        }
        const environment = {
            name,
            variables,
            isActive: config.environments.length === 0 // First environment is active by default
        };
        config.environments.push(environment);
        await storage.saveProjectConfig(currentProject, config);
        console.log(chalk.green(`✓ Environment '${name}' added successfully`));
    }
    catch (error) {
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
    .action(async (name, options) => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        // Check if environment exists
        const envIndex = config.environments.findIndex(e => e.name === name);
        if (envIndex === -1) {
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
        config.environments.splice(envIndex, 1);
        // If this was the current environment, clear it
        if (config.currentEnvironment === name) {
            config.currentEnvironment = undefined;
        }
        await storage.saveProjectConfig(currentProject, config);
        console.log(chalk.green(`✓ Environment '${name}' removed successfully`));
    }
    catch (error) {
        console.error(chalk.red('Error removing environment:'), error.message);
        process.exit(1);
    }
});
// Switch environment
envCommand
    .command('switch')
    .argument('<name>', 'Name of the environment to switch to')
    .description('Switch to a different environment')
    .action(async (name) => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        // Check if environment exists
        const envExists = config.environments.some(e => e.name === name);
        if (!envExists) {
            console.log(chalk.red(`Environment '${name}' not found`));
            process.exit(1);
        }
        // Update active environment
        config.environments.forEach(env => {
            env.isActive = env.name === name;
        });
        config.currentEnvironment = name;
        await storage.saveProjectConfig(currentProject, config);
        console.log(chalk.green(`✓ Switched to environment '${name}'`));
    }
    catch (error) {
        console.error(chalk.red('Error switching environment:'), error.message);
        process.exit(1);
    }
});
export { envCommand };
//# sourceMappingURL=env.js.map
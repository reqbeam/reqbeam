import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { StorageManager } from '../utils/storage.js';
const initCommand = new Command('init');
initCommand
    .argument('<project_name>', 'Name of the project to initialize')
    .description('Initialize a new API project')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (projectName, options) => {
    try {
        const storage = StorageManager.getInstance();
        // Check if project already exists
        const existingProjects = await storage.listProjects();
        const projectExists = existingProjects.some(p => p.name === projectName);
        if (projectExists) {
            console.log(chalk.red(`Project '${projectName}' already exists`));
            process.exit(1);
        }
        // Confirm creation unless -y flag is used
        if (!options.yes) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Create project '${projectName}'?`,
                    default: true
                }
            ]);
            if (!confirm) {
                console.log(chalk.yellow('Project creation cancelled'));
                process.exit(0);
            }
        }
        // Create project
        await storage.createProject(projectName);
        await storage.setCurrentProject(projectName);
        console.log(chalk.green(`✓ Project '${projectName}' created successfully`));
        console.log(chalk.blue(`✓ Set as current project`));
        console.log(chalk.gray(`Project location: ${storage.getProjectPath(projectName)}`));
    }
    catch (error) {
        console.error(chalk.red('Error creating project:'), error.message);
        process.exit(1);
    }
});
export { initCommand };
//# sourceMappingURL=init.js.map
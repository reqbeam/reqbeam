import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { StorageManager } from '../utils/storage.js';
import { Formatter } from '../utils/formatter.js';
const projectCommand = new Command('project');
projectCommand
    .description('Manage API projects');
// List projects
projectCommand
    .command('list')
    .description('List all projects')
    .action(async () => {
    try {
        const storage = StorageManager.getInstance();
        const projects = await storage.listProjects();
        const currentProject = await storage.getCurrentProject();
        console.log(chalk.bold('Projects:'));
        console.log(Formatter.formatProjects(projects));
        if (currentProject) {
            console.log(chalk.blue(`Current project: ${currentProject}`));
        }
        else {
            console.log(chalk.yellow('No current project set'));
        }
    }
    catch (error) {
        console.error(chalk.red('Error listing projects:'), error.message);
        process.exit(1);
    }
});
// Delete project
projectCommand
    .command('delete')
    .argument('<project_name>', 'Name of the project to delete')
    .description('Delete a project')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (projectName, options) => {
    try {
        const storage = StorageManager.getInstance();
        // Check if project exists
        const projects = await storage.listProjects();
        const projectExists = projects.some(p => p.name === projectName);
        if (!projectExists) {
            console.log(chalk.red(`Project '${projectName}' not found`));
            process.exit(1);
        }
        // Confirm deletion unless -f flag is used
        if (!options.force) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Are you sure you want to delete project '${projectName}'? This action cannot be undone.`,
                    default: false
                }
            ]);
            if (!confirm) {
                console.log(chalk.yellow('Project deletion cancelled'));
                process.exit(0);
            }
        }
        // Delete project
        await storage.deleteProject(projectName);
        // If this was the current project, clear it
        const currentProject = await storage.getCurrentProject();
        if (currentProject === projectName) {
            // Note: We'd need to implement a method to clear current project
            console.log(chalk.yellow('Note: This was your current project. Please set a new current project.'));
        }
        console.log(chalk.green(`✓ Project '${projectName}' deleted successfully`));
    }
    catch (error) {
        console.error(chalk.red('Error deleting project:'), error.message);
        process.exit(1);
    }
});
// Switch project
projectCommand
    .command('switch')
    .argument('<project_name>', 'Name of the project to switch to')
    .description('Switch to a different project')
    .action(async (projectName) => {
    try {
        const storage = StorageManager.getInstance();
        // Check if project exists
        const projects = await storage.listProjects();
        const projectExists = projects.some(p => p.name === projectName);
        if (!projectExists) {
            console.log(chalk.red(`Project '${projectName}' not found`));
            process.exit(1);
        }
        // Switch to project
        await storage.setCurrentProject(projectName);
        console.log(chalk.green(`✓ Switched to project '${projectName}'`));
    }
    catch (error) {
        console.error(chalk.red('Error switching project:'), error.message);
        process.exit(1);
    }
});
export { projectCommand };
//# sourceMappingURL=project.js.map
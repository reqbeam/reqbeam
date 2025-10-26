import { Command } from 'commander';
import chalk from 'chalk';

const initCommand = new Command('init');

initCommand
  .argument('[project_name]', 'Name of the project (deprecated)')
  .description('Initialize Postmind CLI (authentication required)')
  .action(async (projectName?: string) => {
    console.log(chalk.yellow('⚠️  The init command is deprecated.'));
    console.log(chalk.gray('\nPostmind CLI now syncs directly with the web UI database.'));
    console.log(chalk.gray('All your collections, requests, and environments are stored in the cloud.\n'));
    
    console.log(chalk.bold('Getting Started:'));
    console.log(chalk.cyan('  1. Log in to Postmind:'));
    console.log(chalk.gray('     postmind auth login\n'));
    
    console.log(chalk.cyan('  2. Create a collection:'));
    console.log(chalk.gray('     postmind collection create "My API"\n'));
    
    console.log(chalk.cyan('  3. Add a request:'));
    console.log(chalk.gray('     postmind request create -i\n'));
    
    console.log(chalk.cyan('  4. Run your request:'));
    console.log(chalk.gray('     postmind run request "My Request"\n'));
    
    console.log(chalk.gray('For more help, run: postmind --help'));
  });

export { initCommand };

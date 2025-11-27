import { Command } from 'commander';
import chalk from 'chalk';

const helpCommand = new Command('help');

helpCommand
  .description('Show help menu for available commands')
  .argument('[command]', 'Specific command to get help for')
  .action(async (commandName?: string) => {
    if (commandName) {
      // Show help for specific command
      console.log(chalk.bold(`\nHelp for: ${chalk.cyan(commandName)}\n`));
      console.log(chalk.gray('Run the following command for detailed help:'));
      console.log(chalk.cyan(`  reqbeam ${commandName} --help\n`));
      return;
    }

    // Show general help menu
    console.log(chalk.bold('\n📚 Reqbeam CLI - Help Menu\n'));
    console.log(chalk.gray('A TypeScript-based CLI tool for managing API projects, environments, requests, and collections'));
    console.log(chalk.gray('All data is synced with the Reqbeam web UI in real-time.\n'));

    console.log(chalk.bold('🔐 Authentication\n'));
    console.log(chalk.cyan('  auth login          ') + chalk.gray('Login to Reqbeam web UI'));
    console.log(chalk.cyan('  auth logout         ') + chalk.gray('Logout from Reqbeam web UI'));
    console.log(chalk.cyan('  auth status         ') + chalk.gray('Check authentication status'));
    console.log(chalk.gray('  Example: reqbeam auth login\n'));

    console.log(chalk.bold('👥 Workspace Management\n'));
    console.log(chalk.cyan('  workspace list      ') + chalk.gray('List all workspaces'));
    console.log(chalk.cyan('  workspace create    ') + chalk.gray('Create a new workspace'));
    console.log(chalk.cyan('  workspace switch    ') + chalk.gray('Switch to a workspace'));
    console.log(chalk.cyan('  workspace delete    ') + chalk.gray('Delete a workspace'));
    console.log(chalk.cyan('  workspace activate  ') + chalk.gray('Activate a workspace (alias for switch)'));
    console.log(chalk.cyan('  workspace select    ') + chalk.gray('Select a workspace to work on'));
    console.log(chalk.gray('  Example: reqbeam workspace list\n'));

    console.log(chalk.bold('📁 Collection Management\n'));
    console.log(chalk.cyan('  collection create   ') + chalk.gray('Create a new collection'));
    console.log(chalk.cyan('  collection list     ') + chalk.gray('List all collections'));
    console.log(chalk.cyan('  collection add      ') + chalk.gray('Add request to collection'));
    console.log(chalk.cyan('  collection remove   ') + chalk.gray('Remove request from collection'));
    console.log(chalk.cyan('  collection delete   ') + chalk.gray('Delete a collection'));
    console.log(chalk.cyan('  collection update   ') + chalk.gray('Update a collection'));
    console.log(chalk.cyan('  collection select   ') + chalk.gray('Select a collection to work on'));
    console.log(chalk.gray('  Example: reqbeam collection create "My API"\n'));

    console.log(chalk.bold('🌐 Request Management\n'));
    console.log(chalk.cyan('  request create      ') + chalk.gray('Create a new request'));
    console.log(chalk.cyan('  request list        ') + chalk.gray('List all requests'));
    console.log(chalk.cyan('  request update      ') + chalk.gray('Update an existing request'));
    console.log(chalk.cyan('  request delete      ') + chalk.gray('Delete a request'));
    console.log(chalk.gray('  Example: reqbeam request create -i\n'));

    console.log(chalk.bold('🌍 Environment Management\n'));
    console.log(chalk.cyan('  env list            ') + chalk.gray('List all environments'));
    console.log(chalk.cyan('  env add             ') + chalk.gray('Add a new environment'));
    console.log(chalk.cyan('  env remove          ') + chalk.gray('Remove an environment'));
    console.log(chalk.cyan('  env switch          ') + chalk.gray('Switch to a different environment'));
    console.log(chalk.cyan('  env update          ') + chalk.gray('Update environment variables'));
    console.log(chalk.gray('  Example: reqbeam env list\n'));

    console.log(chalk.bold('▶️  Execution\n'));
    console.log(chalk.cyan('  run request <name>  ') + chalk.gray('Run a single request'));
    console.log(chalk.cyan('  run collection <name>') + chalk.gray('Run all requests in a collection'));
    console.log(chalk.gray('  Example: reqbeam run request "Get Users"\n'));

    console.log(chalk.bold('🧪 Testing & Automation\n'));
    console.log(chalk.cyan('  test run            ') + chalk.gray('Run tests for single request or all'));
    console.log(chalk.cyan('  test generate       ') + chalk.gray('Auto-generate test skeleton files'));
    console.log(chalk.cyan('  test schedule       ') + chalk.gray('Schedule periodic test runs'));
    console.log(chalk.cyan('  test list           ') + chalk.gray('List all scheduled test jobs'));
    console.log(chalk.cyan('  test stop           ') + chalk.gray('Stop a scheduled test job'));
    console.log(chalk.cyan('  test delete         ') + chalk.gray('Delete a scheduled test job'));
    console.log(chalk.gray('  Example: reqbeam test run\n'));

    console.log(chalk.bold('📊 Logging & Monitoring\n'));
    console.log(chalk.cyan('  logs list           ') + chalk.gray('List past executions'));
    console.log(chalk.cyan('  logs view <id>       ') + chalk.gray('View details of specific log'));
    console.log(chalk.cyan('  logs export         ') + chalk.gray('Export all logs to JSON or CSV'));
    console.log(chalk.cyan('  logs clear          ') + chalk.gray('Clear all local logs'));
    console.log(chalk.cyan('  logs summary        ') + chalk.gray('Show log summary statistics'));
    console.log(chalk.gray('  Example: reqbeam logs list\n'));

    console.log(chalk.bold('📖 Additional Help\n'));
    console.log(chalk.gray('  • Use "rb" as a shorter alias for "reqbeam"'));
    console.log(chalk.gray('  • Get help for a specific command: reqbeam <command> --help'));
    console.log(chalk.gray('  • Example: reqbeam auth --help'));
    console.log(chalk.gray('  • All commands require authentication (except auth commands)'));
    console.log(chalk.gray('  • All executions are automatically logged to web UI history\n'));
  });

export { helpCommand };


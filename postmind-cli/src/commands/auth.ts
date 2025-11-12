import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { AuthManager } from '../utils/auth.js';

const authCommand = new Command('auth');

authCommand
  .description('Authentication commands for connecting to Postmind web UI');

// Login command
authCommand
  .command('login')
  .description('Login to Postmind web UI')
  .option('-e, --email <email>', 'Email address')
  .option('-p, --password <password>', 'Password')
  .option('-u, --url <url>', 'API URL (default: http://localhost:3000)')
  .action(async (options: {
    email?: string;
    password?: string;
    url?: string;
  }) => {
    try {
      const authManager = AuthManager.getInstance();

      // Check if already logged in
      const isAuth = await authManager.isAuthenticated();
      if (isAuth) {
        const config = await authManager.loadConfig();
        if (config) {
          console.log(chalk.yellow('Already logged in as:'), chalk.cyan(config.user.email));
          console.log(chalk.yellow('Logout first to login with different account.'));
          return;
        }
      }

      // Prompt for credentials if not provided
      let email = options.email;
      let password = options.password;
      // Use environment variable if available (for Docker), otherwise default to localhost
      const defaultApiUrl = process.env.POSTMIND_API_URL || 'http://localhost:3000';
      let apiUrl = options.url || defaultApiUrl;

      if (!email || !password) {
        console.log(chalk.bold('Postmind Authentication'));
        console.log(chalk.gray('Connect your CLI to the Postmind web UI\n'));

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'apiUrl',
            message: 'API URL:',
            default: defaultApiUrl,
            when: !options.url,
          },
          {
            type: 'input',
            name: 'email',
            message: 'Email:',
            when: !options.email,
            validate: (input: string) => {
              return input.trim() ? true : 'Email is required';
            },
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password:',
            when: !options.password,
            validate: (input: string) => {
              return input.trim() ? true : 'Password is required';
            },
          },
        ]);

        if (answers.apiUrl) apiUrl = answers.apiUrl;
        if (answers.email) email = answers.email;
        if (answers.password) password = answers.password;
      }

      if (!email || !password) {
        console.log(chalk.red('Email and password are required'));
        process.exit(1);
      }

      console.log(chalk.blue('Authenticating...'));
      const spinner = await import('ora').then(m => m.default('Logging in...'));
      spinner.start();

      const config = await authManager.login(email, password, apiUrl);
      
      spinner.stop();
      console.log(chalk.green('✓ Successfully logged in!'));
      console.log(chalk.gray(`Logged in as: ${chalk.cyan(config.user.email)}`));
      
    } catch (error: any) {
      console.error(chalk.red('Login failed:'), error.message);
      process.exit(1);
    }
  });

// Logout command
authCommand
  .command('logout')
  .description('Logout from Postmind web UI')
  .action(async () => {
    try {
      const authManager = AuthManager.getInstance();

      const isAuth = await authManager.isAuthenticated();
      if (!isAuth) {
        console.log(chalk.yellow('Not logged in'));
        return;
      }

      await authManager.logout();
      console.log(chalk.green('✓ Successfully logged out'));

    } catch (error: any) {
      console.error(chalk.red('Logout failed:'), error.message);
      process.exit(1);
    }
  });

// Status command
authCommand
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    try {
      const authManager = AuthManager.getInstance();

      const config = await authManager.loadConfig();
      
      if (!config) {
        console.log(chalk.yellow('Not logged in'));
        console.log(chalk.gray('Run "postmind auth login" to authenticate'));
        return;
      }

      const expiresAt = new Date(config.expiresAt);
      const now = new Date();
      const isValid = expiresAt > now;

      console.log(chalk.bold('Authentication Status:'));
      console.log(`  Email: ${chalk.cyan(config.user.email)}`);
      console.log(`  Name: ${chalk.cyan(config.user.name)}`);
      console.log(`  API URL: ${chalk.cyan(config.apiUrl)}`);
      console.log(`  Expires: ${chalk.cyan(expiresAt.toLocaleString())}`);
      console.log(`  Status: ${isValid ? chalk.green('Valid') : chalk.red('Expired')}`);

      // Validate token with server
      console.log('\nValidating token...');
      const isValidToken = await authManager.validateToken();
      console.log(`  Token validation: ${isValidToken ? chalk.green('Valid') : chalk.red('Invalid')}`);

    } catch (error: any) {
      console.error(chalk.red('Error checking status:'), error.message);
      process.exit(1);
    }
  });

export { authCommand };


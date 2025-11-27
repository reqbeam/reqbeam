import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { AuthManager } from '../utils/auth.js';
import { randomUUID } from 'crypto';
import open from 'open';

const authCommand = new Command('auth');

authCommand
  .description('Authentication commands for Reqbeam CLI');

// Helper function to poll for CLI session completion
async function pollCliSession(sessionId: string, apiUrl: string = 'http://localhost:3000'): Promise<{
  token: string;
  user: { id: string; email: string; name: string | null };
  expiresAt: string;
} | null> {
  const maxAttempts = 120; // 2 minutes (120 * 1 second)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${apiUrl}/api/auth/cli/session?sessionId=${sessionId}`);
      
      if (response.status === 404 || response.status === 410) {
        return null; // Session expired or not found
      }

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'authenticated' && data.token && data.user) {
          return {
            token: data.token,
            user: data.user,
            expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
      }
    } catch (error) {
      // Continue polling on error
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before next poll
  }

  return null; // Timeout
}

// Login command
authCommand
  .command('login')
  .description('Login to Reqbeam (opens browser for authentication)')
  .option('-e, --email <email>', 'Email address (for direct login)')
  .option('-p, --password <password>', 'Password (for direct login)')
  .option('--browser', 'Force browser-based login')
  .option('--api-url <url>', 'API URL (default: http://localhost:3000)')
  .action(async (options: {
    email?: string;
    password?: string;
    browser?: boolean;
    apiUrl?: string;
  }) => {
    try {
      const authManager = AuthManager.getInstance();
      const apiUrl = options.apiUrl || 'http://localhost:3000';

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

      // If email and password provided and browser flag not set, use direct login
      if (options.email && options.password && !options.browser) {
        console.log(chalk.blue('Authenticating...'));
        const spinner = await import('ora').then(m => m.default('Logging in...'));
        spinner.start();

        const config = await authManager.login(options.email, options.password);
        
        spinner.stop();
        console.log(chalk.green('✓ Successfully logged in!'));
        console.log(chalk.gray(`Logged in as: ${chalk.cyan(config.user.email)}`));
        return;
      }

      // Browser-based login flow
      console.log(chalk.bold('Reqbeam CLI Authentication'));
      console.log(chalk.gray('Opening browser for login...\n'));

      // Generate session ID
      const sessionId = randomUUID();
      
      // Create session on server
      let sessionCreated = false;
      try {
        const createResponse = await fetch(`${apiUrl}/api/auth/cli/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (createResponse.ok) {
          sessionCreated = true;
        } else {
          const errorText = await createResponse.text();
          console.error(chalk.yellow(`Warning: Failed to create session on server (${createResponse.status})`));
          console.error(chalk.gray(`Server response: ${errorText}`));
          console.log(chalk.yellow('Will still attempt to open browser. Make sure the server is running.\n'));
        }
      } catch (error: any) {
        console.error(chalk.yellow(`Warning: Could not connect to server at ${apiUrl}`));
        console.error(chalk.gray(`Error: ${error.message}`));
        console.log(chalk.yellow('\nMake sure the Next.js server is running:'));
        console.log(chalk.cyan('  cd reqbeam && npm run dev\n'));
        console.log(chalk.yellow('Will still attempt to open browser. You can create the session manually.\n'));
      }

      // Open browser regardless of session creation status
      // The web page can handle the case where session doesn't exist yet
      const loginUrl = `${apiUrl}/auth/cli-login?sessionId=${sessionId}`;
      console.log(chalk.cyan(`Opening browser: ${loginUrl}\n`));
      
      try {
        await open(loginUrl);
        console.log(chalk.green('✓ Browser opened successfully\n'));
      } catch (error: any) {
        console.log(chalk.yellow('Could not open browser automatically.'));
        console.log(chalk.cyan(`Please open this URL in your browser:\n${loginUrl}\n`));
      }

      // If session wasn't created, try to create it now (server might have started)
      if (!sessionCreated) {
        console.log(chalk.blue('Attempting to create session...'));
        try {
          const retryResponse = await fetch(`${apiUrl}/api/auth/cli/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });
          if (retryResponse.ok) {
            console.log(chalk.green('✓ Session created successfully\n'));
            sessionCreated = true;
          }
        } catch (error) {
          // Ignore retry errors, user can still login manually
        }
      }

      // Poll for authentication
      if (!sessionCreated) {
        console.log(chalk.yellow('Note: Server connection issue detected.'));
        console.log(chalk.yellow('If login fails, the server may not be running.\n'));
      }

      console.log(chalk.blue('Waiting for authentication...'));
      console.log(chalk.gray('Complete the login in your browser.\n'));

      const spinner = await import('ora').then(m => m.default('Waiting for login...'));
      spinner.start();

      const authData = await pollCliSession(sessionId, apiUrl);

      spinner.stop();

      if (!authData) {
        console.log(chalk.red('✗ Login timeout or session expired'));
        console.log(chalk.yellow('\nPossible reasons:'));
        console.log(chalk.yellow('  1. Server is not running - start it with: cd reqbeam && npm run dev'));
        console.log(chalk.yellow('  2. Login was not completed in browser'));
        console.log(chalk.yellow('  3. Session expired (took too long)'));
        console.log(chalk.yellow('\nYou can try:'));
        console.log(chalk.cyan('  rb auth login --email <email> --password <password>'));
        console.log(chalk.cyan('  (for direct login without browser)'));
        process.exit(1);
      }

      // Save authentication config
      const config = {
        token: authData.token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.name || authData.user.email.split('@')[0], // Fallback to email prefix if name is null
        },
        apiUrl: apiUrl,
        expiresAt: authData.expiresAt,
      };

      await authManager.saveConfig(config);

      console.log(chalk.green('✓ Successfully logged in!'));
      console.log(chalk.gray(`Logged in as: ${chalk.cyan(authData.user.email)}`));
      
    } catch (error: any) {
      console.error(chalk.red('Login failed:'), error.message);
      process.exit(1);
    }
  });

// Logout command
authCommand
  .command('logout')
  .description('Logout from Reqbeam CLI')
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
        console.log(chalk.gray('Run "reqbeam auth login" to authenticate'));
        return;
      }

      const expiresAt = new Date(config.expiresAt);
      const now = new Date();
      const isValid = expiresAt > now;

      console.log(chalk.bold('Authentication Status:'));
      console.log(`  Email: ${chalk.cyan(config.user.email)}`);
      console.log(`  Name: ${chalk.cyan(config.user.name)}`);
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


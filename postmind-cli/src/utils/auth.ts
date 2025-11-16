import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import bcrypt from 'bcryptjs';
import { UserService } from '@postmind/db';
import { DatabaseManager } from './db.js';

export interface AuthConfig {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  apiUrl?: string; // Deprecated, kept for backward compatibility
  expiresAt: string;
}

export class AuthManager {
  private static instance: AuthManager;
  private configPath: string;

  private constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.postmind');
    this.configPath = path.join(configDir, 'auth.json');
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Load authentication configuration
   */
  public async loadConfig(): Promise<AuthConfig | null> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const data = await fs.readJson(this.configPath);
        
        // Check if token is expired
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          console.log(chalk.yellow('Authentication token expired. Please log in again.'));
          return null;
        }
        
        return data as AuthConfig;
      }
      return null;
    } catch (error) {
      console.error('Error loading auth config:', error);
      return null;
    }
  }

  /**
   * Save authentication configuration
   */
  public async saveConfig(config: AuthConfig): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.ensureDir(configDir);
      await fs.writeJson(this.configPath, config, { spaces: 2 });
    } catch (error) {
      console.error('Error saving auth config:', error);
      throw error;
    }
  }

  /**
   * Login with credentials using direct database access
   */
  public async login(email: string, password: string, apiUrl?: string): Promise<AuthConfig> {
    try {
      const dbManager = DatabaseManager.getInstance();
      const prisma = await dbManager.getPrisma();
      const userService = new UserService(prisma);

      // Get user from database
      const user = await userService.getUserByEmail(email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user has a password (OAuth users don't have passwords)
      if (!user.password) {
        throw new Error('This account uses OAuth login. Please use the web interface.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate a simple token (user ID for validation)
      // Since we're using direct DB access, we don't need complex JWT tokens
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const config: AuthConfig = {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || email.split('@')[0],
        },
        apiUrl: apiUrl || 'local', // Not used anymore, but kept for backward compatibility
        expiresAt,
      };

      await this.saveConfig(config);
      return config;
    } catch (error: any) {
      if (error.message.includes('Invalid') || error.message.includes('OAuth')) {
        throw error;
      }
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Logout (clear saved credentials)
   */
  public async logout(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        await fs.remove(this.configPath);
      }
    } catch (error) {
      console.error('Error clearing auth config:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  public async getCurrentUser(): Promise<AuthConfig['user'] | null> {
    const config = await this.loadConfig();
    return config?.user || null;
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const config = await this.loadConfig();
    return config !== null;
  }

  /**
   * Get authentication headers for API requests
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const config = await this.loadConfig();
    
    if (!config) {
      throw new Error('Not authenticated. Please run "postmind login" first.');
    }

    return {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Require authentication - throws error if not authenticated
   */
  public async requireAuth(): Promise<AuthConfig> {
    const config = await this.loadConfig();
    
    if (!config) {
      console.log(chalk.red('❌ Authentication required'));
      console.log(chalk.yellow('Please log in to use Postmind CLI:'));
      console.log(chalk.cyan('  postmind auth login'));
      console.log(chalk.gray('\nFor more information, see: postmind auth --help'));
      process.exit(1);
    }

    // Check if token is expired
    if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
      console.log(chalk.red('❌ Authentication token expired'));
      console.log(chalk.yellow('Please log in again:'));
      console.log(chalk.cyan('  postmind auth login'));
      process.exit(1);
    }

    return config;
  }

  /**
   * Check if authentication is required for a command
   */
  public async checkAuthRequired(commandName: string): Promise<void> {
    // Commands that don't require authentication
    const publicCommands = [
      'auth',
      'help',
      '--help',
      '-h',
      'version',
      '--version',
      '-v',
      'postmind' // Main command name
    ];

    // Check if this is a public command
    const isPublicCommand = publicCommands.some(cmd => 
      commandName.includes(cmd) || cmd.includes(commandName)
    );

    if (!isPublicCommand) {
      await this.requireAuth();
    }
  }

  /**
   * Validate token by checking if user exists in database
   */
  public async validateToken(): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      if (!config) return false;

      // Check if token is expired
      if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
        return false;
      }

      // Validate user exists in database
      const dbManager = DatabaseManager.getInstance();
      const prisma = await dbManager.getPrisma();
      const userService = new UserService(prisma);
      const user = await userService.getUserById(config.user.id);

      return user !== null;
    } catch (error) {
      return false;
    }
  }
}

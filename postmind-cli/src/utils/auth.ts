import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import axios from 'axios';
import { Logger } from './logger.js';

export interface AuthConfig {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  apiUrl: string;
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
   * Login with credentials
   */
  public async login(email: string, password: string, apiUrl: string): Promise<AuthConfig> {
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });

      const config: AuthConfig = {
        token: response.data.token,
        user: response.data.user,
        apiUrl,
        expiresAt: response.data.expiresAt,
      };

      await this.saveConfig(config);
      return config;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw new Error(error.response?.data?.message || 'Login failed');
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
   * Validate token with server
   */
  public async validateToken(): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      if (!config) return false;

      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${config.apiUrl}/api/auth/token`, { headers });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

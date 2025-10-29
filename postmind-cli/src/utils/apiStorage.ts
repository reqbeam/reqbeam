import { ApiClient, Collection, Request, Environment, Workspace } from './apiClient.js';
import chalk from 'chalk';

/**
 * API-based Storage Manager
 * Replaces file-based storage with API calls to the web UI database
 */
export class ApiStorageManager {
  private static instance: ApiStorageManager;
  private apiClient: ApiClient;

  private constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  public static getInstance(): ApiStorageManager {
    if (!ApiStorageManager.instance) {
      ApiStorageManager.instance = new ApiStorageManager();
    }
    return ApiStorageManager.instance;
  }

  // ===== Workspaces =====

  async listWorkspaces(): Promise<Workspace[]> {
    try {
      return await this.apiClient.getWorkspaces();
    } catch (error: any) {
      console.error(chalk.red('Error fetching workspaces:'), error.message);
      return [];
    }
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    try {
      return await this.apiClient.getWorkspace(id);
    } catch (error: any) {
      console.error(chalk.red('Error fetching workspace:'), error.message);
      return null;
    }
  }

  async findWorkspaceByName(name: string): Promise<Workspace | null> {
    const workspaces = await this.listWorkspaces();
    return workspaces.find(w => w.name === name) || null;
  }

  async createWorkspace(name: string, description?: string): Promise<Workspace | null> {
    try {
      return await this.apiClient.createWorkspace({ name, description });
    } catch (error: any) {
      console.error(chalk.red('Error creating workspace:'), error.message);
      return null;
    }
  }

  async updateWorkspace(id: string, name?: string, description?: string): Promise<Workspace | null> {
    try {
      return await this.apiClient.updateWorkspace(id, { name, description });
    } catch (error: any) {
      console.error(chalk.red('Error updating workspace:'), error.message);
      return null;
    }
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    try {
      await this.apiClient.deleteWorkspace(id);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting workspace:'), error.message);
      return false;
    }
  }

  async activateWorkspace(id: string): Promise<Workspace | null> {
    try {
      return await this.apiClient.activateWorkspace(id);
    } catch (error: any) {
      console.error(chalk.red('Error activating workspace:'), error.message);
      return null;
    }
  }

  // ===== Collections (replaces Projects) =====

  async listCollections(): Promise<Collection[]> {
    try {
      return await this.apiClient.getCollections();
    } catch (error: any) {
      console.error(chalk.red('Error fetching collections:'), error.message);
      return [];
    }
  }

  async getCollection(id: string): Promise<Collection | null> {
    try {
      return await this.apiClient.getCollection(id);
    } catch (error: any) {
      console.error(chalk.red('Error fetching collection:'), error.message);
      return null;
    }
  }

  async createCollection(name: string, description?: string): Promise<Collection | null> {
    try {
      return await this.apiClient.createCollection({ name, description });
    } catch (error: any) {
      console.error(chalk.red('Error creating collection:'), error.message);
      return null;
    }
  }

  async updateCollection(id: string, name?: string, description?: string): Promise<Collection | null> {
    try {
      return await this.apiClient.updateCollection(id, { name, description });
    } catch (error: any) {
      console.error(chalk.red('Error updating collection:'), error.message);
      return null;
    }
  }

  async deleteCollection(id: string): Promise<boolean> {
    try {
      await this.apiClient.deleteCollection(id);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting collection:'), error.message);
      return false;
    }
  }

  // ===== Requests =====

  async listRequests(collectionId?: string): Promise<Request[]> {
    try {
      return await this.apiClient.getRequests(collectionId);
    } catch (error: any) {
      console.error(chalk.red('Error fetching requests:'), error.message);
      return [];
    }
  }

  async getRequest(id: string): Promise<Request | null> {
    try {
      return await this.apiClient.getRequest(id);
    } catch (error: any) {
      console.error(chalk.red('Error fetching request:'), error.message);
      return null;
    }
  }

  async findRequestByName(name: string, collectionId?: string): Promise<Request | null> {
    const requests = await this.listRequests(collectionId);
    return requests.find(r => r.name === name) || null;
  }

  async createRequest(data: {
    name: string;
    method: string;
    url: string;
    headers?: any;
    body?: string;
    bodyType?: string;
    collectionId?: string;
  }): Promise<Request | null> {
    try {
      return await this.apiClient.createRequest(data);
    } catch (error: any) {
      console.error(chalk.red('Error creating request:'), error.message);
      return null;
    }
  }

  async updateRequest(id: string, data: {
    name?: string;
    method?: string;
    url?: string;
    headers?: any;
    body?: string;
    bodyType?: string;
    collectionId?: string;
  }): Promise<Request | null> {
    try {
      return await this.apiClient.updateRequest(id, data);
    } catch (error: any) {
      console.error(chalk.red('Error updating request:'), error.message);
      return null;
    }
  }

  async deleteRequest(id: string): Promise<boolean> {
    try {
      await this.apiClient.deleteRequest(id);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting request:'), error.message);
      return false;
    }
  }

  // ===== Environments =====

  async listEnvironments(): Promise<Environment[]> {
    try {
      return await this.apiClient.getEnvironments();
    } catch (error: any) {
      console.error(chalk.red('Error fetching environments:'), error.message);
      return [];
    }
  }

  async getEnvironment(id: string): Promise<Environment | null> {
    try {
      return await this.apiClient.getEnvironment(id);
    } catch (error: any) {
      console.error(chalk.red('Error fetching environment:'), error.message);
      return null;
    }
  }

  async getActiveEnvironment(): Promise<Environment | null> {
    const environments = await this.listEnvironments();
    return environments.find(e => e.isActive) || null;
  }

  async findEnvironmentByName(name: string): Promise<Environment | null> {
    const environments = await this.listEnvironments();
    return environments.find(e => e.name === name) || null;
  }

  async createEnvironment(name: string, variables: Record<string, string>): Promise<Environment | null> {
    try {
      return await this.apiClient.createEnvironment({ name, variables });
    } catch (error: any) {
      console.error(chalk.red('Error creating environment:'), error.message);
      return null;
    }
  }

  async updateEnvironment(id: string, name?: string, variables?: Record<string, string>): Promise<Environment | null> {
    try {
      return await this.apiClient.updateEnvironment(id, { name, variables });
    } catch (error: any) {
      console.error(chalk.red('Error updating environment:'), error.message);
      return null;
    }
  }

  async deleteEnvironment(id: string): Promise<boolean> {
    try {
      await this.apiClient.deleteEnvironment(id);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting environment:'), error.message);
      return false;
    }
  }

  async activateEnvironment(id: string): Promise<Environment | null> {
    try {
      return await this.apiClient.activateEnvironment(id);
    } catch (error: any) {
      console.error(chalk.red('Error activating environment:'), error.message);
      return null;
    }
  }

  // ===== History =====

  async getHistory(): Promise<any[]> {
    try {
      return await this.apiClient.getHistory();
    } catch (error: any) {
      console.error(chalk.red('Error fetching history:'), error.message);
      return [];
    }
  }

  async clearHistory(): Promise<boolean> {
    try {
      await this.apiClient.clearHistory();
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error clearing history:'), error.message);
      return false;
    }
  }

  // ===== Request Execution =====

  async sendRequest(data: {
    method: string;
    url: string;
    headers?: any;
    body?: string;
    bodyType?: string;
  }): Promise<any> {
    try {
      return await this.apiClient.sendRequest(data);
    } catch (error: any) {
      console.error(chalk.red('Error sending request:'), error.message);
      throw error;
    }
  }

  // ===== History Logging =====

  async saveToHistory(data: {
    method: string;
    url: string;
    statusCode?: number;
    duration?: number;
    error?: string;
  }): Promise<void> {
    try {
      await this.apiClient.saveHistory(data);
    } catch (error: any) {
      // Silently fail - history logging is not critical
      console.error(chalk.gray('Warning: Failed to save to history'));
    }
  }
}


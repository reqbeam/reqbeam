import {
  CollectionService,
  RequestService,
  EnvironmentService,
  WorkspaceService,
  HistoryService,
  Collection,
  Request,
  Environment,
  Workspace,
} from '@reqbeam/db';
import { DatabaseManager } from './db.js';
import { ContextManager } from './context.js';
import chalk from 'chalk';

/**
 * Database-based Storage Manager
 * Uses the shared @reqbeam/db package for direct database access
 */
export class ApiStorageManager {
  private static instance: ApiStorageManager;
  private dbManager: DatabaseManager;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public static getInstance(): ApiStorageManager {
    if (!ApiStorageManager.instance) {
      ApiStorageManager.instance = new ApiStorageManager();
    }
    return ApiStorageManager.instance;
  }

  // Helper to get user ID and workspace context
  private async getContext() {
    const userId = await this.dbManager.getCurrentUserId();
    const ctx = ContextManager.getInstance();
    const activeWorkspace = await ctx.getActiveWorkspace();
    return { userId, workspaceId: activeWorkspace?.id };
  }

  // ===== Workspaces =====

  async listWorkspaces(): Promise<Workspace[]> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const workspaceService = new WorkspaceService(prisma);
      return await workspaceService.getWorkspaces(userId);
    } catch (error: any) {
      console.error(chalk.red('Error fetching workspaces:'), error.message);
      return [];
    }
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const workspaceService = new WorkspaceService(prisma);
      return await workspaceService.getWorkspace(id, userId);
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
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const workspaceService = new WorkspaceService(prisma);
      return await workspaceService.createWorkspace(userId, { name, description });
    } catch (error: any) {
      console.error(chalk.red('Error creating workspace:'), error.message);
      return null;
    }
  }

  async updateWorkspace(id: string, name?: string, description?: string): Promise<Workspace | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const workspaceService = new WorkspaceService(prisma);
      return await workspaceService.updateWorkspace(id, userId, { name, description });
    } catch (error: any) {
      console.error(chalk.red('Error updating workspace:'), error.message);
      return null;
    }
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const workspaceService = new WorkspaceService(prisma);
      await workspaceService.deleteWorkspace(id, userId);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting workspace:'), error.message);
      return false;
    }
  }

  async activateWorkspace(id: string): Promise<Workspace | null> {
    // Workspace activation is just setting it as active in context
    // The actual activation logic is handled by the workspace service
    try {
      const workspace = await this.getWorkspace(id);
      if (workspace) {
        const ctx = ContextManager.getInstance();
        await ctx.setActiveWorkspace({ id: workspace.id, name: workspace.name });
      }
      return workspace;
    } catch (error: any) {
      console.error(chalk.red('Error activating workspace:'), error.message);
      return null;
    }
  }

  // ===== Collections =====

  async listCollections(): Promise<Collection[]> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const collectionService = new CollectionService(prisma);
      return await collectionService.getCollections(userId, {
        workspaceId: workspaceId || undefined,
      });
    } catch (error: any) {
      console.error(chalk.red('Error fetching collections:'), error.message);
      return [];
    }
  }

  async getCollection(id: string): Promise<Collection | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const collectionService = new CollectionService(prisma);
      return await collectionService.getCollection(id, userId);
    } catch (error: any) {
      console.error(chalk.red('Error fetching collection:'), error.message);
      return null;
    }
  }

  async createCollection(name: string, description?: string): Promise<Collection | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const collectionService = new CollectionService(prisma);
      return await collectionService.createCollection(userId, {
        name,
        description,
        workspaceId: workspaceId || undefined,
      });
    } catch (error: any) {
      console.error(chalk.red('Error creating collection:'), error.message);
      return null;
    }
  }

  async updateCollection(id: string, name?: string, description?: string): Promise<Collection | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const collectionService = new CollectionService(prisma);
      return await collectionService.updateCollection(id, userId, { name, description });
    } catch (error: any) {
      console.error(chalk.red('Error updating collection:'), error.message);
      return null;
    }
  }

  async deleteCollection(id: string): Promise<boolean> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const collectionService = new CollectionService(prisma);
      await collectionService.deleteCollection(id, userId);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting collection:'), error.message);
      return false;
    }
  }

  // ===== Requests =====

  async listRequests(collectionId?: string): Promise<Request[]> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const requestService = new RequestService(prisma);
      return await requestService.getRequests(userId, {
        workspaceId: workspaceId || undefined,
        collectionId,
      });
    } catch (error: any) {
      console.error(chalk.red('Error fetching requests:'), error.message);
      return [];
    }
  }

  async getRequest(id: string): Promise<Request | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const requestService = new RequestService(prisma);
      return await requestService.getRequest(id, userId);
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
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const requestService = new RequestService(prisma);
      return await requestService.createRequest(userId, {
        ...data,
        workspaceId: workspaceId || undefined,
      });
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
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const requestService = new RequestService(prisma);
      return await requestService.updateRequest(id, userId, data);
    } catch (error: any) {
      console.error(chalk.red('Error updating request:'), error.message);
      return null;
    }
  }

  async deleteRequest(id: string): Promise<boolean> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const requestService = new RequestService(prisma);
      await requestService.deleteRequest(id, userId);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting request:'), error.message);
      return false;
    }
  }

  // ===== Environments =====

  async listEnvironments(): Promise<Environment[]> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const environmentService = new EnvironmentService(prisma);
      return await environmentService.getEnvironments(userId, {
        workspaceId: workspaceId || undefined,
      });
    } catch (error: any) {
      console.error(chalk.red('Error fetching environments:'), error.message);
      return [];
    }
  }

  async getEnvironment(id: string): Promise<Environment | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const environmentService = new EnvironmentService(prisma);
      return await environmentService.getEnvironment(id, userId);
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
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const environmentService = new EnvironmentService(prisma);
      return await environmentService.createEnvironment(userId, {
        name,
        variables,
        workspaceId: workspaceId || undefined,
      });
    } catch (error: any) {
      console.error(chalk.red('Error creating environment:'), error.message);
      return null;
    }
  }

  async updateEnvironment(id: string, name?: string, variables?: Record<string, string>): Promise<Environment | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const environmentService = new EnvironmentService(prisma);
      return await environmentService.updateEnvironment(id, userId, { name, variables });
    } catch (error: any) {
      console.error(chalk.red('Error updating environment:'), error.message);
      return null;
    }
  }

  async deleteEnvironment(id: string): Promise<boolean> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const environmentService = new EnvironmentService(prisma);
      await environmentService.deleteEnvironment(id, userId);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error deleting environment:'), error.message);
      return false;
    }
  }

  async activateEnvironment(id: string): Promise<Environment | null> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const userId = await this.dbManager.getCurrentUserId();
      const environmentService = new EnvironmentService(prisma);
      return await environmentService.activateEnvironment(id, userId);
    } catch (error: any) {
      console.error(chalk.red('Error activating environment:'), error.message);
      return null;
    }
  }

  // ===== History =====

  async getHistory(): Promise<any[]> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const historyService = new HistoryService(prisma);
      return await historyService.getApiHistory(userId, {
        workspaceId: workspaceId || undefined,
      });
    } catch (error: any) {
      console.error(chalk.red('Error fetching history:'), error.message);
      return [];
    }
  }

  async clearHistory(): Promise<boolean> {
    try {
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const historyService = new HistoryService(prisma);
      await historyService.clearApiHistory(userId, workspaceId || undefined);
      return true;
    } catch (error: any) {
      console.error(chalk.red('Error clearing history:'), error.message);
      return false;
    }
  }

  // ===== Request Execution =====
  // Note: This is kept for backward compatibility but should use RequestExecutor directly

  async sendRequest(data: {
    method: string;
    url: string;
    headers?: any;
    body?: string;
    bodyType?: string;
  }): Promise<any> {
    // This method is kept for compatibility but request execution
    // should be done using RequestExecutor directly
    throw new Error('sendRequest should be replaced with RequestExecutor.executeRequest');
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
      const prisma = await this.dbManager.getPrisma();
      const { userId, workspaceId } = await this.getContext();
      const historyService = new HistoryService(prisma);
      await historyService.createApiHistory(userId, {
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        duration: data.duration,
        error: data.error,
        source: 'CLI',
        workspaceId: workspaceId || undefined,
      });
    } catch (error: any) {
      // Silently fail - history logging is not critical
      console.error(chalk.gray('Warning: Failed to save to history'));
    }
  }
}

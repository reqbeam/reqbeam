import {
  CollectionService,
  RequestService,
  EnvironmentService,
  WorkspaceService,
  HistoryService,
  type CollectionData,
  type RequestData,
  type EnvironmentData,
  type WorkspaceData,
} from '../../../shared/index.js'
import { AuthManager } from './auth.js'
import { ContextManager } from './context.js'
import chalk from 'chalk'

/**
 * Database-based Storage Manager
 * Uses the shared library to directly access the database
 */
export class DbStorageManager {
  private static instance: DbStorageManager
  private collectionService: CollectionService
  private requestService: RequestService
  private environmentService: EnvironmentService
  private workspaceService: WorkspaceService
  private historyService: HistoryService

  private constructor() {
    this.collectionService = new CollectionService()
    this.requestService = new RequestService()
    this.environmentService = new EnvironmentService()
    this.workspaceService = new WorkspaceService()
    this.historyService = new HistoryService()
  }

  public static getInstance(): DbStorageManager {
    if (!DbStorageManager.instance) {
      DbStorageManager.instance = new DbStorageManager()
    }
    return DbStorageManager.instance
  }

  /**
   * Get the current user ID from auth config
   */
  private async getUserId(): Promise<string> {
    const authManager = AuthManager.getInstance()
    const config = await authManager.requireAuth()
    return config.user.id
  }

  /**
   * Get the active workspace ID if available
   */
  private async getWorkspaceId(): Promise<string | undefined> {
    const contextManager = ContextManager.getInstance()
    const activeWorkspace = await contextManager.getActiveWorkspace()
    return activeWorkspace?.id
  }

  // ===== Workspaces =====

  async listWorkspaces() {
    try {
      const userId = await this.getUserId()
      return await this.workspaceService.getWorkspaces(userId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching workspaces:'), error.message)
      return []
    }
  }

  async getWorkspace(id: string) {
    try {
      const userId = await this.getUserId()
      return await this.workspaceService.getWorkspace(id, userId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching workspace:'), error.message)
      return null
    }
  }

  async findWorkspaceByName(name: string) {
    const workspaces = await this.listWorkspaces()
    return workspaces.find((w) => w.name === name) || null
  }

  async createWorkspace(name: string, description?: string) {
    try {
      const userId = await this.getUserId()
      return await this.workspaceService.createWorkspace({
        name,
        description,
        ownerId: userId,
      })
    } catch (error: any) {
      console.error(chalk.red('Error creating workspace:'), error.message)
      return null
    }
  }

  async updateWorkspace(id: string, name?: string, description?: string) {
    try {
      const userId = await this.getUserId()
      return await this.workspaceService.updateWorkspace(id, userId, { name, description })
    } catch (error: any) {
      console.error(chalk.red('Error updating workspace:'), error.message)
      return null
    }
  }

  async deleteWorkspace(id: string) {
    try {
      const userId = await this.getUserId()
      await this.workspaceService.deleteWorkspace(id, userId)
      return true
    } catch (error: any) {
      console.error(chalk.red('Error deleting workspace:'), error.message)
      return false
    }
  }

  async activateWorkspace(id: string) {
    try {
      const userId = await this.getUserId()
      return await this.workspaceService.getWorkspace(id, userId)
    } catch (error: any) {
      console.error(chalk.red('Error activating workspace:'), error.message)
      return null
    }
  }

  // ===== Collections =====

  async listCollections() {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.collectionService.getCollections(userId, workspaceId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching collections:'), error.message)
      return []
    }
  }

  async getCollection(id: string) {
    try {
      const userId = await this.getUserId()
      return await this.collectionService.getCollection(id, userId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching collection:'), error.message)
      return null
    }
  }

  async createCollection(name: string, description?: string) {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.collectionService.createCollection({
        name,
        description,
        userId,
        workspaceId,
      })
    } catch (error: any) {
      console.error(chalk.red('Error creating collection:'), error.message)
      return null
    }
  }

  async updateCollection(id: string, name?: string, description?: string) {
    try {
      const userId = await this.getUserId()
      return await this.collectionService.updateCollection(id, userId, { name, description })
    } catch (error: any) {
      console.error(chalk.red('Error updating collection:'), error.message)
      return null
    }
  }

  async deleteCollection(id: string) {
    try {
      const userId = await this.getUserId()
      await this.collectionService.deleteCollection(id, userId)
      return true
    } catch (error: any) {
      console.error(chalk.red('Error deleting collection:'), error.message)
      return false
    }
  }

  // ===== Requests =====

  async listRequests(collectionId?: string) {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.requestService.getRequests(userId, collectionId, workspaceId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching requests:'), error.message)
      return []
    }
  }

  async getRequest(id: string) {
    try {
      const userId = await this.getUserId()
      return await this.requestService.getRequest(id, userId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching request:'), error.message)
      return null
    }
  }

  async findRequestByName(name: string, collectionId?: string) {
    try {
      const userId = await this.getUserId()
      return await this.requestService.findRequestByName(name, userId, collectionId)
    } catch (error: any) {
      return null
    }
  }

  async createRequest(data: {
    name: string
    method: string
    url: string
    headers?: any
    body?: string
    bodyType?: string
    collectionId?: string
  }) {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.requestService.createRequest({
        ...data,
        userId,
        workspaceId,
      })
    } catch (error: any) {
      console.error(chalk.red('Error creating request:'), error.message)
      return null
    }
  }

  async updateRequest(
    id: string,
    data: {
      name?: string
      method?: string
      url?: string
      headers?: any
      body?: string
      bodyType?: string
      collectionId?: string
    }
  ) {
    try {
      const userId = await this.getUserId()
      return await this.requestService.updateRequest(id, userId, data)
    } catch (error: any) {
      console.error(chalk.red('Error updating request:'), error.message)
      return null
    }
  }

  async deleteRequest(id: string) {
    try {
      const userId = await this.getUserId()
      await this.requestService.deleteRequest(id, userId)
      return true
    } catch (error: any) {
      console.error(chalk.red('Error deleting request:'), error.message)
      return false
    }
  }

  // ===== Environments =====

  async listEnvironments() {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      const environments = await this.environmentService.getEnvironments(userId, workspaceId)
      return environments
    } catch (error: any) {
      console.error(chalk.red('Error fetching environments:'), error.message)
      return []
    }
  }

  async getEnvironment(id: string) {
    try {
      const userId = await this.getUserId()
      return await this.environmentService.getEnvironment(id, userId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching environment:'), error.message)
      return null
    }
  }

  async getActiveEnvironment() {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.environmentService.getActiveEnvironment(userId, workspaceId)
    } catch (error: any) {
      return null
    }
  }

  async findEnvironmentByName(name: string) {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.environmentService.findEnvironmentByName(name, userId, workspaceId)
    } catch (error: any) {
      return null
    }
  }

  async createEnvironment(name: string, variables: Record<string, string>) {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.environmentService.createEnvironment({
        name,
        variables,
        userId,
        workspaceId,
      })
    } catch (error: any) {
      console.error(chalk.red('Error creating environment:'), error.message)
      return null
    }
  }

  async updateEnvironment(id: string, name?: string, variables?: Record<string, string>) {
    try {
      const userId = await this.getUserId()
      return await this.environmentService.updateEnvironment(id, userId, { name, variables })
    } catch (error: any) {
      console.error(chalk.red('Error updating environment:'), error.message)
      return null
    }
  }

  async deleteEnvironment(id: string) {
    try {
      const userId = await this.getUserId()
      await this.environmentService.deleteEnvironment(id, userId)
      return true
    } catch (error: any) {
      console.error(chalk.red('Error deleting environment:'), error.message)
      return false
    }
  }

  async activateEnvironment(id: string) {
    try {
      const userId = await this.getUserId()
      return await this.environmentService.activateEnvironment(id, userId)
    } catch (error: any) {
      console.error(chalk.red('Error activating environment:'), error.message)
      return null
    }
  }

  // ===== History =====

  async getHistory() {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      return await this.historyService.getHistory(userId, workspaceId)
    } catch (error: any) {
      console.error(chalk.red('Error fetching history:'), error.message)
      return []
    }
  }

  async clearHistory() {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      await this.historyService.clearHistory(userId, workspaceId)
      return true
    } catch (error: any) {
      console.error(chalk.red('Error clearing history:'), error.message)
      return false
    }
  }

  // ===== Request Execution =====
  // Note: This still needs to make HTTP requests to external APIs
  // It's not a database operation, so we'll keep it separate
  async sendRequest(data: {
    method: string
    url: string
    headers?: any
    body?: string
    bodyType?: string
  }): Promise<any> {
    // This is for actually sending HTTP requests, not database operations
    // We'll need to keep a separate utility for this
    throw new Error('sendRequest should be handled by request utility, not storage manager')
  }

  // ===== History Logging =====

  async saveToHistory(data: {
    method: string
    url: string
    statusCode?: number
    duration?: number
    error?: string
  }) {
    try {
      const userId = await this.getUserId()
      const workspaceId = await this.getWorkspaceId()
      await this.historyService.createHistory({
        ...data,
        userId,
        workspaceId,
        source: 'CLI',
      })
    } catch (error: any) {
      // Silently fail - history logging is not critical
      console.error(chalk.gray('Warning: Failed to save to history'))
    }
  }
}


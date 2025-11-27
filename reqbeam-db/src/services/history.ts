import { PrismaClient } from '@prisma/client';
import {
  ApiHistory,
  RequestHistory,
  CreateApiHistoryInput,
  CreateRequestHistoryInput,
  HistoryQueryOptions,
} from '../types';

export class HistoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get API history entries
   */
  async getApiHistory(
    userId: string,
    options?: HistoryQueryOptions
  ): Promise<ApiHistory[]> {
    const where: any = {
      userId,
    };

    if (options?.source) {
      where.source = options.source;
    }

    // Filter by workspace if provided
    // Include both workspace-specific entries AND legacy entries (workspaceId: null)
    if (options?.workspaceId) {
      where.OR = [
        { workspaceId: options.workspaceId },
        { workspaceId: null }, // Include legacy entries without workspace
      ];
    }

    const history = await this.prisma.apiHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    return history as ApiHistory[];
  }

  /**
   * Create a new API history entry
   */
  async createApiHistory(
    userId: string,
    data: CreateApiHistoryInput
  ): Promise<ApiHistory> {
    // Validate source
    if (!['CLI', 'WEB'].includes(data.source)) {
      throw new Error('Source must be either "CLI" or "WEB"');
    }

    const historyEntry = await this.prisma.apiHistory.create({
      data: {
        method: data.method.toUpperCase(),
        url: data.url,
        statusCode: data.statusCode || null,
        source: data.source,
        duration: data.duration || null,
        error: data.error || null,
        userId,
        workspaceId: data.workspaceId || null,
      },
    });

    return historyEntry as ApiHistory;
  }

  /**
   * Clear API history for a user or workspace
   */
  async clearApiHistory(
    userId: string,
    workspaceId?: string
  ): Promise<void> {
    const where: any = {
      userId,
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    await this.prisma.apiHistory.deleteMany({ where });
  }

  /**
   * Get request history entries
   */
  async getRequestHistory(
    requestId: string,
    userId: string,
    options?: { workspaceId?: string; limit?: number }
  ): Promise<RequestHistory[]> {
    // Verify request belongs to user
    const request = await this.prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new Error('Request not found or access denied');
    }

    const where: any = {
      requestId,
    };

    if (options?.workspaceId) {
      where.workspaceId = options.workspaceId;
    }

    const history = await this.prisma.requestHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 100,
    });

    return history as RequestHistory[];
  }

  /**
   * Create a new request history entry
   */
  async createRequestHistory(
    requestId: string,
    userId: string,
    data: CreateRequestHistoryInput
  ): Promise<RequestHistory> {
    // Verify request belongs to user
    const request = await this.prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new Error('Request not found or access denied');
    }

    const historyEntry = await this.prisma.requestHistory.create({
      data: {
        requestId,
        workspaceId: data.workspaceId || request.workspaceId || null,
        statusCode: data.statusCode || null,
        response: data.response || null,
        headers: data.headers
          ? typeof data.headers === 'string'
            ? data.headers
            : JSON.stringify(data.headers)
          : null,
        duration: data.duration || null,
        size: data.size || null,
        error: data.error || null,
      },
    });

    return historyEntry as RequestHistory;
  }

  /**
   * Clear request history for a specific request
   */
  async clearRequestHistory(
    requestId: string,
    userId: string
  ): Promise<void> {
    // Verify request belongs to user
    const request = await this.prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new Error('Request not found or access denied');
    }

    await this.prisma.requestHistory.deleteMany({
      where: { requestId },
    });
  }

  /**
   * Migrate history entries to a workspace (bulk update)
   */
  async migrateHistoryToWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<number> {
    const result = await this.prisma.apiHistory.updateMany({
      where: {
        userId,
        workspaceId: null,
      },
      data: {
        workspaceId,
      },
    });

    return result.count;
  }
}


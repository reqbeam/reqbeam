import { prisma } from '../prisma.js'

export interface HistoryData {
  requestId?: string
  method: string
  url: string
  statusCode?: number
  response?: string
  headers?: any
  duration?: number
  size?: number
  error?: string
  userId?: string
  workspaceId?: string
  source?: string
}

export class HistoryService {
  /**
   * Get history entries for a user, optionally filtered by workspace and source
   */
  async getHistory(userId: string, workspaceId?: string, source?: string, limit?: number) {
    const whereClause: any = {
      userId,
    }

    if (source) {
      whereClause.source = source
    }

    if (workspaceId) {
      // Include both workspace-specific entries AND legacy entries (workspaceId: null)
      whereClause.OR = [
        { workspaceId: workspaceId },
        { workspaceId: null }, // Include legacy entries without workspace
      ]
    } else {
      if (workspaceId !== undefined) {
        whereClause.workspaceId = workspaceId
      }
    }

    return await prisma.apiHistory.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit || 100,
    })
  }

  /**
   * Get request history (RequestHistory model)
   */
  async getRequestHistory(requestId: string, userId: string) {
    // Verify the request belongs to the user
    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        userId,
      },
    })

    if (!request) {
      throw new Error('Request not found')
    }

    return await prisma.requestHistory.findMany({
      where: {
        requestId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Create a history entry (ApiHistory)
   */
  async createApiHistory(data: {
    method: string
    url: string
    statusCode?: number
    source: string
    duration?: number
    error?: string
    userId?: string
    workspaceId?: string
  }) {
    return await prisma.apiHistory.create({
      data: {
        method: data.method.toUpperCase(),
        url: data.url,
        statusCode: data.statusCode || null,
        source: data.source,
        duration: data.duration || null,
        error: data.error || null,
        userId: data.userId || null,
        workspaceId: data.workspaceId || null,
      },
    })
  }

  /**
   * Create a history entry
   */
  async createHistory(data: HistoryData) {
    // If requestId is provided, create RequestHistory entry
    if (data.requestId) {
      return await prisma.requestHistory.create({
        data: {
          requestId: data.requestId,
          workspaceId: data.workspaceId || null,
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
      })
    }

    // Otherwise, create ApiHistory entry
    return await prisma.apiHistory.create({
      data: {
        method: data.method,
        url: data.url,
        statusCode: data.statusCode || null,
        source: data.source || 'CLI',
        duration: data.duration || null,
        error: data.error || null,
        userId: data.userId || null,
        workspaceId: data.workspaceId || null,
      },
    })
  }

  /**
   * Clear history for a user
   */
  async clearHistory(userId: string, workspaceId?: string) {
    const whereClause: any = {
      userId,
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    return await prisma.apiHistory.deleteMany({
      where: whereClause,
    })
  }

  /**
   * Migrate history entries (update workspaceId)
   */
  async migrateHistory(userId: string, workspaceId: string) {
    return await prisma.apiHistory.updateMany({
      where: {
        userId,
        workspaceId: null,
      },
      data: {
        workspaceId,
      },
    })
  }
}


import { prisma } from '../prisma.js'

export interface RequestData {
  name: string
  method: string
  url: string
  headers?: any
  body?: string
  bodyType?: string
  auth?: any
  collectionId?: string
  userId: string
  workspaceId?: string
}

export interface UpdateRequestData {
  name?: string
  method?: string
  url?: string
  headers?: any
  body?: string
  bodyType?: string
  auth?: any
  collectionId?: string
}

export class RequestService {
  /**
   * Get all requests for a user, optionally filtered by collection or workspace
   */
  async getRequests(userId: string, collectionId?: string, workspaceId?: string) {
    const whereClause: any = {
      userId,
    }

    if (collectionId) {
      whereClause.collectionId = collectionId
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    return await prisma.request.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get a single request by ID
   */
  async getRequest(id: string, userId: string) {
    return await prisma.request.findFirst({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Find a request by name
   */
  async findRequestByName(name: string, userId: string, collectionId?: string) {
    const whereClause: any = {
      name,
      userId,
    }

    if (collectionId) {
      whereClause.collectionId = collectionId
    }

    return await prisma.request.findFirst({
      where: whereClause,
    })
  }

  /**
   * Create a new request
   */
  async createRequest(data: RequestData) {
    // If collectionId is provided, verify it belongs to the user and get its workspaceId
    let finalWorkspaceId = data.workspaceId

    if (data.collectionId) {
      const collection = await prisma.collection.findFirst({
        where: {
          id: data.collectionId,
          userId: data.userId,
        },
      })

      if (!collection) {
        throw new Error('Collection not found')
      }

      // Use collection's workspaceId if not provided
      finalWorkspaceId = finalWorkspaceId || collection.workspaceId || undefined
    }

    return await prisma.request.create({
      data: {
        name: data.name,
        method: data.method,
        url: data.url,
        headers: data.headers
          ? typeof data.headers === 'string'
            ? data.headers
            : JSON.stringify(data.headers)
          : null,
        body: data.body || null,
        bodyType: data.bodyType || 'json',
        auth: data.auth
          ? typeof data.auth === 'string'
            ? data.auth
            : JSON.stringify(data.auth)
          : null,
        collectionId: data.collectionId || null,
        userId: data.userId,
        workspaceId: finalWorkspaceId || null,
      },
    })
  }

  /**
   * Update a request
   */
  async updateRequest(id: string, userId: string, data: UpdateRequestData) {
    // Verify the request belongs to the user
    const request = await prisma.request.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!request) {
      throw new Error('Request not found')
    }

    // If collectionId is being updated, verify it belongs to the user
    if (data.collectionId !== undefined) {
      if (data.collectionId) {
        const collection = await prisma.collection.findFirst({
          where: {
            id: data.collectionId,
            userId,
          },
        })

        if (!collection) {
          throw new Error('Collection not found')
        }
      }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.method !== undefined) updateData.method = data.method
    if (data.url !== undefined) updateData.url = data.url
    if (data.headers !== undefined) {
      updateData.headers = data.headers
        ? typeof data.headers === 'string'
          ? data.headers
          : JSON.stringify(data.headers)
        : null
    }
    if (data.body !== undefined) updateData.body = data.body
    if (data.bodyType !== undefined) updateData.bodyType = data.bodyType
    if (data.auth !== undefined) {
      updateData.auth = data.auth
        ? typeof data.auth === 'string'
          ? data.auth
          : JSON.stringify(data.auth)
        : null
    }
    if (data.collectionId !== undefined) updateData.collectionId = data.collectionId || null

    return await prisma.request.update({
      where: { id },
      data: updateData,
    })
  }

  /**
   * Delete a request
   */
  async deleteRequest(id: string, userId: string) {
    // Verify the request belongs to the user
    const request = await prisma.request.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!request) {
      throw new Error('Request not found')
    }

    return await prisma.request.delete({
      where: { id },
    })
  }
}


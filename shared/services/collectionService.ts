import { prisma } from '../prisma.js'

export interface CollectionData {
  name: string
  description?: string
  userId: string
  workspaceId?: string
}

export interface UpdateCollectionData {
  name?: string
  description?: string
}

export class CollectionService {
  /**
   * Get all collections for a user, optionally filtered by workspace
   */
  async getCollections(userId: string, workspaceId?: string) {
    const whereClause: any = {
      userId,
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    return await prisma.collection.findMany({
      where: whereClause,
      include: {
        requests: {
          select: {
            id: true,
            name: true,
            method: true,
            url: true,
            headers: true,
            body: true,
            bodyType: true,
            auth: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get a single collection by ID
   */
  async getCollection(id: string, userId: string) {
    return await prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        requests: true,
      },
    })
  }

  /**
   * Create a new collection
   */
  async createCollection(data: CollectionData) {
    return await prisma.collection.create({
      data: {
        name: data.name,
        description: data.description,
        userId: data.userId,
        workspaceId: data.workspaceId || null,
      },
    })
  }

  /**
   * Update a collection
   */
  async updateCollection(id: string, userId: string, data: UpdateCollectionData) {
    // Verify the collection belongs to the user
    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!collection) {
      throw new Error('Collection not found')
    }

    return await prisma.collection.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    })
  }

  /**
   * Delete a collection
   */
  async deleteCollection(id: string, userId: string) {
    // Verify the collection belongs to the user
    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!collection) {
      throw new Error('Collection not found')
    }

    return await prisma.collection.delete({
      where: { id },
    })
  }
}


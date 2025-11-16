import { PrismaClient } from '@prisma/client';
import { Collection, CreateCollectionInput, UpdateCollectionInput, QueryOptions } from '../types';

export class CollectionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all collections for a user, optionally filtered by workspace
   */
  async getCollections(
    userId: string,
    options?: QueryOptions
  ): Promise<Collection[]> {
    const where: any = {
      userId,
    };

    if (options?.workspaceId) {
      where.workspaceId = options.workspaceId;
    }

    const collections = await this.prisma.collection.findMany({
      where,
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
    });

    return collections as Collection[];
  }

  /**
   * Get a single collection by ID
   */
  async getCollection(id: string, userId: string): Promise<Collection | null> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        requests: true,
      },
    });

    return collection as Collection | null;
  }

  /**
   * Create a new collection
   */
  async createCollection(
    userId: string,
    data: CreateCollectionInput
  ): Promise<Collection> {
    const collection = await this.prisma.collection.create({
      data: {
        name: data.name,
        description: data.description || null,
        userId,
        workspaceId: data.workspaceId || null,
      },
      include: {
        requests: true,
      },
    });

    return collection as Collection;
  }

  /**
   * Update an existing collection
   */
  async updateCollection(
    id: string,
    userId: string,
    data: UpdateCollectionInput
  ): Promise<Collection> {
    // Verify ownership
    const existing = await this.prisma.collection.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Collection not found or access denied');
    }

    const collection = await this.prisma.collection.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        requests: true,
      },
    });

    return collection as Collection;
  }

  /**
   * Delete a collection
   */
  async deleteCollection(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.collection.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Collection not found or access denied');
    }

    await this.prisma.collection.delete({
      where: { id },
    });
  }
}


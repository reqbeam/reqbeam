import { PrismaClient } from '@prisma/client';
import { Request, CreateRequestInput, UpdateRequestInput, QueryOptions } from '../types';

export class RequestService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all requests for a user, optionally filtered by collection or workspace
   */
  async getRequests(
    userId: string,
    options?: QueryOptions & { collectionId?: string }
  ): Promise<Request[]> {
    const where: any = {
      userId,
    };

    if (options?.workspaceId) {
      where.workspaceId = options.workspaceId;
    }

    if (options?.collectionId) {
      where.collectionId = options.collectionId;
    }

    const requests = await this.prisma.request.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests as Request[];
  }

  /**
   * Get a single request by ID
   */
  async getRequest(id: string, userId: string): Promise<Request | null> {
    const request = await this.prisma.request.findFirst({
      where: {
        id,
        userId,
      },
    });

    return request as Request | null;
  }

  /**
   * Create a new request
   */
  async createRequest(
    userId: string,
    data: CreateRequestInput
  ): Promise<Request> {
    let finalWorkspaceId = data.workspaceId;

    // If collectionId is provided, verify it belongs to the user and get its workspaceId
    if (data.collectionId) {
      const collection = await this.prisma.collection.findFirst({
        where: {
          id: data.collectionId,
          userId,
        },
      });

      if (!collection) {
        throw new Error('Collection not found or access denied');
      }

      // Use collection's workspaceId if not provided
      finalWorkspaceId = finalWorkspaceId || collection.workspaceId || undefined;
    }

    const request = await this.prisma.request.create({
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
        userId,
        workspaceId: finalWorkspaceId || null,
      },
    });

    return request as Request;
  }

  /**
   * Update an existing request
   */
  async updateRequest(
    id: string,
    userId: string,
    data: UpdateRequestInput
  ): Promise<Request> {
    // Verify ownership
    const existing = await this.prisma.request.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Request not found or access denied');
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.headers !== undefined) {
      updateData.headers = data.headers
        ? typeof data.headers === 'string'
          ? data.headers
          : JSON.stringify(data.headers)
        : null;
    }
    if (data.body !== undefined) updateData.body = data.body || null;
    if (data.bodyType !== undefined) updateData.bodyType = data.bodyType;
    if (data.auth !== undefined) {
      updateData.auth = data.auth
        ? typeof data.auth === 'string'
          ? data.auth
          : JSON.stringify(data.auth)
        : null;
    }
    if (data.collectionId !== undefined) {
      // Verify collection belongs to user if changing collection
      if (data.collectionId) {
        const collection = await this.prisma.collection.findFirst({
          where: {
            id: data.collectionId,
            userId,
          },
        });

        if (!collection) {
          throw new Error('Collection not found or access denied');
        }
      }
      updateData.collectionId = data.collectionId || null;
    }

    const request = await this.prisma.request.update({
      where: { id },
      data: updateData,
    });

    return request as Request;
  }

  /**
   * Delete a request
   */
  async deleteRequest(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.request.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Request not found or access denied');
    }

    await this.prisma.request.delete({
      where: { id },
    });
  }
}


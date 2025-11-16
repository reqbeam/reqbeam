import { PrismaClient } from '@prisma/client';

export interface MockServer {
  id: string;
  name: string;
  baseUrl: string | null;
  collectionId: string | null;
  userId: string;
  workspaceId: string | null;
  responseDelay: number;
  defaultStatusCode: number;
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
  collection?: {
    id: string;
    name: string;
  } | null;
  endpoints?: MockEndpoint[];
  _count?: {
    endpoints: number;
  };
}

export interface MockEndpoint {
  id: string;
  mockServerId: string;
  method: string;
  path: string;
  response: string;
  statusCode: number;
  headers: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMockServerInput {
  name: string;
  collectionId?: string | null;
  workspaceId?: string | null;
  responseDelay?: number;
  defaultStatusCode?: number;
  isRunning?: boolean;
}

export interface UpdateMockServerInput {
  name?: string;
  responseDelay?: number;
  defaultStatusCode?: number;
  isRunning?: boolean;
}

export interface CreateMockEndpointInput {
  mockServerId: string;
  method: string;
  path: string;
  response: string;
  statusCode: number;
  headers?: string | null;
}

export class MockServerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all mock servers for a user, optionally filtered by workspace
   */
  async getMockServers(
    userId: string,
    options?: { workspaceId?: string }
  ): Promise<MockServer[]> {
    const where: any = {
      userId,
    };

    if (options?.workspaceId) {
      where.workspaceId = options.workspaceId;
    }

    const mockServers = await this.prisma.mockServer.findMany({
      where,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        endpoints: {
          select: {
            id: true,
            method: true,
            path: true,
            statusCode: true,
          },
        },
        _count: {
          select: {
            endpoints: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return mockServers as MockServer[];
  }

  /**
   * Get a single mock server by ID
   */
  async getMockServer(id: string, userId: string): Promise<MockServer | null> {
    const mockServer = await this.prisma.mockServer.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        endpoints: {
          orderBy: {
            path: 'asc',
          },
        },
      },
    });

    return mockServer as MockServer | null;
  }

  /**
   * Get mock server by baseUrl (for mock endpoint routing)
   */
  async getMockServerByBaseUrl(baseUrl: string): Promise<MockServer | null> {
    const mockServer = await this.prisma.mockServer.findFirst({
      where: {
        baseUrl,
        isRunning: true,
      },
      include: {
        endpoints: true,
      },
    });

    return mockServer as MockServer | null;
  }

  /**
   * Create a new mock server
   */
  async createMockServer(
    userId: string,
    data: CreateMockServerInput,
    baseUrl: string
  ): Promise<MockServer> {
    const mockServer = await this.prisma.mockServer.create({
      data: {
        name: data.name,
        baseUrl,
        collectionId: data.collectionId || null,
        userId,
        workspaceId: data.workspaceId || null,
        responseDelay: data.responseDelay ?? 0,
        defaultStatusCode: data.defaultStatusCode ?? 200,
        isRunning: data.isRunning ?? false,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        endpoints: true,
      },
    });

    return mockServer as MockServer;
  }

  /**
   * Update an existing mock server
   */
  async updateMockServer(
    id: string,
    userId: string,
    data: UpdateMockServerInput
  ): Promise<MockServer> {
    // Verify ownership
    const existing = await this.prisma.mockServer.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Mock server not found or access denied');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.responseDelay !== undefined) updateData.responseDelay = data.responseDelay;
    if (data.defaultStatusCode !== undefined) updateData.defaultStatusCode = data.defaultStatusCode;
    if (data.isRunning !== undefined) updateData.isRunning = data.isRunning;

    const mockServer = await this.prisma.mockServer.update({
      where: { id },
      data: updateData,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        endpoints: true,
      },
    });

    return mockServer as MockServer;
  }

  /**
   * Delete a mock server
   */
  async deleteMockServer(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.mockServer.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Mock server not found or access denied');
    }

    await this.prisma.mockServer.delete({
      where: { id },
    });
  }

  /**
   * Create multiple mock endpoints
   */
  async createMockEndpoints(endpoints: CreateMockEndpointInput[]): Promise<void> {
    await this.prisma.mockEndpoint.createMany({
      data: endpoints,
    });
  }

  /**
   * Get mock endpoints for a server
   */
  async getMockEndpoints(mockServerId: string, userId: string): Promise<MockEndpoint[]> {
    // Verify ownership
    const mockServer = await this.prisma.mockServer.findFirst({
      where: { id: mockServerId, userId },
    });

    if (!mockServer) {
      throw new Error('Mock server not found or access denied');
    }

    const endpoints = await this.prisma.mockEndpoint.findMany({
      where: { mockServerId },
      orderBy: {
        path: 'asc',
      },
    });

    return endpoints as MockEndpoint[];
  }

  /**
   * Get a single mock endpoint
   */
  async getMockEndpoint(
    mockServerId: string,
    endpointId: string,
    userId: string
  ): Promise<MockEndpoint | null> {
    // Verify ownership
    const mockServer = await this.prisma.mockServer.findFirst({
      where: { id: mockServerId, userId },
    });

    if (!mockServer) {
      throw new Error('Mock server not found or access denied');
    }

    const endpoint = await this.prisma.mockEndpoint.findFirst({
      where: {
        id: endpointId,
        mockServerId,
      },
    });

    return endpoint as MockEndpoint | null;
  }

  /**
   * Update a mock endpoint
   */
  async updateMockEndpoint(
    mockServerId: string,
    endpointId: string,
    userId: string,
    data: Partial<CreateMockEndpointInput>
  ): Promise<MockEndpoint> {
    // Verify ownership
    const mockServer = await this.prisma.mockServer.findFirst({
      where: { id: mockServerId, userId },
    });

    if (!mockServer) {
      throw new Error('Mock server not found or access denied');
    }

    const updateData: any = {};
    if (data.method !== undefined) updateData.method = data.method;
    if (data.path !== undefined) updateData.path = data.path;
    if (data.response !== undefined) updateData.response = data.response;
    if (data.statusCode !== undefined) updateData.statusCode = data.statusCode;
    if (data.headers !== undefined) updateData.headers = data.headers;

    const endpoint = await this.prisma.mockEndpoint.update({
      where: { id: endpointId },
      data: updateData,
    });

    return endpoint as MockEndpoint;
  }

  /**
   * Delete a mock endpoint
   */
  async deleteMockEndpoint(
    mockServerId: string,
    endpointId: string,
    userId: string
  ): Promise<void> {
    // Verify ownership
    const mockServer = await this.prisma.mockServer.findFirst({
      where: { id: mockServerId, userId },
    });

    if (!mockServer) {
      throw new Error('Mock server not found or access denied');
    }

    await this.prisma.mockEndpoint.delete({
      where: { id: endpointId },
    });
  }
}


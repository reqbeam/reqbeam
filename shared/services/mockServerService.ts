import { prisma } from '../prisma.js'

export interface MockServerData {
  name: string
  baseUrl?: string
  collectionId?: string
  userId: string
  workspaceId?: string
  responseDelay?: number
  defaultStatusCode?: number
  isRunning?: boolean
}

export interface UpdateMockServerData {
  name?: string
  responseDelay?: number
  defaultStatusCode?: number
  isRunning?: boolean
}

export interface MockEndpointData {
  mockServerId: string
  method: string
  path: string
  response?: string
  statusCode?: number
  headers?: string
}

export interface UpdateMockEndpointData {
  method?: string
  path?: string
  response?: string
  statusCode?: number
  headers?: string
}

export class MockServerService {
  /**
   * Get all mock servers for a user, optionally filtered by workspace
   */
  async getMockServers(userId: string, workspaceId?: string) {
    const whereClause: any = {
      userId,
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    return await prisma.mockServer.findMany({
      where: whereClause,
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
    })
  }

  /**
   * Get a single mock server by ID
   */
  async getMockServer(id: string, userId: string) {
    return await prisma.mockServer.findFirst({
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
        endpoints: true,
      },
    })
  }

  /**
   * Find mock server by baseUrl (for mock endpoint handling)
   */
  async findByBaseUrl(baseUrl: string) {
    return await prisma.mockServer.findFirst({
      where: {
        baseUrl,
        isRunning: true,
      },
      include: {
        endpoints: true,
      },
    })
  }

  /**
   * Create a new mock server
   */
  async createMockServer(data: MockServerData) {
    return await prisma.mockServer.create({
      data: {
        name: data.name,
        baseUrl: data.baseUrl || null,
        collectionId: data.collectionId || null,
        userId: data.userId,
        workspaceId: data.workspaceId || null,
        responseDelay: data.responseDelay || 0,
        defaultStatusCode: data.defaultStatusCode || 200,
        isRunning: data.isRunning || false,
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
    })
  }

  /**
   * Update a mock server
   */
  async updateMockServer(id: string, userId: string, data: UpdateMockServerData) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.responseDelay !== undefined) updateData.responseDelay = data.responseDelay
    if (data.defaultStatusCode !== undefined) updateData.defaultStatusCode = data.defaultStatusCode
    if (data.isRunning !== undefined) updateData.isRunning = data.isRunning

    return await prisma.mockServer.update({
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
    })
  }

  /**
   * Delete a mock server
   */
  async deleteMockServer(id: string, userId: string) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    return await prisma.mockServer.delete({
      where: { id },
    })
  }

  /**
   * Get endpoints for a mock server
   */
  async getEndpoints(mockServerId: string, userId: string) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id: mockServerId,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    return await prisma.mockEndpoint.findMany({
      where: {
        mockServerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Create a mock endpoint
   */
  async createEndpoint(mockServerId: string, userId: string, data: MockEndpointData) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id: mockServerId,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    return await prisma.mockEndpoint.create({
      data: {
        mockServerId: data.mockServerId,
        method: data.method.toUpperCase(),
        path: data.path,
        response: data.response || null,
        statusCode: data.statusCode || 200,
        headers: data.headers || null,
      },
    })
  }

  /**
   * Create multiple endpoints at once
   */
  async createEndpoints(mockServerId: string, userId: string, endpoints: MockEndpointData[]) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id: mockServerId,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    return await prisma.mockEndpoint.createMany({
      data: endpoints.map((ep) => ({
        mockServerId: ep.mockServerId,
        method: ep.method.toUpperCase(),
        path: ep.path,
        response: ep.response || null,
        statusCode: ep.statusCode || 200,
        headers: ep.headers || null,
      })),
    })
  }

  /**
   * Get a single endpoint
   */
  async getEndpoint(endpointId: string, mockServerId: string, userId: string) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id: mockServerId,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    return await prisma.mockEndpoint.findFirst({
      where: {
        id: endpointId,
        mockServerId,
      },
    })
  }

  /**
   * Update a mock endpoint
   */
  async updateEndpoint(
    endpointId: string,
    mockServerId: string,
    userId: string,
    data: UpdateMockEndpointData
  ) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id: mockServerId,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    // Verify endpoint belongs to mock server
    const endpoint = await prisma.mockEndpoint.findFirst({
      where: {
        id: endpointId,
        mockServerId,
      },
    })

    if (!endpoint) {
      throw new Error('Endpoint not found')
    }

    const updateData: any = {}
    if (data.method !== undefined) updateData.method = data.method.toUpperCase()
    if (data.path !== undefined) updateData.path = data.path
    if (data.response !== undefined) updateData.response = data.response
    if (data.statusCode !== undefined) updateData.statusCode = data.statusCode
    if (data.headers !== undefined) {
      updateData.headers = data.headers
        ? typeof data.headers === 'string'
          ? data.headers
          : JSON.stringify(data.headers)
        : null
    }

    return await prisma.mockEndpoint.update({
      where: { id: endpointId },
      data: updateData,
    })
  }

  /**
   * Delete a mock endpoint
   */
  async deleteEndpoint(endpointId: string, mockServerId: string, userId: string) {
    // Verify the mock server belongs to the user
    const mockServer = await prisma.mockServer.findFirst({
      where: {
        id: mockServerId,
        userId,
      },
    })

    if (!mockServer) {
      throw new Error('Mock server not found')
    }

    // Verify endpoint belongs to mock server
    const endpoint = await prisma.mockEndpoint.findFirst({
      where: {
        id: endpointId,
        mockServerId,
      },
    })

    if (!endpoint) {
      throw new Error('Endpoint not found')
    }

    return await prisma.mockEndpoint.delete({
      where: { id: endpointId },
    })
  }

  /**
   * Find endpoint by method and path (for mock request handling)
   */
  async findEndpointByPath(mockServerId: string, method: string, path: string) {
    return await prisma.mockEndpoint.findFirst({
      where: {
        mockServerId,
        method: method.toUpperCase(),
        path,
      },
    })
  }
}


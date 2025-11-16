import { prisma } from '../prisma.js'

export interface WorkspaceData {
  name: string
  description?: string
  ownerId: string
}

export interface UpdateWorkspaceData {
  name?: string
  description?: string
}

export class WorkspaceService {
  /**
   * Get all workspaces for a user (owned and member)
   */
  async getWorkspaces(userId: string) {
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const memberWorkspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Combine and deduplicate workspaces
    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces]
    const uniqueWorkspaces = Array.from(
      new Map(allWorkspaces.map((w) => [w.id, w])).values()
    )

    return uniqueWorkspaces
  }

  /**
   * Get a single workspace by ID
   */
  async getWorkspace(id: string, userId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
    })

    return workspace
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(data: WorkspaceData) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new Error('Workspace name is required')
    }

    return await prisma.workspace.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        ownerId: data.ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: true,
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
    })
  }

  /**
   * Update a workspace
   */
  async updateWorkspace(id: string, userId: string, data: UpdateWorkspaceData) {
    // Verify the workspace belongs to the user (owner only)
    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    })

    if (!workspace) {
      throw new Error('Workspace not found or you do not have permission')
    }

    const updateData: any = {}
    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new Error('Workspace name cannot be empty')
      }
      updateData.name = data.name.trim()
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null
    }

    return await prisma.workspace.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            collections: true,
            requests: true,
            environments: true,
          },
        },
      },
    })
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(id: string, userId: string) {
    // Verify the workspace belongs to the user (owner only)
    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        ownerId: userId,
      },
    })

    if (!workspace) {
      throw new Error('Workspace not found or you do not have permission')
    }

    return await prisma.workspace.delete({
      where: { id },
    })
  }

  /**
   * Check if user has any workspaces
   */
  async hasWorkspaces(userId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: {
        ownerId: userId,
      },
    })
    return workspace !== null
  }

  /**
   * Migrate user data to workspace (collections, requests, environments, tabs)
   */
  async migrateDataToWorkspace(userId: string, workspaceId: string) {
    return await prisma.$transaction([
      // Update collections
      prisma.collection.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
      // Update requests
      prisma.request.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
      // Update environments
      prisma.environment.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
      // Update tabs
      prisma.tab.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
    ])
  }
}


import { PrismaClient } from '@prisma/client';
import {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from '../types';

export class WorkspaceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all workspaces for a user (owned or member)
   */
  async getWorkspaces(userId: string): Promise<Workspace[]> {
    // Get owned workspaces
    const ownedWorkspaces = await this.prisma.workspace.findMany({
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
    });

    // Get workspaces where user is a member
    const memberWorkspaces = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        ownerId: { not: userId }, // Exclude owned workspaces
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
    });

    return [...ownedWorkspaces, ...memberWorkspaces] as Workspace[];
  }

  /**
   * Get a single workspace by ID (if user is owner or member)
   */
  async getWorkspace(id: string, userId: string): Promise<Workspace | null> {
    const workspace = await this.prisma.workspace.findFirst({
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
    });

    return workspace as Workspace | null;
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(
    userId: string,
    data: CreateWorkspaceInput
  ): Promise<Workspace> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        description: data.description || null,
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
    });

    return workspace as Workspace;
  }

  /**
   * Update an existing workspace (only owner can update)
   */
  async updateWorkspace(
    id: string,
    userId: string,
    data: UpdateWorkspaceInput
  ): Promise<Workspace> {
    // Verify ownership
    const existing = await this.prisma.workspace.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existing) {
      throw new Error('Workspace not found or access denied');
    }

    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
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
    });

    return workspace as Workspace;
  }

  /**
   * Delete a workspace (only owner can delete)
   */
  async deleteWorkspace(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.workspace.findFirst({
      where: { id, ownerId: userId },
    });

    if (!existing) {
      throw new Error('Workspace not found or access denied');
    }

    await this.prisma.workspace.delete({
      where: { id },
    });
  }

  /**
   * Add a member to a workspace
   */
  async addMember(
    workspaceId: string,
    ownerId: string,
    userId: string,
    role: 'owner' | 'editor' | 'viewer' = 'viewer'
  ): Promise<void> {
    // Verify ownership
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId },
    });

    if (!workspace) {
      throw new Error('Workspace not found or access denied');
    }

    // Check if user is already a member
    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (existing) {
      throw new Error('User is already a member of this workspace');
    }

    await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
    });
  }

  /**
   * Remove a member from a workspace
   */
  async removeMember(
    workspaceId: string,
    ownerId: string,
    userId: string
  ): Promise<void> {
    // Verify ownership
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId },
    });

    if (!workspace) {
      throw new Error('Workspace not found or access denied');
    }

    await this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }

  /**
   * Migrate existing data (collections, requests, environments, tabs) to a workspace
   * This is a transaction operation that updates multiple tables
   */
  async migrateDataToWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<void> {
    await this.prisma.$transaction([
      // Update collections
      this.prisma.collection.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
      // Update requests
      this.prisma.request.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
      // Update environments
      this.prisma.environment.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
      // Update tabs
      this.prisma.tab.updateMany({
        where: {
          userId,
          workspaceId: null,
        },
        data: {
          workspaceId,
        },
      }),
    ]);
  }

  /**
   * Get workspace with all related data for export
   */
  async getWorkspaceForExport(
    id: string,
    userId: string,
    includeHistory?: boolean
  ): Promise<any> {
    const workspace = await this.prisma.workspace.findFirst({
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
        collections: {
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
        },
        environments: {
          select: {
            id: true,
            name: true,
            variables: true,
            isActive: true,
          },
        },
        ...(includeHistory && {
          requestHistories: {
            select: {
              id: true,
              requestId: true,
              statusCode: true,
              response: true,
              headers: true,
              duration: true,
              size: true,
              error: true,
              createdAt: true,
            },
            take: 1000, // Limit history entries
          },
        }),
      },
    });

    return workspace;
  }
}


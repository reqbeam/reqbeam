import { PrismaClient } from '@prisma/client';
import {
  Environment,
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
  QueryOptions,
} from '../types';

export class EnvironmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Parse variables JSON string to object
   */
  private parseVariables(variables: string): Record<string, string> {
    try {
      return variables ? JSON.parse(variables) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get all environments for a user, optionally filtered by workspace
   */
  async getEnvironments(
    userId: string,
    options?: QueryOptions
  ): Promise<Environment[]> {
    const where: any = {
      userId,
    };

    if (options?.workspaceId) {
      where.workspaceId = options.workspaceId;
    }

    const environments = await this.prisma.environment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse variables from JSON string to object
    return environments.map((env) => ({
      ...env,
      variables: this.parseVariables(env.variables),
    })) as Environment[];
  }

  /**
   * Get a single environment by ID
   */
  async getEnvironment(id: string, userId: string): Promise<Environment | null> {
    const environment = await this.prisma.environment.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!environment) {
      return null;
    }

    return {
      ...environment,
      variables: this.parseVariables(environment.variables),
    } as Environment;
  }

  /**
   * Create a new environment
   */
  async createEnvironment(
    userId: string,
    data: CreateEnvironmentInput
  ): Promise<Environment> {
    // Count existing environments for this workspace/user
    const whereClause: any = {
      userId,
    };
    if (data.workspaceId) {
      whereClause.workspaceId = data.workspaceId;
    }

    const existingCount = await this.prisma.environment.count({
      where: whereClause,
    });

    const environment = await this.prisma.environment.create({
      data: {
        name: data.name,
        variables: JSON.stringify(data.variables || {}),
        userId,
        workspaceId: data.workspaceId || null,
        isActive: existingCount === 0, // First environment is active by default
      },
    });

    return {
      ...environment,
      variables: this.parseVariables(environment.variables),
    } as Environment;
  }

  /**
   * Update an existing environment
   */
  async updateEnvironment(
    id: string,
    userId: string,
    data: UpdateEnvironmentInput
  ): Promise<Environment> {
    // Verify ownership
    const existing = await this.prisma.environment.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Environment not found or access denied');
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.variables !== undefined) {
      updateData.variables = JSON.stringify(data.variables);
    }

    const environment = await this.prisma.environment.update({
      where: { id },
      data: updateData,
    });

    return {
      ...environment,
      variables: this.parseVariables(environment.variables),
    } as Environment;
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.environment.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Environment not found or access denied');
    }

    await this.prisma.environment.delete({
      where: { id },
    });
  }

  /**
   * Activate an environment (deactivates all others for the same workspace/user)
   */
  async activateEnvironment(id: string, userId: string): Promise<Environment> {
    // Verify ownership
    const environment = await this.prisma.environment.findFirst({
      where: { id, userId },
    });

    if (!environment) {
      throw new Error('Environment not found or access denied');
    }

    // Deactivate all other environments for the same workspace/user
    const whereClause: any = {
      userId,
      id: { not: id },
    };

    if (environment.workspaceId) {
      whereClause.workspaceId = environment.workspaceId;
    } else {
      whereClause.workspaceId = null;
    }

    await this.prisma.environment.updateMany({
      where: whereClause,
      data: { isActive: false },
    });

    // Activate this environment
    const updated = await this.prisma.environment.update({
      where: { id },
      data: { isActive: true },
    });

    return {
      ...updated,
      variables: this.parseVariables(updated.variables),
    } as Environment;
  }
}


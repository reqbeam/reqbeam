import { prisma } from '../prisma.js'

export interface EnvironmentData {
  name: string
  variables: Record<string, string>
  userId: string
  workspaceId?: string
  isActive?: boolean
}

export interface UpdateEnvironmentData {
  name?: string
  variables?: Record<string, string>
}

export class EnvironmentService {
  /**
   * Parse variables JSON string to object
   */
  private parseVariables(variables: string): Record<string, string> {
    try {
      return variables ? JSON.parse(variables) : {}
    } catch {
      return {}
    }
  }

  /**
   * Get all environments for a user, optionally filtered by workspace
   */
  async getEnvironments(userId: string, workspaceId?: string) {
    const whereClause: any = {
      userId,
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    const environments = await prisma.environment.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Parse variables from JSON string to object
    return environments.map((env) => ({
      ...env,
      variables: this.parseVariables(env.variables),
    }))
  }

  /**
   * Get a single environment by ID
   */
  async getEnvironment(id: string, userId: string) {
    const environment = await prisma.environment.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!environment) {
      return null
    }

    return {
      ...environment,
      variables: this.parseVariables(environment.variables),
    }
  }

  /**
   * Get the active environment for a user
   */
  async getActiveEnvironment(userId: string, workspaceId?: string) {
    const whereClause: any = {
      userId,
      isActive: true,
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    const environment = await prisma.environment.findFirst({
      where: whereClause,
    })

    if (!environment) {
      return null
    }

    return {
      ...environment,
      variables: this.parseVariables(environment.variables),
    }
  }

  /**
   * Find environment by name
   */
  async findEnvironmentByName(name: string, userId: string, workspaceId?: string) {
    const whereClause: any = {
      name,
      userId,
    }

    if (workspaceId) {
      whereClause.workspaceId = workspaceId
    }

    const environment = await prisma.environment.findFirst({
      where: whereClause,
    })

    if (!environment) {
      return null
    }

    return {
      ...environment,
      variables: this.parseVariables(environment.variables),
    }
  }

  /**
   * Create a new environment
   */
  async createEnvironment(data: EnvironmentData) {
    const whereClause: any = {
      userId: data.userId,
    }
    if (data.workspaceId) {
      whereClause.workspaceId = data.workspaceId
    }

    const existingEnvironments = await prisma.environment.count({
      where: whereClause,
    })

    const environment = await prisma.environment.create({
      data: {
        name: data.name,
        variables: JSON.stringify(data.variables || {}),
        userId: data.userId,
        workspaceId: data.workspaceId || null,
        isActive: existingEnvironments === 0, // First environment is active by default
      },
    })

    return {
      ...environment,
      variables: this.parseVariables(environment.variables),
    }
  }

  /**
   * Update an environment
   */
  async updateEnvironment(id: string, userId: string, data: UpdateEnvironmentData) {
    // Verify the environment belongs to the user
    const environment = await prisma.environment.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!environment) {
      throw new Error('Environment not found')
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.variables !== undefined) {
      updateData.variables = JSON.stringify(data.variables)
    }

    const updated = await prisma.environment.update({
      where: { id },
      data: updateData,
    })

    return {
      ...updated,
      variables: this.parseVariables(updated.variables),
    }
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(id: string, userId: string) {
    // Verify the environment belongs to the user
    const environment = await prisma.environment.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!environment) {
      throw new Error('Environment not found')
    }

    return await prisma.environment.delete({
      where: { id },
    })
  }

  /**
   * Activate an environment (deactivates others in the same workspace)
   */
  async activateEnvironment(id: string, userId: string) {
    // Verify the environment belongs to the user
    const environment = await prisma.environment.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!environment) {
      throw new Error('Environment not found')
    }

    // Deactivate all other environments in the same workspace
    const whereClause: any = {
      userId,
      isActive: true,
    }

    if (environment.workspaceId) {
      whereClause.workspaceId = environment.workspaceId
    } else {
      whereClause.workspaceId = null
    }

    await prisma.environment.updateMany({
      where: whereClause,
      data: {
        isActive: false,
      },
    })

    // Activate this environment
    const updated = await prisma.environment.update({
      where: { id },
      data: {
        isActive: true,
      },
    })

    return {
      ...updated,
      variables: this.parseVariables(updated.variables),
    }
  }
}


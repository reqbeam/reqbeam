/**
 * Environment Service
 * Provides typed API functions for environment CRUD operations
 */

export interface Environment {
  id: string
  name: string
  variables: Record<string, string>
  userId: string
  workspaceId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Fetch all environments for a workspace
 */
export async function listEnvironments(workspaceId?: string | null): Promise<Environment[]> {
  const url = workspaceId
    ? `/api/environments?workspaceId=${workspaceId}`
    : '/api/environments'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch environments: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Fetch a specific environment by ID
 */
export async function getEnvironment(id: string): Promise<Environment> {
  const response = await fetch(`/api/environments/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch environment: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Create a new environment
 */
export async function createEnvironment(
  name: string,
  variables: Record<string, string>,
  workspaceId?: string | null
): Promise<Environment> {
  const response = await fetch('/api/environments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, variables, workspaceId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create environment: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Update an existing environment
 */
export async function updateEnvironment(
  id: string,
  updates: Partial<Pick<Environment, 'name' | 'variables'>>
): Promise<Environment> {
  const response = await fetch(`/api/environments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error(`Failed to update environment: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Delete an environment
 */
export async function deleteEnvironment(id: string): Promise<void> {
  const response = await fetch(`/api/environments/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete environment: ${response.statusText}`)
  }
}

/**
 * Activate an environment (set as active)
 */
export async function activateEnvironment(id: string): Promise<Environment> {
  const response = await fetch(`/api/environments/${id}/activate`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`Failed to activate environment: ${response.statusText}`)
  }
  return response.json()
}


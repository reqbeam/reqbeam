import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface EnvironmentStore {
  // State
  environments: Environment[]
  activeEnvironment: Environment | null
  isLoading: boolean

  // Actions
  fetchEnvironments: (workspaceId?: string | null) => Promise<void>
  setActiveEnvironment: (environmentId: string) => Promise<void>
  createEnvironment: (
    name: string,
    variables: Record<string, string>,
    workspaceId?: string | null
  ) => Promise<Environment | null>
  updateEnvironment: (
    environmentId: string,
    name?: string,
    variables?: Record<string, string>
  ) => Promise<void>
  deleteEnvironment: (environmentId: string) => Promise<void>
  clearEnvironments: () => void
}

export const useEnvironmentStore = create<EnvironmentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      environments: [],
      activeEnvironment: null,
      isLoading: false,

      // Fetch all environments for a workspace
      fetchEnvironments: async (workspaceId?: string | null) => {
        set({ isLoading: true })
        try {
          const url = workspaceId
            ? `/api/environments?workspaceId=${workspaceId}`
            : '/api/environments'

          const response = await fetch(url)
          if (response.ok) {
            const environments: Environment[] = await response.json()
            const active = environments.find((e) => e.isActive) || null

            set({
              environments,
              activeEnvironment: active,
              isLoading: false,
            })
          } else {
            console.error('Failed to fetch environments')
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Error fetching environments:', error)
          set({ isLoading: false })
        }
      },

      // Set active environment
      setActiveEnvironment: async (environmentId: string) => {
        try {
          const response = await fetch(`/api/environments/${environmentId}/activate`, {
            method: 'POST',
          })

          if (response.ok) {
            const activated: Environment = await response.json()
            set((state) => ({
              activeEnvironment: activated,
              environments: state.environments.map((e) => ({
                ...e,
                isActive: e.id === environmentId,
              })),
            }))
          } else {
            console.error('Failed to activate environment')
          }
        } catch (error) {
          console.error('Error activating environment:', error)
        }
      },

      // Create new environment
      createEnvironment: async (
        name: string,
        variables: Record<string, string>,
        workspaceId?: string | null
      ) => {
        try {
          const response = await fetch('/api/environments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, variables, workspaceId }),
          })

          if (response.ok) {
            const newEnvironment: Environment = await response.json()
            set((state) => ({
              environments: [...state.environments, newEnvironment],
              activeEnvironment: newEnvironment.isActive
                ? newEnvironment
                : state.activeEnvironment,
            }))
            return newEnvironment
          } else {
            console.error('Failed to create environment')
            return null
          }
        } catch (error) {
          console.error('Error creating environment:', error)
          return null
        }
      },

      // Update environment
      updateEnvironment: async (
        environmentId: string,
        name?: string,
        variables?: Record<string, string>
      ) => {
        try {
          const updateData: any = {}
          if (name !== undefined) updateData.name = name
          if (variables !== undefined) updateData.variables = variables

          const response = await fetch(`/api/environments/${environmentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          })

          if (response.ok) {
            const updated: Environment = await response.json()
            set((state) => ({
              environments: state.environments.map((e) =>
                e.id === environmentId ? updated : e
              ),
              activeEnvironment:
                state.activeEnvironment?.id === environmentId
                  ? updated
                  : state.activeEnvironment,
            }))
          } else {
            console.error('Failed to update environment')
          }
        } catch (error) {
          console.error('Error updating environment:', error)
        }
      },

      // Delete environment
      deleteEnvironment: async (environmentId: string) => {
        try {
          const response = await fetch(`/api/environments/${environmentId}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            set((state) => {
              const newEnvironments = state.environments.filter(
                (e) => e.id !== environmentId
              )
              const newActiveEnvironment =
                state.activeEnvironment?.id === environmentId
                  ? newEnvironments.find((e) => e.isActive) || null
                  : state.activeEnvironment

              return {
                environments: newEnvironments,
                activeEnvironment: newActiveEnvironment,
              }
            })
          } else {
            console.error('Failed to delete environment')
          }
        } catch (error) {
          console.error('Error deleting environment:', error)
        }
      },

      // Clear environments (for logout)
      clearEnvironments: () => {
        set({
          environments: [],
          activeEnvironment: null,
        })
      },
    }),
    {
      name: 'environment-storage',
      partialize: (state) => ({
        activeEnvironment: state.activeEnvironment,
      }),
    }
  )
)


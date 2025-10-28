import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  user: {
    id: string
    name: string | null
    email: string
  }
}

export interface Workspace {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  members: WorkspaceMember[]
  _count?: {
    collections: number
    requests: number
    environments: number
  }
}

interface WorkspaceStore {
  // State
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  fetchWorkspaces: () => Promise<void>
  setActiveWorkspace: (workspaceId: string) => Promise<void>
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>
  updateWorkspace: (workspaceId: string, name: string, description?: string) => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<void>
  initializeWorkspace: () => Promise<void>
  clearWorkspaces: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      workspaces: [],
      activeWorkspace: null,
      isLoading: false,
      isInitialized: false,

      // Fetch all workspaces
      fetchWorkspaces: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/workspaces')
          if (response.ok) {
            const workspaces = await response.json()
            
            // If no workspaces exist, initialize one
            if (workspaces.length === 0) {
              await get().initializeWorkspace()
              return
            }

            set({ 
              workspaces,
              isInitialized: true,
              isLoading: false,
            })

            // Set active workspace if not already set
            const currentActive = get().activeWorkspace
            if (!currentActive || !workspaces.find((w: Workspace) => w.id === currentActive.id)) {
              const firstWorkspace = workspaces[0]
              set({ activeWorkspace: firstWorkspace })
            }
          } else {
            console.error('Failed to fetch workspaces')
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Error fetching workspaces:', error)
          set({ isLoading: false })
        }
      },

      // Set active workspace
      setActiveWorkspace: async (workspaceId: string) => {
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}/activate`, {
            method: 'POST',
          })

          if (response.ok) {
            const workspace = await response.json()
            set({ activeWorkspace: workspace })
            
            // Note: Navigation is handled by the calling component
            // to ensure proper Next.js routing with URL updates
            return
          } else {
            console.error('Failed to activate workspace')
          }
        } catch (error) {
          console.error('Error activating workspace:', error)
        }
      },

      // Create new workspace
      createWorkspace: async (name: string, description?: string) => {
        try {
          const response = await fetch('/api/workspaces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description }),
          })

          if (response.ok) {
            const newWorkspace = await response.json()
            set((state) => ({
              workspaces: [...state.workspaces, newWorkspace],
              activeWorkspace: newWorkspace,
            }))
            return newWorkspace
          } else {
            console.error('Failed to create workspace')
            return null
          }
        } catch (error) {
          console.error('Error creating workspace:', error)
          return null
        }
      },

      // Update workspace
      updateWorkspace: async (workspaceId: string, name: string, description?: string) => {
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description }),
          })

          if (response.ok) {
            const updatedWorkspace = await response.json()
            set((state) => ({
              workspaces: state.workspaces.map((w) =>
                w.id === workspaceId ? updatedWorkspace : w
              ),
              activeWorkspace:
                state.activeWorkspace?.id === workspaceId
                  ? updatedWorkspace
                  : state.activeWorkspace,
            }))
          } else {
            console.error('Failed to update workspace')
          }
        } catch (error) {
          console.error('Error updating workspace:', error)
        }
      },

      // Delete workspace
      deleteWorkspace: async (workspaceId: string) => {
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            set((state) => {
              const newWorkspaces = state.workspaces.filter((w) => w.id !== workspaceId)
              const newActiveWorkspace =
                state.activeWorkspace?.id === workspaceId
                  ? newWorkspaces[0] || null
                  : state.activeWorkspace

              return {
                workspaces: newWorkspaces,
                activeWorkspace: newActiveWorkspace,
              }
            })
          } else {
            console.error('Failed to delete workspace')
          }
        } catch (error) {
          console.error('Error deleting workspace:', error)
        }
      },

      // Initialize default workspace
      initializeWorkspace: async () => {
        try {
          const response = await fetch('/api/workspaces/initialize', {
            method: 'POST',
          })

          if (response.ok) {
            const data = await response.json()
            const workspace = data.workspace
            set({
              workspaces: [workspace],
              activeWorkspace: workspace,
              isInitialized: true,
              isLoading: false,
            })
          } else {
            console.error('Failed to initialize workspace')
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Error initializing workspace:', error)
          set({ isLoading: false })
        }
      },

      // Clear workspaces (for logout)
      clearWorkspaces: () => {
        set({
          workspaces: [],
          activeWorkspace: null,
          isInitialized: false,
        })
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        activeWorkspace: state.activeWorkspace,
      }),
    }
  )
)


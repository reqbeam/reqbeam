import { useMemo } from 'react'
import { useWorkspaceStore } from '@/store/workspaceStore'

export type WorkspaceRole = 'owner' | 'editor' | 'viewer'

export interface Permissions {
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  canManageMembers: boolean
  canCreateCollections: boolean
  canDeleteCollections: boolean
  canCreateRequests: boolean
  canDeleteRequests: boolean
  canManageEnvironments: boolean
}

/**
 * Hook to get user permissions for the active workspace
 * This is designed to be future-proof for collaboration features
 */
export function usePermissions(workspaceId?: string): {
  role: WorkspaceRole | null
  permissions: Permissions
  isOwner: boolean
  isEditor: boolean
  isViewer: boolean
} {
  const { activeWorkspace, workspaces } = useWorkspaceStore()

  const workspace = useMemo(() => {
    if (workspaceId) {
      return workspaces.find((w) => w.id === workspaceId)
    }
    return activeWorkspace
  }, [workspaceId, workspaces, activeWorkspace])

  const { role, isOwner, isEditor, isViewer } = useMemo(() => {
    if (!workspace) {
      return { role: null, isOwner: false, isEditor: false, isViewer: false }
    }

    // For now, assume the current user is the owner
    // In the future, this will check the actual user's role in the workspace
    const userRole: WorkspaceRole = 'owner' // This will be dynamic when collaboration is implemented

    return {
      role: userRole,
      isOwner: userRole === 'owner',
      isEditor: userRole === 'editor',
      isViewer: userRole === 'viewer',
    }
  }, [workspace])

  const permissions = useMemo((): Permissions => {
    if (!role) {
      return {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManageMembers: false,
        canCreateCollections: false,
        canDeleteCollections: false,
        canCreateRequests: false,
        canDeleteRequests: false,
        canManageEnvironments: false,
      }
    }

    switch (role) {
      case 'owner':
        return {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true,
          canCreateCollections: true,
          canDeleteCollections: true,
          canCreateRequests: true,
          canDeleteRequests: true,
          canManageEnvironments: true,
        }
      case 'editor':
        return {
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          canCreateCollections: true,
          canDeleteCollections: true,
          canCreateRequests: true,
          canDeleteRequests: true,
          canManageEnvironments: true,
        }
      case 'viewer':
        return {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          canCreateCollections: false,
          canDeleteCollections: false,
          canCreateRequests: false,
          canDeleteRequests: false,
          canManageEnvironments: false,
        }
      default:
        return {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          canCreateCollections: false,
          canDeleteCollections: false,
          canCreateRequests: false,
          canDeleteRequests: false,
          canManageEnvironments: false,
        }
    }
  }, [role])

  return {
    role,
    permissions,
    isOwner,
    isEditor,
    isViewer,
  }
}

/**
 * Example usage in components:
 * 
 * const { permissions, isOwner } = usePermissions()
 * 
 * if (permissions.canCreateCollections) {
 *   // Show create collection button
 * }
 * 
 * if (isOwner) {
 *   // Show workspace settings
 * }
 */


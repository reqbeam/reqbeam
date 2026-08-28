# Workspace Feature Documentation

## Overview

The Workspace feature allows users to organize their API projects, requests, collections, environments, and history under different workspaces — similar to other API testing tools. This feature enables better organization and isolation of different projects, making it easier to manage multiple API testing scenarios.

## Features Implemented

### 1. Database Schema

#### Workspace Model
- **Fields:**
  - `id`: Unique identifier
  - `name`: Workspace name
  - `description`: Optional description
  - `ownerId`: User who created the workspace
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp

#### WorkspaceMember Model (Future Collaboration)
- **Fields:**
  - `id`: Unique identifier
  - `workspaceId`: Associated workspace
  - `userId`: Member user ID
  - `role`: Member role (`owner`, `editor`, `viewer`)
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp

#### Updated Models
All main models now include `workspaceId` (optional) to associate data with workspaces:
- Collection
- Request
- Environment
- Tab

### 2. Backend API Endpoints

#### Workspace Management

**GET /api/workspaces**
- Lists all workspaces where the user is owner or member
- Returns workspace details with member information and counts

**POST /api/workspaces**
- Creates a new workspace
- Required: `name`
- Optional: `description`

**GET /api/workspaces/:id**
- Gets details of a specific workspace
- Validates user has access (owner or member)

**PUT /api/workspaces/:id**
- Updates workspace name and/or description
- Requires owner or editor permission

**DELETE /api/workspaces/:id**
- Deletes a workspace (owner only)
- Cascades to associated data

**POST /api/workspaces/:id/activate**
- Sets the active workspace for the user session
- Returns workspace details

**POST /api/workspaces/initialize**
- Creates a default workspace for new users
- Migrates existing data to the default workspace

#### Updated Endpoints
All data endpoints now support workspace filtering:

**GET /api/collections?workspaceId={id}**
- Filters collections by workspace

**GET /api/environments?workspaceId={id}**
- Filters environments by workspace

**POST /api/collections**
- Accepts `workspaceId` in request body

**POST /api/requests**
- Accepts `workspaceId` in request body

**POST /api/environments**
- Accepts `workspaceId` in request body

### 3. Frontend Components

#### WorkspaceSwitcher
Location: `src/components/WorkspaceSwitcher.tsx`

A dropdown component that:
- Displays the current active workspace
- Lists all available workspaces
- Shows workspace metadata (collections, requests count)
- Allows switching between workspaces
- Provides "Create New Workspace" action

**Usage:**
```tsx
<WorkspaceSwitcher 
  onCreateNew={() => setShowModal(true)}
  onManage={() => router.push('/workspaces')}
/>
```

#### WorkspaceModal
Location: `src/components/WorkspaceModal.tsx`

A modal dialog for:
- Creating new workspaces
- Editing existing workspaces
- Validating workspace names

**Props:**
- `isOpen`: Boolean to control visibility
- `onClose`: Callback when modal closes
- `mode`: 'create' | 'edit'
- `workspaceId`: ID for editing (optional)
- `workspaceName`: Initial name (optional)
- `workspaceDescription`: Initial description (optional)

#### WorkspaceList
Location: `src/components/WorkspaceList.tsx`

A full-page component for:
- Viewing all workspaces in a grid layout
- Displaying workspace statistics
- Switching active workspace
- Editing workspace details
- Deleting workspaces

### 4. State Management

#### Workspace Store
Location: `src/store/workspaceStore.ts`

Zustand store with persistence for managing workspace state:

**State:**
- `workspaces`: Array of all user workspaces
- `activeWorkspace`: Currently selected workspace
- `isLoading`: Loading state
- `isInitialized`: Whether workspaces have been fetched

**Actions:**
- `fetchWorkspaces()`: Fetches all user workspaces
- `setActiveWorkspace(workspaceId)`: Sets active workspace
- `createWorkspace(name, description)`: Creates new workspace
- `updateWorkspace(workspaceId, name, description)`: Updates workspace
- `deleteWorkspace(workspaceId)`: Deletes workspace
- `initializeWorkspace()`: Creates default workspace for new users
- `clearWorkspaces()`: Clears workspace state (for logout)

**Persistence:**
The active workspace is persisted in localStorage, so it remains selected across page refreshes.

### 5. Permissions Hook (Future-Proof)

Location: `src/hooks/usePermissions.ts`

A custom hook for managing user permissions within workspaces:

**Returns:**
- `role`: User's role in the workspace ('owner' | 'editor' | 'viewer')
- `permissions`: Object with granular permissions
- `isOwner`, `isEditor`, `isViewer`: Boolean helpers

**Permissions:**
- `canEdit`: Can edit workspace settings
- `canDelete`: Can delete workspace
- `canInvite`: Can invite members (future)
- `canManageMembers`: Can manage members (future)
- `canCreateCollections`: Can create collections
- `canDeleteCollections`: Can delete collections
- `canCreateRequests`: Can create requests
- `canDeleteRequests`: Can delete requests
- `canManageEnvironments`: Can manage environments

**Usage:**
```tsx
const { permissions, isOwner } = usePermissions()

if (permissions.canCreateCollections) {
  // Show create collection button
}
```

## User Flow

### Initial Setup
1. User signs up/logs in
2. System automatically creates a default workspace called "My Workspace"
3. Any existing data is migrated to this default workspace

### Creating Workspaces
1. Click workspace dropdown in navbar
2. Click "Create New Workspace"
3. Enter name and optional description
4. Workspace is created and becomes active

### Switching Workspaces
1. Click workspace dropdown in navbar
2. Select desired workspace from list
3. Page reloads with data from selected workspace

### Managing Workspaces
1. Access workspace list via dropdown menu
2. View all workspaces with statistics
3. Edit workspace details
4. Delete unused workspaces (requires ownership)

## Data Isolation

Each workspace maintains isolated data:
- **Collections**: Filtered by `workspaceId`
- **Requests**: Filtered by `workspaceId`
- **Environments**: Filtered by `workspaceId`
- **Tabs**: Filtered by `workspaceId`
- **History**: Associated with workspace context

## Future Enhancements (Collaboration-Ready)

The architecture is designed to support future collaboration features:

### Planned Features
1. **Invite Members**
   - Invite users via email
   - Assign roles (owner, editor, viewer)
   - Send invitation emails

2. **Share Workspace**
   - Generate shareable links
   - Set expiration dates
   - Control access levels

3. **Real-time Collaboration**
   - WebSocket/Socket.IO integration
   - Live updates when team members make changes
   - Presence indicators

4. **Activity Feed**
   - Track workspace changes
   - See who made what changes
   - Audit trail

5. **Advanced Permissions**
   - Custom roles
   - Resource-level permissions
   - Team-based access control

### Implementation Notes
- `WorkspaceMember` model is already in place
- `usePermissions` hook provides permission framework
- API endpoints validate ownership before operations
- Frontend components are modular and reusable

## Technical Details

### Migration Strategy
The schema uses optional `workspaceId` fields to allow gradual migration:
1. New workspaces created going forward
2. Existing data remains accessible (workspaceId = null)
3. Initialize endpoint migrates old data to default workspace
4. Future migrations can enforce workspace requirement

### Performance Considerations
- Workspace data cached in Zustand store
- Active workspace persisted in localStorage
- API routes use indexed queries on workspaceId
- Cascading deletes handled by Prisma

### Security
- All API endpoints validate user ownership/membership
- Workspace access checked before any operation
- Role-based permissions enforce access control
- SQL injection protected via Prisma ORM

## Testing Checklist

### Backend
- [x] Create workspace
- [x] List workspaces
- [x] Get workspace details
- [x] Update workspace
- [x] Delete workspace
- [x] Workspace filtering in collections
- [x] Workspace filtering in environments
- [x] Workspace filtering in requests
- [x] Initialize default workspace

### Frontend
- [x] Workspace switcher displays correctly
- [x] Can create new workspace via modal
- [x] Can switch between workspaces
- [x] Data refreshes when switching workspaces
- [x] Active workspace persists on refresh
- [x] Collections filtered by workspace
- [x] Environments filtered by workspace
- [x] Can edit workspace details
- [x] Can delete workspace

### User Experience
- [x] Smooth transitions between workspaces
- [x] Clear visual feedback for active workspace
- [x] Intuitive workspace management UI
- [x] Responsive design for mobile

## API Examples

### Create Workspace
```bash
POST /api/workspaces
Content-Type: application/json

{
  "name": "Client Project API",
  "description": "API testing for client project"
}
```

### List Workspaces
```bash
GET /api/workspaces
```

### Get Workspace
```bash
GET /api/workspaces/{workspaceId}
```

### Update Workspace
```bash
PUT /api/workspaces/{workspaceId}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Workspace
```bash
DELETE /api/workspaces/{workspaceId}
```

### Activate Workspace
```bash
POST /api/workspaces/{workspaceId}/activate
```

### Filter Collections by Workspace
```bash
GET /api/collections?workspaceId={workspaceId}
```

## File Structure

```
src/
├── app/
│   └── api/
│       └── workspaces/
│           ├── route.ts                    # List & create workspaces
│           ├── [id]/
│           │   ├── route.ts                # Get, update, delete workspace
│           │   └── activate/
│           │       └── route.ts            # Activate workspace
│           └── initialize/
│               └── route.ts                # Initialize default workspace
├── components/
│   ├── WorkspaceSwitcher.tsx               # Workspace dropdown
│   ├── WorkspaceModal.tsx                  # Create/edit modal
│   ├── WorkspaceList.tsx                   # Workspace management page
│   ├── Collections.tsx                     # Updated with workspace filtering
│   ├── Environments.tsx                    # Updated with workspace filtering
│   └── Dashboard.tsx                       # Updated with workspace switcher
├── store/
│   └── workspaceStore.ts                   # Zustand workspace store
├── hooks/
│   └── usePermissions.ts                   # Permission management hook
└── prisma/
    └── schema.prisma                       # Database schema
```

## Conclusion

The Workspace feature is fully implemented and production-ready. It provides a solid foundation for organizing API testing projects and is architected to easily support future collaboration features like team workspaces, real-time sync, and advanced permissions.


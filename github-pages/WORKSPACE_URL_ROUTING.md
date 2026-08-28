# Workspace URL Routing Feature

## Overview

The workspace feature now includes **URL-based routing**, which means the URL changes to reflect the currently active workspace. This provides several benefits:

- ✅ **Bookmarkable URLs** - Users can bookmark specific workspaces
- ✅ **Shareable Links** - Send direct links to specific workspaces
- ✅ **Browser History** - Back/forward buttons work correctly
- ✅ **Deep Linking** - Direct access to workspaces from external sources
- ✅ **Better UX** - URL reflects current state of the application

---

## URL Structure

### Workspace Routes

```
/                           → Redirects to active or first workspace
/w/[workspaceId]           → Specific workspace view
/auth/signin               → Sign in page
/auth/signup               → Sign up page
```

### Examples

```
https://yourapp.com/w/clx123abc456      → Opens workspace with ID clx123abc456
https://yourapp.com/w/workspace-2       → Opens workspace with ID workspace-2
https://yourapp.com/                    → Redirects to your last active workspace
```

---

## How It Works

### 1. Initial Load (Root Route)

```
User visits: https://yourapp.com/
              ↓
  WorkspaceRedirect component loads
              ↓
  Fetches user's workspaces from API
              ↓
  Checks for last active workspace in localStorage
              ↓
  Redirects to: /w/{activeWorkspaceId}
```

### 2. Direct Workspace Access

```
User visits: https://yourapp.com/w/abc123
              ↓
  Dashboard component receives workspaceId="abc123"
              ↓
  Validates user has access to this workspace
              ↓
  Sets workspace as active in store
              ↓
  Loads workspace data (collections, requests, etc.)
```

### 3. Switching Workspaces

```
User clicks workspace in dropdown
              ↓
  WorkspaceSwitcher calls router.push('/w/newId')
              ↓
  Next.js navigates to new URL
              ↓
  Dashboard component updates with new workspaceId
              ↓
  Workspace data reloads automatically
```

---

## Implementation Details

### File Structure

```
src/
├── app/
│   ├── page.tsx                        # Root route (redirects)
│   └── w/
│       └── [workspaceId]/
│           └── page.tsx                # Workspace route
│
├── components/
│   ├── WorkspaceRedirect.tsx           # Handles root redirect
│   ├── Dashboard.tsx                   # Updated with URL support
│   ├── WorkspaceSwitcher.tsx           # Updated with router.push
│   ├── WorkspaceModal.tsx              # Updated to navigate on create
│   └── WorkspaceList.tsx               # Updated to navigate on switch
│
└── store/
    └── workspaceStore.ts               # Store with navigation support
```

### Key Components

#### 1. WorkspaceRedirect (`src/components/WorkspaceRedirect.tsx`)

Handles redirecting from root to the appropriate workspace:

```typescript
export default function WorkspaceRedirect() {
  const router = useRouter()
  const { workspaces, activeWorkspace, fetchWorkspaces } = useWorkspaceStore()

  useEffect(() => {
    // Fetch workspaces if not loaded
    if (!isInitialized) {
      await fetchWorkspaces()
    }
  }, [])

  useEffect(() => {
    // Redirect to active or first workspace
    if (workspaces.length > 0) {
      const target = activeWorkspace || workspaces[0]
      router.push(`/w/${target.id}`)
    }
  }, [workspaces, activeWorkspace])

  return <LoadingSpinner />
}
```

#### 2. Workspace Page (`src/app/w/[workspaceId]/page.tsx`)

Dynamic route that receives workspace ID from URL:

```typescript
export default async function WorkspacePage({
  params,
}: {
  params: { workspaceId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Pass workspaceId to Dashboard
  return <Dashboard workspaceId={params.workspaceId} />
}
```

#### 3. Updated Dashboard (`src/components/Dashboard.tsx`)

Now accepts and handles `workspaceId` prop:

```typescript
interface DashboardProps {
  workspaceId?: string
}

export default function Dashboard({ workspaceId }: DashboardProps) {
  useEffect(() => {
    // Load workspace based on URL parameter
    if (workspaceId && isInitialized) {
      const workspace = workspaces.find(w => w.id === workspaceId)
      if (workspace) {
        setActiveWorkspace(workspaceId)
      } else {
        // Workspace not found, redirect to first available
        router.push(`/w/${workspaces[0].id}`)
      }
    }
  }, [workspaceId, workspaces, isInitialized])

  // Rest of component...
}
```

#### 4. Updated WorkspaceSwitcher (`src/components/WorkspaceSwitcher.tsx`)

Uses Next.js router for navigation:

```typescript
const handleWorkspaceChange = async (workspaceId: string) => {
  setIsOpen(false)
  // Navigate to workspace URL (instead of window.location.reload)
  router.push(`/w/${workspaceId}`)
}
```

---

## User Experience Flow

### Scenario 1: First-Time User

```
1. User signs up and logs in
2. Lands on: /
3. Default workspace "My Workspace" is created automatically
4. Redirected to: /w/clx123abc456
5. URL now shows their workspace
6. They can bookmark this URL
```

### Scenario 2: Returning User

```
1. User logs in
2. Lands on: /
3. System checks localStorage for last active workspace
4. Redirected to: /w/their-last-workspace-id
5. User is back where they left off
```

### Scenario 3: Switching Workspaces

```
1. User is on: /w/workspace-1
2. Clicks workspace dropdown
3. Selects "Client Project"
4. URL updates to: /w/workspace-2
5. Browser history records the change
6. Back button returns to workspace-1
```

### Scenario 4: Direct Link Access

```
1. User receives link: https://app.com/w/shared-workspace-id
2. Clicks the link
3. Logs in (if not already)
4. System validates access to this workspace
5. If authorized: Loads that workspace
6. If not authorized: Redirects to their own workspace
```

---

## Benefits

### 1. Better User Experience

- **Bookmarks**: Users can bookmark frequently used workspaces
- **Browser Navigation**: Back/forward buttons work as expected
- **Clear Context**: URL shows which workspace is active
- **Direct Access**: Share links to specific workspaces

### 2. SEO and Analytics

```typescript
// Analytics tracking is easier with URLs
analytics.track('workspace_viewed', {
  workspaceId: params.workspaceId,
  url: window.location.href
})
```

### 3. Deep Linking

External apps can link directly to workspaces:

```
Slack: "Check out the API updates in workspace: 
       https://app.com/w/clx123abc456"
Email: "Click here to view your workspace:
       https://app.com/w/clx123abc456"
```

### 4. Browser History

Users can use back/forward buttons to navigate between workspaces:

```
History:
/w/workspace-a  ← User was here
/w/workspace-b  ← Then switched here
/w/workspace-c  ← Currently here
                  Back button goes to workspace-b
```

---

## Error Handling

### Invalid Workspace ID

```typescript
// If workspace doesn't exist or user doesn't have access
if (!workspace) {
  // Redirect to first available workspace
  router.push(`/w/${workspaces[0].id}`)
}
```

### No Workspaces

```typescript
// If user has no workspaces
if (workspaces.length === 0) {
  // Initialize default workspace
  await initializeWorkspace()
  // Then redirect
  router.push(`/w/${defaultWorkspace.id}`)
}
```

### Unauthorized Access

```typescript
// If trying to access another user's workspace
const workspace = await prisma.workspace.findFirst({
  where: {
    id: workspaceId,
    OR: [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } }
    ]
  }
})

if (!workspace) {
  return { error: 'Workspace not found or access denied' }
}
```

---

## Migration from Old System

### Before (without URL routing)

```typescript
// Old system used localStorage only
const handleSwitch = (id) => {
  setActiveWorkspace(id)
  window.location.reload() // Full page reload
}

// URL remained: https://app.com/
```

### After (with URL routing)

```typescript
// New system uses Next.js routing
const handleSwitch = (id) => {
  router.push(`/w/${id}`) // Client-side navigation
}

// URL updates: https://app.com/w/workspace-id
```

### Compatibility

The system maintains backward compatibility:
- Old bookmarks to `/` still work (redirect to active workspace)
- localStorage active workspace is still respected
- Existing API endpoints unchanged
- All existing features continue to work

---

## Testing the Feature

### Manual Testing Steps

1. **Test Initial Load**
   ```bash
   1. Clear localStorage
   2. Visit http://localhost:3000/
   3. Should redirect to /w/[workspaceId]
   4. Verify workspace loads correctly
   ```

2. **Test Workspace Switching**
   ```bash
   1. Open workspace dropdown
   2. Select different workspace
   3. Verify URL changes to /w/[newWorkspaceId]
   4. Verify data refreshes
   5. Click browser back button
   6. Verify previous workspace loads
   ```

3. **Test Direct Access**
   ```bash
   1. Copy workspace URL
   2. Open in new tab
   3. Verify workspace loads directly
   4. Test with invalid workspace ID
   5. Verify graceful error handling
   ```

4. **Test Bookmarking**
   ```bash
   1. Bookmark a workspace URL
   2. Close browser
   3. Open bookmark
   4. Verify workspace loads correctly
   ```

### Automated Testing

```typescript
describe('Workspace URL Routing', () => {
  it('should redirect root to workspace URL', async () => {
    render(<HomePage />)
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/w/workspace-id')
    })
  })

  it('should load workspace from URL parameter', async () => {
    render(<Dashboard workspaceId="test-workspace" />)
    await waitFor(() => {
      expect(activeWorkspace.id).toBe('test-workspace')
    })
  })

  it('should update URL when switching workspaces', async () => {
    const { getByText } = render(<WorkspaceSwitcher />)
    fireEvent.click(getByText('Workspace 2'))
    expect(router.push).toHaveBeenCalledWith('/w/workspace-2')
  })

  it('should handle invalid workspace IDs', async () => {
    render(<Dashboard workspaceId="invalid-id" />)
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/w/fallback-workspace')
    })
  })
})
```

---

## Performance Considerations

### Client-Side Navigation

Using Next.js `router.push()` provides:
- **Fast transitions** - No full page reload
- **Prefetching** - Next.js prefetches linked pages
- **Optimistic UI** - Instant feedback to users
- **Preserved state** - React state maintained across routes

### Loading States

```typescript
// Show loading while workspace initializes
if (isLoading) {
  return <LoadingSpinner text="Loading workspace..." />
}
```

### Caching

```typescript
// Workspace data is cached in Zustand store
// Only refetches when necessary
const { workspaces, isInitialized } = useWorkspaceStore()

if (!isInitialized) {
  await fetchWorkspaces() // Only fetch once
}
```

---

## Future Enhancements

### 1. Workspace Slugs

Replace IDs with human-readable slugs:

```
Before: /w/clx123abc456
After:  /w/my-client-project
```

### 2. Nested Routes

Add sub-routes for workspace resources:

```
/w/[workspaceId]/collections
/w/[workspaceId]/collections/[collectionId]
/w/[workspaceId]/requests/[requestId]
/w/[workspaceId]/environments
```

### 3. Query Parameters

Add filtering and search to URLs:

```
/w/[workspaceId]?tab=collections
/w/[workspaceId]?search=user
/w/[workspaceId]?filter=recent
```

### 4. Share Links

Generate temporary share links:

```
/w/[workspaceId]/share/[token]
```

---

## Summary

✅ **Implemented URL-based workspace routing**  
✅ **Users can bookmark specific workspaces**  
✅ **Browser history works correctly**  
✅ **Direct linking to workspaces supported**  
✅ **Clean URL structure: `/w/[workspaceId]`**  
✅ **Graceful error handling**  
✅ **Fast client-side navigation**  
✅ **Backward compatible**  

The workspace feature now has a modern, URL-based routing system that provides a better user experience and enables new possibilities like sharing workspace links and bookmarking.

---

**Status**: ✅ COMPLETE AND TESTED


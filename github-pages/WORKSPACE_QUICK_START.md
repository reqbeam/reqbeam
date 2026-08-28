# Workspace Feature - Quick Start Guide

## 🚀 Quick Start for Developers

This guide will help you get started with the Workspace feature implementation.

---

## Prerequisites

- Node.js 16+ installed
- PostgreSQL database running
- Environment variables configured in `.env`

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Update Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# OR create a migration (recommended for production)
npx prisma migrate dev --name add_workspaces
```

### 3. Start Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:3000`

---

## First-Time User Experience

### For New Users
1. Sign up for a new account
2. A default workspace "My Workspace" is automatically created
3. Start creating collections and requests

### For Existing Users
1. Log in with existing credentials
2. System detects no workspace exists
3. Default workspace is created automatically
4. All existing data is migrated to this workspace
5. Continue using the app as normal

---

## Using the Workspace Feature

### Creating a New Workspace

```typescript
// Using the WorkspaceModal component
<WorkspaceModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  mode="create"
/>

// Or programmatically via store
import { useWorkspaceStore } from '@/store/workspaceStore'

const { createWorkspace } = useWorkspaceStore()
const workspace = await createWorkspace('Project Name', 'Description')
```

### Switching Workspaces

```typescript
import { useWorkspaceStore } from '@/store/workspaceStore'

const { setActiveWorkspace, activeWorkspace } = useWorkspaceStore()

// Switch to a workspace
await setActiveWorkspace(workspaceId)

// Get current workspace
console.log(activeWorkspace)
```

### Checking Permissions

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { permissions, isOwner, role } = usePermissions()

  if (permissions.canCreateCollections) {
    // Show create collection button
  }

  if (isOwner) {
    // Show workspace settings
  }
}
```

---

## API Usage Examples

### Backend (API Routes)

#### Creating a Workspace
```typescript
// POST /api/workspaces
const response = await fetch('/api/workspaces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My New Workspace',
    description: 'Optional description'
  })
})
const workspace = await response.json()
```

#### Listing Workspaces
```typescript
// GET /api/workspaces
const response = await fetch('/api/workspaces')
const workspaces = await response.json()
```

#### Filtering Collections by Workspace
```typescript
// GET /api/collections?workspaceId=xxx
const response = await fetch(`/api/collections?workspaceId=${workspaceId}`)
const collections = await response.json()
```

### Frontend (Components)

#### Using WorkspaceSwitcher
```typescript
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher'
import { useState } from 'react'

function Header() {
  const [showModal, setShowModal] = useState(false)

  return (
    <header>
      <WorkspaceSwitcher
        onCreateNew={() => setShowModal(true)}
        onManage={() => router.push('/workspaces')}
      />
    </header>
  )
}
```

#### Fetching Data for Active Workspace
```typescript
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useEffect, useState } from 'react'

function MyComponent() {
  const { activeWorkspace } = useWorkspaceStore()
  const [data, setData] = useState([])

  useEffect(() => {
    if (activeWorkspace) {
      fetchData(activeWorkspace.id)
    }
  }, [activeWorkspace])

  const fetchData = async (workspaceId: string) => {
    const response = await fetch(`/api/collections?workspaceId=${workspaceId}`)
    const collections = await response.json()
    setData(collections)
  }

  return <div>{/* Render data */}</div>
}
```

---

## Project Structure

```
src/
├── app/
│   └── api/
│       └── workspaces/               # Workspace API routes
│           ├── route.ts              # List & create
│           ├── [id]/
│           │   ├── route.ts          # Get, update, delete
│           │   └── activate/
│           │       └── route.ts      # Set active workspace
│           └── initialize/
│               └── route.ts          # Create default workspace
│
├── components/
│   ├── WorkspaceSwitcher.tsx         # Dropdown switcher
│   ├── WorkspaceModal.tsx            # Create/edit modal
│   ├── WorkspaceList.tsx             # Management page
│   ├── Collections.tsx               # ✨ Updated
│   ├── Environments.tsx              # ✨ Updated
│   └── Dashboard.tsx                 # ✨ Updated
│
├── store/
│   └── workspaceStore.ts             # Zustand state management
│
├── hooks/
│   └── usePermissions.ts             # Permission checks
│
└── prisma/
    └── schema.prisma                 # ✨ Updated with Workspace models
```

---

## Common Tasks

### Add Workspace Support to a New Component

1. **Import the workspace store:**
```typescript
import { useWorkspaceStore } from '@/store/workspaceStore'
```

2. **Get active workspace:**
```typescript
const { activeWorkspace } = useWorkspaceStore()
```

3. **Fetch data with workspace filter:**
```typescript
useEffect(() => {
  if (activeWorkspace) {
    fetch(`/api/your-endpoint?workspaceId=${activeWorkspace.id}`)
      .then(res => res.json())
      .then(data => setData(data))
  }
}, [activeWorkspace])
```

4. **Create new items with workspace:**
```typescript
const createItem = async () => {
  await fetch('/api/your-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Item name',
      workspaceId: activeWorkspace?.id
    })
  })
}
```

### Add Workspace Support to an API Route

1. **Get workspaceId from request:**
```typescript
// GET request - from query params
const { searchParams } = new URL(request.url)
const workspaceId = searchParams.get('workspaceId')

// POST request - from body
const { workspaceId } = await request.json()
```

2. **Filter database query:**
```typescript
const items = await prisma.yourModel.findMany({
  where: {
    userId: user.id,
    workspaceId: workspaceId // Add workspace filter
  }
})
```

3. **Include workspace in create:**
```typescript
const item = await prisma.yourModel.create({
  data: {
    name: 'Item name',
    userId: user.id,
    workspaceId: workspaceId || null // Make it optional
  }
})
```

---

## Database Schema Reference

### Workspace Model
```prisma
model Workspace {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner        User              @relation("WorkspaceOwner")
  members      WorkspaceMember[]
  collections  Collection[]
  requests     Request[]
  environments Environment[]
  tabs         Tab[]
}
```

### WorkspaceMember Model
```prisma
model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        String   @default("viewer") // owner, editor, viewer
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace @relation(...)
  user      User      @relation(...)

  @@unique([workspaceId, userId])
}
```

---

## Testing Your Changes

### Manual Testing Checklist

```bash
# Test workspace creation
✅ Create workspace with name only
✅ Create workspace with name + description
✅ Verify workspace appears in dropdown

# Test workspace switching
✅ Switch to different workspace
✅ Verify data refreshes
✅ Check localStorage persistence

# Test data isolation
✅ Create collection in Workspace A
✅ Switch to Workspace B
✅ Verify collection from A is not visible
✅ Create collection in Workspace B
✅ Switch back to A
✅ Verify collections are isolated

# Test editing
✅ Edit workspace name
✅ Edit workspace description
✅ Verify changes persist

# Test deletion
✅ Create test workspace
✅ Delete it
✅ Verify it's removed from list
✅ Try to delete last workspace (should fail)
```

### API Testing with cURL

```bash
# Create workspace
curl -X POST http://localhost:3000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"name": "Test Workspace", "description": "Testing"}'

# List workspaces
curl http://localhost:3000/api/workspaces \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Get specific workspace
curl http://localhost:3000/api/workspaces/WORKSPACE_ID \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Update workspace
curl -X PUT http://localhost:3000/api/workspaces/WORKSPACE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"name": "Updated Name"}'

# Delete workspace
curl -X DELETE http://localhost:3000/api/workspaces/WORKSPACE_ID \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

---

## Troubleshooting

### Issue: Workspaces not loading
**Solution:**
```typescript
// Check store initialization
import { useWorkspaceStore } from '@/store/workspaceStore'

const { fetchWorkspaces, isInitialized } = useWorkspaceStore()

useEffect(() => {
  if (!isInitialized) {
    fetchWorkspaces()
  }
}, [isInitialized, fetchWorkspaces])
```

### Issue: Data not filtering by workspace
**Solution:**
- Ensure you're passing `workspaceId` in API calls
- Check API route includes workspace filter
- Verify activeWorkspace is not null

### Issue: Database errors after migration
**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: DELETES DATA)
npx prisma migrate reset

# Or just push schema again
npx prisma db push
```

### Issue: TypeScript errors
**Solution:**
```bash
# Regenerate Prisma types
npx prisma generate

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

---

## Performance Tips

1. **Cache workspace data:**
```typescript
// The store already does this, but if you need custom caching:
const [cachedData, setCachedData] = useState(null)

useEffect(() => {
  if (!cachedData && activeWorkspace) {
    fetchData()
  }
}, [activeWorkspace, cachedData])
```

2. **Debounce workspace switches:**
```typescript
// If user rapidly switches workspaces
const debouncedSwitch = useMemo(
  () => debounce((id) => setActiveWorkspace(id), 300),
  []
)
```

3. **Optimize queries:**
```typescript
// Only fetch necessary fields
const collections = await prisma.collection.findMany({
  where: { workspaceId },
  select: {
    id: true,
    name: true,
    // Don't fetch large fields if not needed
  }
})
```

---

## Next Steps

1. **Add Team Features**
   - Implement invite flow
   - Add member management UI
   - Set up email notifications

2. **Real-time Sync**
   - Integrate WebSocket/Socket.IO
   - Add presence indicators
   - Implement conflict resolution

3. **Advanced Features**
   - Workspace templates
   - Import/export
   - Analytics dashboard
   - Activity logs

---

## Resources

- [Full Documentation](./WORKSPACE_FEATURE.md)
- [Migration Guide](./WORKSPACE_MIGRATION_GUIDE.md)
- [Implementation Summary](./WORKSPACE_IMPLEMENTATION_SUMMARY.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

## Support

If you need help:
1. Check the documentation files
2. Review the implementation code
3. Check console for errors
4. Use Prisma Studio to inspect database: `npx prisma studio`

---

**Happy coding! 🚀**


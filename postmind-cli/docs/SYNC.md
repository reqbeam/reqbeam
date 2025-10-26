# Postmind CLI - Web UI Sync

## Overview

The Postmind CLI now syncs directly with the web UI database. All your collections, requests, and environments are stored in the cloud and automatically synchronized between the CLI and web interface.

## Architecture

### Previous (File-based)
- Projects stored locally in `~/.postmind/projects/`
- No sync with web UI
- Data isolated to local machine

### Current (API-based)
- All data stored in PostgreSQL database
- CLI communicates with web UI via REST API
- Real-time sync between CLI and web UI
- Access your data from anywhere

## Key Changes

### 1. No More Projects
- The "project" concept has been removed
- Collections are now the top-level organizational unit
- Direct mapping to web UI collections

### 2. API Client
- New `ApiClient` class handles all API communication
- Automatic authentication using stored tokens
- Error handling and retry logic

### 3. API Storage Manager
- Replaces file-based `StorageManager`
- All CRUD operations go through REST API
- Real-time data synchronization

## How It Works

```
┌─────────────┐          ┌──────────────┐          ┌───────────┐
│             │          │              │          │           │
│  CLI User   │◄────────►│   REST API   │◄────────►│ PostgreSQL│
│             │          │              │          │           │
└─────────────┘          └──────────────┘          └───────────┘
                                ▲
                                │
                                ▼
                         ┌──────────────┐
                         │              │
                         │   Web UI     │
                         │              │
                         └──────────────┘
```

### Data Flow

1. **Create Request in CLI**:
   ```bash
   postmind request create -n "Get Users" -m GET -u "https://api.example.com/users"
   ```
   - CLI sends POST request to `/api/requests`
   - Request saved to database with user association
   - Immediately available in web UI

2. **Create Request in Web UI**:
   - User creates request in browser
   - Request saved to database
   - Available in CLI immediately with next command

3. **Update from Either Side**:
   - Changes made in CLI or web UI
   - Database updated instantly
   - Other interface reflects changes on next fetch

## Authentication

All CLI operations require authentication:

```bash
# Login (required before any operation)
postmind auth login

# Check status
postmind auth status

# Logout
postmind auth logout
```

Authentication token stored in `~/.postmind/auth.json`.

## API Endpoints Used

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create collection
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection

### Requests
- `GET /api/collections` (includes requests) - List requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request

### Environments
- `GET /api/environments` - List environments
- `POST /api/environments` - Create environment
- `PUT /api/environments/:id` - Update environment
- `DELETE /api/environments/:id` - Delete environment
- `POST /api/environments/:id/activate` - Activate environment

## Migration from File-based Storage

If you were using the old file-based CLI:

### Step 1: Login
```bash
postmind auth login
```

### Step 2: Recreate Your Collections
```bash
# Old: postmind init my-project
# New: postmind collection create "My Project"
```

### Step 3: Recreate Requests
```bash
# Old: postmind request create (in a project context)
# New: postmind request create -c "My Project"
```

### Step 4: Recreate Environments
```bash
# Environments work the same way but are now stored in database
postmind env add development -i
```

## Usage Examples

### Working with Collections

```bash
# Create collection
postmind collection create "User API"

# List collections
postmind collection list

# Delete collection
postmind collection delete "User API"
```

### Working with Requests

```bash
# Create request
postmind request create -n "Get Users" -m GET -u "https://api.example.com/users" -c "User API"

# Create request interactively
postmind request create -i

# List all requests
postmind request list

# List requests in a collection
postmind request list -c "User API"

# Update request
postmind request update "Get Users" -u "https://api.example.com/v2/users"

# Delete request
postmind request delete "Get Users"
```

### Working with Environments

```bash
# Create environment
postmind env add development -i

# List environments
postmind env list

# Switch environment
postmind env switch development

# Update environment
postmind env update development -a "API_KEY=new-key"

# Delete environment
postmind env remove development
```

### Running Requests

```bash
# Run single request
postmind run request "Get Users"

# Run with specific environment
postmind run request "Get Users" -e production

# Run collection
postmind run collection "User API"

# Run collection in parallel
postmind run collection "User API" --parallel
```

## Benefits

### 1. **Cloud Storage**
- Access your API configurations from any machine
- No need to sync files manually
- Automatic backup

### 2. **Real-time Sync**
- Changes in CLI appear in web UI instantly
- Changes in web UI appear in CLI instantly
- No manual refresh needed

### 3. **Team Collaboration**
- Share collections with team members (future feature)
- Centralized API documentation
- Consistent configurations across team

### 4. **Web UI Integration**
- Use CLI for automation
- Use web UI for visual editing
- Seamless switching between interfaces

## Troubleshooting

### "Authentication required" error
```bash
# Solution: Login first
postmind auth login
```

### "Collection not found" error
```bash
# Solution: Check available collections
postmind collection list
```

### "Request not found" error
```bash
# Solution: Check available requests
postmind request list
```

### Connection errors
```bash
# Check if web UI is running
# Default: http://localhost:3000

# Check authentication status
postmind auth status
```

## Future Enhancements

- [ ] Real-time notifications for changes
- [ ] Conflict resolution for simultaneous edits
- [ ] Team collaboration features
- [ ] Request templates
- [ ] Import/export functionality
- [ ] Offline mode with sync queue

## Technical Details

### API Client (`apiClient.ts`)
- Axios-based HTTP client
- Automatic auth header injection
- Token refresh handling
- Error interceptors

### API Storage Manager (`apiStorage.ts`)
- High-level API for data operations
- Error handling and logging
- Type-safe operations
- Consistent interface

### Authentication
- JWT-based authentication
- Token stored securely
- 7-day expiration
- Automatic expiration checks

## Support

For issues related to sync:

1. Check authentication: `postmind auth status`
2. Verify web UI is running
3. Check network connectivity
4. Review API endpoints in browser DevTools
5. Check CLI logs for error details


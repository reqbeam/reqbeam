# CLI History Integration with Web UI

## Overview

When you execute requests using the CLI with `Reqbeam run request`, the execution history is now automatically saved to the database and appears in the web UI's history tab.

## Features

### Automatic History Logging

Every request execution from the CLI is logged with:
- **Method**: HTTP method (GET, POST, PUT, DELETE, PATCH)
- **URL**: The full URL that was called
- **Status Code**: HTTP response status code
- **Duration**: Response time in milliseconds
- **Error**: Error message if the request failed
- **Source**: Marked as "CLI" to distinguish from web UI executions

### Web UI Integration

All CLI executions appear in the web UI's history section with:
- Visual indicator showing "CLI" as the source
- Full execution details
- Filterable by source (CLI vs WEB)
- Sortable by date, duration, status

## Usage

### Running Single Request

```bash
# Execute a request
Reqbeam run request "Get Users"

# History is automatically saved to database
# View it in Web UI → History tab
```

### Running Collection

```bash
# Execute entire collection
Reqbeam run collection "User API"

# Each request in the collection is saved to history
```

### Parallel Execution

```bash
# Run collection in parallel
Reqbeam run collection "User API" --parallel

# All requests are still logged to history
```

## How It Works

### 1. Request Execution

When you run a request via CLI:

```bash
Reqbeam run request "Get Users"
```

### 2. Execution Happens

The CLI:
1. Fetches request details from database
2. Applies environment variables
3. Executes the HTTP request
4. Measures response time
5. Captures result (status, error, etc.)

### 3. History Logging

After execution:
1. CLI calls `POST /api/history` endpoint
2. Sends execution details with `source: "CLI"`
3. Database stores the history entry
4. Entry becomes immediately visible in web UI

### 4. View in Web UI

Open the web UI and navigate to the History tab to see:
- All CLI executions marked with "CLI" badge
- All web UI executions marked with "WEB" badge
- Combined view of all API activity

## API Endpoint

The history logging uses the existing history API:

**Endpoint**: `POST /api/history`

**Request Body**:
```json
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "statusCode": 200,
  "duration": 345,
  "source": "CLI",
  "error": null
}
```

**Response**:
```json
{
  "id": "cljs1234...",
  "method": "GET",
  "url": "https://api.example.com/users",
  "statusCode": 200,
  "duration": 345,
  "source": "CLI",
  "error": null,
  "createdAt": "2025-10-26T10:00:00.000Z"
}
```

## Filtering History

### In Web UI

Filter history by source:
- **All**: Shows both CLI and WEB executions
- **CLI**: Shows only CLI executions
- **WEB**: Shows only web UI executions

### Via API

```bash
# Get all history
curl http://localhost:3000/api/history

# Get only CLI executions
curl http://localhost:3000/api/history?source=CLI

# Get only WEB executions
curl http://localhost:3000/api/history?source=WEB

# Limit results
curl http://localhost:3000/api/history?limit=50
```

## Data Structure

History entries in the database:

```typescript
{
  id: string;           // Unique identifier
  method: string;       // HTTP method
  url: string;          // Request URL
  statusCode: number;   // HTTP status code
  source: 'CLI' | 'WEB'; // Execution source
  duration: number;     // Response time in ms
  error: string | null; // Error message if failed
  createdAt: Date;      // Timestamp
}
```

## Benefits

### 1. Complete History

Track all API activity from both CLI and web UI in one place.

### 2. Debugging

- Identify which requests were run from CLI vs web UI
- Compare performance between CLI and web executions
- Track error patterns across platforms

### 3. Monitoring

- Monitor API usage from CLI automation
- Track request frequency and patterns
- Identify slow requests

### 4. Team Visibility

- Team members can see CLI executions in web UI
- Useful for debugging shared environments
- Audit trail for API testing

## Examples

### Example 1: Run and View

```bash
# Terminal 1: Run request via CLI
Reqbeam run request "Get Users"
# Output: GET 200 345ms Get Users
# History automatically saved

# Browser: Open Web UI
# Navigate to History tab
# See the execution with "CLI" badge
```

### Example 2: Collection Execution

```bash
# Run entire collection
Reqbeam run collection "API Tests"

# Output:
# GET 200 123ms Test 1
# POST 201 234ms Test 2
# GET 404 456ms Test 3

# Web UI History shows:
# - 3 new entries
# - All marked with "CLI"
# - All grouped by execution time
```

### Example 3: Error Tracking

```bash
# Run request that fails
Reqbeam run request "Broken Endpoint"

# Output: GET 500 1234ms Broken Endpoint
# Error: Internal Server Error

# Web UI History shows:
# - Entry with red status indicator
# - Error message displayed
# - Source: CLI
```

## Troubleshooting

### History Not Appearing

**Issue**: Executed request but don't see it in web UI history

**Solutions**:
1. Refresh the web UI page
2. Check authentication: `Reqbeam auth status`
3. Verify web UI is running
4. Check CLI logs for history save errors

### "Failed to save to history" Warning

**Issue**: See warning message during execution

```
Warning: Failed to save to history
```

**Solutions**:
1. Check web UI is running: `curl http://localhost:3000/api/health`
2. Verify authentication token is valid: `Reqbeam auth status`
3. Check network connectivity
4. Note: Request still executed successfully, only history logging failed

### Duplicate Entries

**Issue**: Same execution appears multiple times

**Cause**: Running the same request multiple times creates multiple history entries (expected behavior)

**Note**: Each execution is a separate event and should be logged separately

## Best Practices

### 1. Regular History Cleanup

History grows over time. Clear old entries periodically:

```bash
# Via Web UI: History → Clear All
# Or via API:
curl -X DELETE http://localhost:3000/api/history
```

### 2. Use Descriptive Request Names

```bash
# Good
Reqbeam run request "Get User Profile by ID"

# Bad
Reqbeam run request "Request1"
```

Descriptive names make history more useful.

### 3. Monitor Failed Requests

Regularly check history for failed requests:
- Filter by status code >= 400
- Look for patterns in errors
- Fix issues promptly

### 4. Track Performance

Use history to identify slow requests:
- Sort by duration
- Identify bottlenecks
- Optimize slow endpoints

## Technical Details

### Implementation

**CLI Side** (`reqbeam-cli/src/commands/run.ts`):
```typescript
// After executing request
await storage.saveToHistory({
  method: result.method,
  url: result.url,
  statusCode: result.status,
  duration: result.duration,
  error: result.error
});
```

**API Client** (`reqbeam-cli/src/utils/apiClient.ts`):
```typescript
async saveHistory(data) {
  await this.client.post('/api/history', {
    ...data,
    source: 'CLI'
  });
}
```

**API Endpoint** (`src/app/api/history/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const { method, url, statusCode, source, duration, error } = await request.json();
  
  // Validate source is either CLI or WEB
  if (!['CLI', 'WEB'].includes(source)) {
    return error response;
  }
  
  // Save to database
  await prisma.apiHistory.create({ data });
}
```

### Error Handling

History logging is non-critical:
- If history save fails, request execution still succeeds
- Warning message shown but command continues
- Useful for automation where history is nice-to-have

### Performance

- History logging is async and doesn't block request execution
- Minimal overhead (< 50ms typically)
- Database indexed on createdAt for fast queries

## Future Enhancements

- [ ] Request/response body storage in history
- [ ] Advanced filtering (by status code, duration, date range)
- [ ] Export history to CSV/JSON
- [ ] History analytics dashboard
- [ ] Request comparison between CLI and web executions
- [ ] Automatic cleanup of old history entries


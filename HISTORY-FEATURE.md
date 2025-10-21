# 🕒 Shared Request History Feature

## Overview

The shared request history feature automatically tracks all API requests made through both the CLI tool and the web application. All requests are logged to a centralized database and displayed in the web app's History tab.

## ✨ Features

- **Automatic Tracking**: Every request is automatically logged without manual intervention
- **Dual Source Support**: Tracks requests from both CLI and web interface
- **Rich Metadata**: Stores method, URL, status code, response time, and errors
- **Real-time Updates**: History auto-refreshes every 5 seconds in the web app
- **Filtering**: Filter history by source (All/CLI/Web)
- **Error Tracking**: Failed requests are logged with error messages
- **Clear History**: Option to clear all history with one click

## 📊 What's Tracked

For each request, the following information is stored:

- **Method**: HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
- **URL**: The full request URL
- **Status Code**: HTTP response status code (200, 404, 500, etc.)
- **Source**: Where the request originated ("CLI" or "WEB")
- **Duration**: Response time in milliseconds
- **Timestamp**: When the request was made
- **Error**: Error message if the request failed

## 🔧 Setup

### 1. Database Migration

First, apply the database schema changes:

```bash
# Generate Prisma client with new schema
npm run db:generate

# Push schema changes to database
npm run db:push

# Or run migration (for production)
npm run db:migrate
```

### 2. CLI Configuration

For the CLI to send history to the backend, configure the backend URL:

Create a `.env` file in the `cli/` directory:

```bash
cd cli
touch .env  # or create manually on Windows
```

Add the following content:

```env
# Backend URL for request history tracking
BACKEND_URL=http://localhost:3000
```

**Note**: If you don't configure this, the CLI will default to `http://localhost:3000` and will silently fail if the backend is unavailable (without disrupting CLI operations).

### 3. Start the Web Application

```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`.

## 📱 Usage

### Web Application

1. Navigate to the web app
2. Make any API request using the Request Builder
3. Click the **History** tab in the sidebar (clock icon)
4. View all your requests with color-coded status indicators

**Features in History Tab:**
- **Filter buttons**: All, CLI, Web
- **Refresh button**: Manually refresh history
- **Clear button**: Delete all history
- **Auto-refresh**: Updates every 5 seconds
- **Status colors**: 
  - 🟢 Green: 2xx (Success)
  - 🔵 Blue: 3xx (Redirect)
  - 🟡 Yellow: 4xx (Client Error)
  - 🔴 Red: 5xx (Server Error)

### CLI Tool

The CLI automatically logs all requests to the backend. No special commands needed!

```bash
# All these commands will log to history automatically

# Single GET request
apicli get https://api.example.com/users

# POST request
apicli post https://api.example.com/users -d '{"name":"John"}'

# Run collection (logs all requests)
apicli run collection.json

# Run tests (logs all test requests)
apicli test test-collection.json
```

**CLI Behavior:**
- History logging is asynchronous and won't slow down your CLI
- If the backend is unavailable, the CLI continues normally
- Errors are silently caught to not disrupt your workflow

## 🎯 Example Workflow

1. **From CLI**: Run a test collection
   ```bash
   cd cli
   apicli test examples/test-collection.json
   ```

2. **From Web**: Open the web app at `http://localhost:3000`

3. **View History**: Click the History tab in the sidebar

4. **See Results**: All 6 test requests from the CLI appear with:
   - 🖥️ CLI badge
   - HTTP methods (GET, POST, etc.)
   - Status codes
   - Response times
   - Timestamps

5. **Make Web Request**: Use the Request Builder to make another request

6. **View Updated History**: The new web request appears with a 🌐 Web badge

## 🔌 API Endpoints

### GET /api/history

Fetch request history.

**Query Parameters:**
- `source` (optional): Filter by "CLI" or "WEB"
- `limit` (optional): Limit number of results (default: 100)

**Example:**
```bash
curl http://localhost:3000/api/history
curl http://localhost:3000/api/history?source=CLI
curl http://localhost:3000/api/history?source=WEB&limit=50
```

**Response:**
```json
[
  {
    "id": "clx123...",
    "method": "GET",
    "url": "https://jsonplaceholder.typicode.com/users/1",
    "statusCode": 200,
    "source": "CLI",
    "duration": 145,
    "error": null,
    "createdAt": "2025-10-21T12:34:56.789Z"
  }
]
```

### POST /api/history

Create a new history entry.

**Request Body:**
```json
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "statusCode": 200,
  "source": "CLI",
  "duration": 250,
  "error": null
}
```

**Required Fields:**
- `method`: HTTP method (string)
- `url`: Request URL (string)
- `source`: "CLI" or "WEB" (string)

**Optional Fields:**
- `statusCode`: HTTP status code (number)
- `duration`: Response time in ms (number)
- `error`: Error message (string)

### DELETE /api/history

Clear all request history.

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/history
```

## 🗂️ Database Schema

The `ApiHistory` model in Prisma:

```prisma
model ApiHistory {
  id         String   @id @default(cuid())
  method     String   // GET, POST, PUT, DELETE, etc.
  url        String
  statusCode Int?     // HTTP status code
  source     String   // "CLI" or "WEB"
  duration   Int?     // Response time in ms
  error      String?  // Error message if request failed
  createdAt  DateTime @default(now())

  @@map("api_history")
  @@index([createdAt])
  @@index([source])
}
```

## 🛠️ Technical Details

### Architecture

```
┌─────────────┐                    ┌──────────────┐
│   CLI Tool  │──── HTTP POST ───→ │              │
└─────────────┘                    │   Next.js    │
                                   │   Backend    │
┌─────────────┐                    │   (API)      │
│  Web App    │──── HTTP POST ───→ │              │
└─────────────┘                    └───────┬──────┘
                                           │
                                           ↓
                                   ┌──────────────┐
                                   │  PostgreSQL  │
                                   │   Database   │
                                   └──────────────┘
```

### Implementation Files

**Backend:**
- `prisma/schema.prisma` - Database schema with ApiHistory model
- `src/app/api/history/route.ts` - GET/POST/DELETE endpoints
- `src/app/api/request/send/route.ts` - Modified to log web requests

**Frontend:**
- `src/components/History.tsx` - History component with filtering
- `src/components/Sidebar.tsx` - Updated to include History tab

**CLI:**
- `cli/src/utils/history.ts` - History logging utilities
- `cli/src/commands/get.ts` - Updated with history logging
- `cli/src/commands/post.ts` - Updated with history logging
- `cli/src/commands/run.ts` - Updated with history logging
- `cli/src/commands/test.ts` - Updated with history logging

## 🚀 Optional Enhancements

Want to extend this feature? Here are some ideas:

### 1. WebSocket Real-time Updates
Replace polling with WebSocket for instant updates:
```typescript
// Install socket.io
npm install socket.io socket.io-client

// Emit event when new history is created
io.emit('history:new', historyEntry)
```

### 2. Request Details Modal
Show full request/response details:
- Request headers
- Request body
- Response body
- Response headers

### 3. Search Functionality
Add search by URL or status code:
```typescript
const filteredHistory = history.filter(h => 
  h.url.includes(searchQuery) || 
  h.statusCode?.toString().includes(searchQuery)
)
```

### 4. Export History
Download history as CSV or JSON:
```typescript
const exportHistory = () => {
  const csv = history.map(h => 
    `${h.method},${h.url},${h.statusCode},${h.duration},${h.createdAt}`
  ).join('\n')
  downloadFile(csv, 'history.csv')
}
```

### 5. Statistics Dashboard
Show analytics:
- Total requests today
- Average response time
- Success rate
- Most called endpoints

## 📝 Notes

- History is stored indefinitely (implement cleanup if needed)
- No authentication check on history endpoints (add if needed)
- Auto-refresh interval is 5 seconds (configurable in History.tsx)
- CLI history logging has 3-second timeout to avoid blocking

## 🐛 Troubleshooting

### CLI history not appearing?

1. Check backend URL in CLI's `.env` file
2. Ensure web app is running on the correct port
3. Check CLI output for any error messages (uncomment debug line in `history.ts`)

### Web history not appearing?

1. Check browser console for errors
2. Verify database migrations ran successfully
3. Check that Prisma client was regenerated

### Database errors?

```bash
# Regenerate Prisma client
npm run db:generate

# Reset database (⚠️ destroys data)
npx prisma db push --force-reset
```

## 📄 License

Part of the Postman Clone project - MIT License

---

**Made with ❤️ for API testing**


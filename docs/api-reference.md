---
layout: default
title: API Reference
---

# API Reference

Complete API reference for Reqbeam.

## Authentication

All API endpoints require authentication except for public endpoints.

### Authentication Methods

- **Web Interface**: NextAuth.js session-based authentication
- **CLI**: JWT token-based authentication
- **API**: Bearer token authentication

## Web API Endpoints

### Collections

- `GET /api/collections` - List collections
- `POST /api/collections` - Create collection
- `GET /api/collections/[id]` - Get collection
- `PUT /api/collections/[id]` - Update collection
- `DELETE /api/collections/[id]` - Delete collection

### Requests

- `GET /api/requests` - List requests
- `POST /api/requests` - Create request
- `GET /api/requests/[id]` - Get request
- `PUT /api/requests/[id]` - Update request
- `DELETE /api/requests/[id]` - Delete request

### Environments

- `GET /api/environments` - List environments
- `POST /api/environments` - Create environment
- `GET /api/environments/[id]` - Get environment
- `PUT /api/environments/[id]` - Update environment
- `DELETE /api/environments/[id]` - Delete environment

### Workspaces

- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/[id]` - Get workspace
- `PUT /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

### History

- `GET /api/history` - List request history
- `GET /api/history/[id]` - Get history entry
- `POST /api/history` - Create history entry

## Auth Server API

If using a separate authentication server, see the [Auth Server Documentation](auth-server) for endpoints.

### Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token
- `GET /health` - Health check

## CLI API

The CLI communicates with the web application's API endpoints. All CLI operations use the same API endpoints as the web interface.

## Rate Limiting

API rate limiting may be implemented in future versions.

## Error Responses

All API endpoints return standard HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Related Documentation

- [Auth Server](auth-server)
- [Authorization System](authorization)


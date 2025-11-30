---
layout: default
title: Web Interface Documentation
---

# Web Interface Documentation

Complete guide to using the Reqbeam web interface.

## Overview

The Reqbeam web interface provides a modern, intuitive way to test and manage your APIs. It features a dark theme, responsive design, and powerful organization tools.

## Main Features

### HTTP Request Builder

Create and send HTTP requests with full support for:
- All HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Query parameters with enable/disable toggle
- Custom headers
- Multiple request body types (JSON, form-data, x-www-form-urlencoded)
- URL encoding/decoding

### Authorization

Support for multiple authentication types:
- No Auth
- API Key (header or query parameter)
- Bearer Token
- Basic Authentication
- OAuth 2.0 with PKCE flow
- Google OAuth

See the [Authorization System](authorization) guide for details.

### Response Viewer

- Syntax-highlighted JSON responses
- Response formatting and pretty-print
- HTTP status code indicators
- Response time tracking
- Response size display
- Copy to clipboard functionality

### Collections

Organize your requests into collections for better management:
- Create collections
- Add requests to collections
- Organize by project or feature
- Quick access to saved requests

### Environments

Manage multiple environments with variables:
- Create environments (dev, staging, prod)
- Define environment variables
- Use `{{VARIABLE}}` syntax in requests
- Switch between environments easily

### Workspaces

Multi-workspace support for team collaboration:
- Create multiple workspaces
- Organize projects by workspace
- Team collaboration features
- Workspace-specific data isolation

See the [Workspace Feature](workspace-feature) documentation for details.

### Request History

Track all your API requests:
- View request history with timestamps
- Replay previous requests
- Filter and search history
- View response data

### Mock Servers

Create mock endpoints for testing:
- Define mock responses
- Custom response configuration
- Multiple response scenarios

## User Interface

### Dark Theme

The interface features a modern dark theme optimized for extended use.

### Responsive Design

Works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

### Keyboard Shortcuts

Power user features with keyboard shortcuts. See the [Keyboard Shortcuts](keyboard-shortcuts) guide.

### Tab Management

Work on multiple requests simultaneously with tab support.

## Getting Started

1. **Sign Up/Login** - Create an account or sign in
2. **Create Workspace** - Set up your first workspace
3. **Create Request** - Start testing your APIs
4. **Save to Collection** - Organize your requests
5. **Set Up Environments** - Configure environment variables

## Related Documentation

- [Workspace Feature](workspace-feature)
- [Authorization System](authorization)
- [Keyboard Shortcuts](keyboard-shortcuts)
- [Workspace Quick Start](workspace-quick-start)


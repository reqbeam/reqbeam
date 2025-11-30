---
layout: default
title: CLI Tool Documentation
---

# CLI Tool Documentation

Complete guide to using the Reqbeam command-line interface.

## Overview

The Reqbeam CLI provides a powerful command-line interface for automating API testing and integrating with CI/CD pipelines. It synchronizes with the web interface in real-time.

## Installation

See the [Installation Guide](installation) for CLI installation instructions.

## Authentication

All CLI commands require authentication. See the [CLI Authentication](cli-docs/auth) guide for details.

```bash
# Login
rb auth login

# Check status
rb auth status

# Logout
rb auth logout
```

## Workspace Management

```bash
# List workspaces
rb workspace list

# Create workspace
rb workspace create <name>

# Switch workspace
rb workspace switch <name>

# Delete workspace
rb workspace delete <name>
```

## Environment Management

```bash
# List environments
rb env list

# Add environment
rb env add <name> -i

# Switch environment
rb env switch <name>

# Remove environment
rb env remove <name>
```

See the [CLI Environment Management](cli-docs/environment) guide for details.

## Request Management

```bash
# Create request
rb request create -n "Get Users" -m GET -u "https://api.example.com/users"

# List requests
rb request list

# Update request
rb request update "Get Users" -u "https://api.example.com/v2/users"

# Delete request
rb request delete "Get Users"
```

## Collection Management

```bash
# Create collection
rb collection create "User API"

# Add request to collection
rb collection add "User API" "Get Users"

# List collections
rb collection list

# Export collection
rb collection export "User API" ./export.json
```

## Execution

```bash
# Run single request
rb run request "Get Users"

# Run collection
rb run collection "User API"

# Run in parallel
rb run collection "User API" --parallel

# Run with specific environment
rb run collection "User API" -e production
```

## History

```bash
# List execution history
rb run history-list

# Replay from history
rb run history <history_id>
```

See the [CLI History](cli-docs/history) guide for details.

## Testing

```bash
# Run tests
rb test run

# Generate test files
rb test generate

# Schedule tests
rb test schedule "0 * * * *" --name "Hourly Tests"
```

## Logging

```bash
# List logs
rb logs list

# View log details
rb logs view <log_id>

# Export logs
rb logs export ./logs.json --format json
```

## Synchronization

The CLI automatically synchronizes with the web interface. See the [CLI Sync](cli-docs/sync) guide for details.

## Examples

See the [CLI Examples](cli-docs/examples) guide for real-world usage examples.

## Command Reference

For complete command reference, see [CLI Commands Verification](cli-docs/commands-verification).

## Related Documentation

- [CLI Authentication](cli-docs/auth)
- [CLI Environment Management](cli-docs/environment)
- [CLI Examples](cli-docs/examples)
- [CLI History](cli-docs/history)
- [CLI Sync](cli-docs/sync)


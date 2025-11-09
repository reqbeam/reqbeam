# Postmind CLI Environment Management

This guide explains how to manage environment variables in Postmind CLI, allowing you to use dynamic values in your API requests across different environments (Development, Staging, Production).

## 🌍 Overview

Environments in Postmind CLI allow you to:
- Store reusable variables (base URLs, API keys, tokens, etc.)
- Switch between different environments quickly
- Use variables in URLs, headers, and request bodies with `{{variableName}}` syntax
- Keep environment-specific configurations separate
- Sync environments with the web UI in real-time

## Prerequisites

1. **Authentication**: You must be logged in to use environment commands
   ```bash
   postmind auth login
   ```

2. **Workspace**: Environments are scoped to workspaces. Ensure you have an active workspace.

## Environment Commands

### 1. List Environments

View all available environments:

```bash
postmind env list
# or
pm env list
```

**Output:**
```
Environments:
┌─────────────────┬─────────┬───────────┐
│ Name            │ Active  │ Variables │
├─────────────────┼─────────┼───────────┤
│ Development     │ ✓       │ 5         │
│ Staging         │         │ 4         │
│ Production      │         │ 6         │
└─────────────────┴─────────┴───────────┘
```

### 2. Add Environment

Create a new environment with optional variables:

```bash
# Create environment without variables
postmind env add <name>

# Create environment with interactive variable input
postmind env add <name> --interactive
# or
postmind env add <name> -i
```

**Example:**
```bash
# Create Development environment
pm env add Development -i

# Interactive prompt will ask:
# Enter variables as key=value pairs (comma-separated):
# baseUrl=https://dev.api.com,token=dev_token_123,apiKey=dev_key_456
```

**Output:**
```
✓ Environment 'Development' added successfully
  ID: clx123abc456
  Variables: 3
```

### 3. Switch Environment

Activate a different environment (only one can be active per workspace):

```bash
postmind env switch <name>
# or
pm env switch <name>
```

**Example:**
```bash
pm env switch Production
```

**Output:**
```
✓ Switched to environment 'Production'
```

**Note:** Switching environments automatically deactivates the previously active environment in the same workspace.

### 4. Update Environment

Add, update, or remove variables from an environment:

```bash
postmind env update <name> [options]
# or
pm env update <name> [options]
```

**Options:**
- `-a, --add <variables>` - Add/update variables as key=value pairs (comma-separated)
- `-r, --remove <keys>` - Remove variables by keys (comma-separated)

**Examples:**

```bash
# Add new variables
pm env update Development -a "newKey=newValue,anotherKey=anotherValue"

# Update existing variables
pm env update Development -a "baseUrl=https://new.dev.api.com,token=new_token"

# Remove variables
pm env update Development -r "oldKey,deprecatedKey"

# Add and remove in one command
pm env update Development -a "newVar=value" -r "oldVar"
```

**Output:**
```
✓ Environment 'Development' updated successfully
  Variables: 5
```

### 5. Remove Environment

Delete an environment:

```bash
postmind env remove <name>
# or
pm env remove <name>

# Force removal without confirmation
postmind env remove <name> --force
# or
postmind env remove <name> -f
```

**Example:**
```bash
pm env remove OldEnvironment
```

**Interactive confirmation:**
```
? Are you sure you want to remove environment 'OldEnvironment'? (y/N)
```

**Output:**
```
✓ Environment 'OldEnvironment' removed successfully
```

## Variable Substitution

### Using Variables in Requests

Environment variables are automatically substituted when running requests. Use the `{{variableName}}` syntax:

#### URL Variables

```bash
# Create request with variable in URL
postmind request create -n "Get Users" -m GET -u "{{baseUrl}}/api/users"

# When baseUrl = "https://api.example.com"
# Actual URL: https://api.example.com/api/users
```

#### Header Variables

Variables can be used in request headers:

```bash
# Create request with header variable
postmind request create -n "Authenticated Request" \
  -m GET \
  -u "{{baseUrl}}/api/protected" \
  -H "Authorization: Bearer {{token}}"

# When token = "abc123xyz"
# Actual header: Authorization: Bearer abc123xyz
```

#### Body Variables

Variables work in request bodies (both JSON and plain text):

```bash
# Create POST request with body variables
postmind request create -n "Create User" \
  -m POST \
  -u "{{baseUrl}}/api/users" \
  -b '{"userId": "{{userId}}", "apiKey": "{{apiKey}}"}'

# When userId = "123" and apiKey = "key456"
# Actual body: {"userId": "123", "apiKey": "key456"}
```

### Variable Syntax

- **Format**: `{{variableName}}`
- **Whitespace**: Spaces around variable names are trimmed: `{{ variableName }}` = `{{variableName}}`
- **Case-sensitive**: Variable names are case-sensitive
- **Unknown variables**: If a variable doesn't exist, it remains as `{{variableName}}` in the request

### Nested Variable Resolution

Variables are resolved recursively in JSON objects:

```json
{
  "user": {
    "id": "{{userId}}",
    "endpoint": "{{baseUrl}}/users"
  },
  "metadata": {
    "token": "{{token}}"
  }
}
```

## Common Workflows

### Workflow 1: Multi-Environment Setup

Set up separate environments for Development, Staging, and Production:

```bash
# 1. Create Development environment
pm env add Development -i
# Enter: baseUrl=https://dev.api.com,token=dev_token_123

# 2. Create Staging environment
pm env add Staging -i
# Enter: baseUrl=https://staging.api.com,token=staging_token_456

# 3. Create Production environment
pm env add Production -i
# Enter: baseUrl=https://api.com,token=prod_token_789

# 4. List all environments
pm env list

# 5. Switch to Development
pm env switch Development

# 6. Run requests (they'll use Development variables)
pm run request "Get Users"

# 7. Switch to Production
pm env switch Production

# 8. Run same request (now uses Production variables)
pm run request "Get Users"
```

### Workflow 2: Updating Environment Variables

Update variables as your configuration changes:

```bash
# 1. List current environments
pm env list

# 2. View current variables (in web UI or check active environment)
pm env switch Development

# 3. Update base URL
pm env update Development -a "baseUrl=https://new-dev.api.com"

# 4. Add new variable
pm env update Development -a "apiVersion=v2"

# 5. Remove deprecated variable
pm env update Development -r "oldApiKey"
```

### Workflow 3: Running Requests with Environment Variables

```bash
# 1. Ensure you have an active environment
pm env switch Development

# 2. Create request using variables
pm request create -n "Get User Profile" \
  -m GET \
  -u "{{baseUrl}}/api/users/{{userId}}" \
  -H "X-API-Key: {{apiKey}}"

# 3. Run the request (variables will be substituted automatically)
pm run request "Get User Profile"
```

## Integration with Web UI

Environments created and managed in the CLI are **automatically synced** with the web UI:

- ✅ Create environment in CLI → Appears in Web UI immediately
- ✅ Update variables in CLI → Changes reflect in Web UI
- ✅ Switch environment in CLI → Active state syncs to Web UI
- ✅ Delete environment in CLI → Removed from Web UI

**Note:** The active environment is per-workspace. Each workspace maintains its own active environment.

## Best Practices

### 1. Naming Conventions

Use descriptive environment names:
```bash
✅ Good:
pm env add Development
pm env add Staging
pm env add Production
pm env add Local
pm env add Testing

❌ Avoid:
pm env add env1
pm env add test
pm env add prod1
```

### 2. Variable Naming

Use clear, consistent variable names:
```bash
✅ Good:
baseUrl
apiKey
authToken
userId
apiVersion

❌ Avoid:
url
key
token
id
v
```

### 3. Sensitive Data

⚠️ **Security Considerations:**
- Don't commit environment variables with secrets to version control
- Use secure storage for production tokens
- Rotate API keys regularly
- Consider using separate environments for secrets management

### 4. Common Variables

Standardize common variable names across environments:
```bash
baseUrl        # Base API URL
token          # Authentication token
apiKey         # API key
userId         # User ID
workspaceId    # Workspace ID
```

### 5. Environment Organization

Keep environments organized:
- One environment per deployment stage
- Consistent variable names across environments
- Document variable purposes
- Keep production credentials secure

## Examples

### Example 1: REST API Testing

```bash
# Setup
pm env add API-Dev -i
# Variables: baseUrl=https://api-dev.example.com,apiKey=dev_key_123

# Create requests
pm request create -n "Get Posts" -m GET -u "{{baseUrl}}/posts"
pm request create -n "Create Post" -m POST -u "{{baseUrl}}/posts" \
  -b '{"title": "Test", "apiKey": "{{apiKey}}"}'

# Switch and test
pm env switch API-Dev
pm run request "Get Posts"
```

### Example 2: Authentication Flow

```bash
# Setup environment with auth variables
pm env add Auth-Dev -i
# Variables: authUrl=https://auth.dev.com,token=test_token,clientId=client_123

# Create auth request
pm request create -n "Get Token" \
  -m POST \
  -u "{{authUrl}}/oauth/token" \
  -b '{"client_id": "{{clientId}}", "grant_type": "client_credentials"}'

# Use token in subsequent requests
pm request create -n "Get Profile" \
  -m GET \
  -u "{{baseUrl}}/profile" \
  -H "Authorization: Bearer {{token}}"
```

### Example 3: Multi-Service API

```bash
# Environment with multiple service URLs
pm env add Microservices -i
# Variables: userService=https://users.api.com,orderService=https://orders.api.com,paymentService=https://payments.api.com

# Create service-specific requests
pm request create -n "Get Users" -m GET -u "{{userService}}/users"
pm request create -n "Get Orders" -m GET -u "{{orderService}}/orders"
pm request create -n "Process Payment" -m POST -u "{{paymentService}}/payments"
```

## Troubleshooting

### "Environment not found" Error

If you see:
```
Environment 'Development' not found
```

**Solutions:**
1. Check environment name spelling: `pm env list`
2. Ensure you're authenticated: `pm auth status`
3. Verify workspace: Environments are workspace-scoped

### Variables Not Substituting

If variables remain as `{{variableName}}` in requests:

**Solutions:**
1. **Check active environment:**
   ```bash
   pm env list  # Look for ✓ mark
   ```

2. **Switch to correct environment:**
   ```bash
   pm env switch <environment-name>
   ```

3. **Verify variable name:**
   - Variable names are case-sensitive
   - Use exact spelling: `{{baseUrl}}` not `{{base_url}}`

4. **Check variable exists:**
   - View environment in web UI or update to see variables

### "Failed to activate environment" Error

If switching fails:

**Solutions:**
1. Verify environment exists: `pm env list`
2. Check authentication: `pm auth status`
3. Ensure workspace is active
4. Check network connection to web UI

### Variables in Wrong Environment

If requests use wrong environment variables:

**Solutions:**
1. **Check active environment:**
   ```bash
   pm env list
   ```

2. **Switch to correct environment:**
   ```bash
   pm env switch Production  # Example
   ```

3. **Verify workspace:**
   - Each workspace has its own active environment
   - Switch workspace if needed

### "Failed to create environment" Error

If environment creation fails:

**Solutions:**
1. Check authentication: `pm auth status`
2. Verify environment name is unique
3. Check network connection
4. Ensure workspace is available

## Environment vs Request-Specific Values

**When to use Environments:**
- ✅ Values that change per deployment (dev/staging/prod)
- ✅ Reusable across multiple requests
- ✅ Values that should be kept consistent
- ✅ API keys, tokens, base URLs

**When NOT to use Environments:**
- ❌ Request-specific values (use request body/params directly)
- ❌ One-time test values
- ❌ Values that change frequently

## Advanced Usage

### Dynamic Variable Updates

Update environment variables programmatically:

```bash
# Update multiple variables at once
pm env update Production \
  -a "baseUrl=https://api.newdomain.com,apiKey=new_key_456,version=v2" \
  -r "oldApiKey,deprecatedToken"
```

### Environment Switching Scripts

Create scripts for quick environment switching:

```bash
#!/bin/bash
# switch-to-dev.sh
pm env switch Development
pm run collection "All Tests"
```

### CI/CD Integration

Use environments in CI/CD pipelines:

```bash
# In CI script
pm env switch Production
pm run collection "Smoke Tests"
```

## API Endpoints

The CLI uses these web UI endpoints for environment management:

### GET /api/environments?workspaceId={id}
- **Purpose**: List environments for workspace
- **Response**: Array of environment objects

### POST /api/environments
- **Purpose**: Create new environment
- **Body**: `{ name, variables, workspaceId }`
- **Response**: Created environment

### GET /api/environments/{id}
- **Purpose**: Get specific environment
- **Response**: Environment object

### PUT /api/environments/{id}
- **Purpose**: Update environment
- **Body**: `{ name?, variables? }`
- **Response**: Updated environment

### DELETE /api/environments/{id}
- **Purpose**: Delete environment
- **Response**: Success confirmation

### POST /api/environments/{id}/activate
- **Purpose**: Activate environment
- **Response**: Activated environment

## Future Features

Planned enhancements to environment management:

- [ ] Environment import/export (JSON format)
- [ ] Environment templates
- [ ] Variable encryption for sensitive data
- [ ] Environment sharing between team members
- [ ] Variable validation and type checking
- [ ] Environment-specific request overrides
- [ ] Environment history and rollback

## Related Documentation

- [AUTH.md](./AUTH.md) - Authentication guide
- [EXAMPLES.md](./EXAMPLES.md) - Usage examples
- [SYNC.md](./SYNC.md) - Web UI synchronization
- [README.md](../README.md) - Main CLI documentation

## Support

If you encounter issues with environments:

1. Check the troubleshooting section above
2. Verify authentication: `pm auth status`
3. List environments: `pm env list`
4. Check web UI for environment state
5. Review CLI logs for detailed error messages

---

**Tip:** Use the shorter `pm` alias instead of `postmind` for faster commands!

```bash
pm env list
pm env switch Development
pm env update Production -a "key=value"
```


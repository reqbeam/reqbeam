# Authorization System

Postmind supports comprehensive authorization features similar to Postman, allowing you to authenticate API requests with multiple auth types.

## Supported Auth Types

### 1. No Auth
Send requests without any authentication headers.

### 2. API Key
Authenticate using API keys that can be sent via headers or query parameters.

**Configuration:**
- **Key**: The API key name
- **Value**: The API key value
- **Add to**: Choose between "Header" or "Query Parameters"
- **Header Name** (if header): Custom header name (default: `X-API-Key`)

**Example:**
```json
{
  "type": "api-key",
  "key": "api_key",
  "value": "your-api-key-here",
  "addTo": "header",
  "headerKey": "X-API-Key"
}
```

### 3. Bearer Token
Use Bearer token authentication (commonly used with OAuth 2.0 and JWT).

**Configuration:**
- **Token**: Your bearer token

**Example:**
```json
{
  "type": "bearer-token",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

This will automatically inject: `Authorization: Bearer <token>`

### 4. Basic Auth
Authenticate using HTTP Basic Authentication (username/password).

**Configuration:**
- **Username**: Your username
- **Password**: Your password

**Example:**
```json
{
  "type": "basic-auth",
  "username": "user@example.com",
  "password": "your-password"
}
```

This will automatically encode credentials in Base64 and inject: `Authorization: Basic <encoded-credentials>`

### 5. OAuth 2.0 (Manual)
Manually input OAuth 2.0 access tokens.

**Configuration:**
- **Access Token**: Your OAuth 2.0 access token
- **Token Type**: Usually "Bearer" (default)

**Example:**
```json
{
  "type": "oauth2",
  "accessToken": "access_token_here",
  "tokenType": "Bearer"
}
```

This will inject: `Authorization: Bearer <access-token>` (or custom token type)

## Web UI Usage

### Setting Authorization for a Request

1. **Open a request** in the request builder
2. Click the **"Authorization"** tab (next to Params, Headers, Body)
3. Select your auth type from the dropdown
4. Fill in the required fields based on the selected auth type
5. Click **"Send"** - authorization will be automatically injected

### Saving Authorization with Requests

Authorization configuration is automatically saved with the request when you:
- Create a new request
- Update an existing request

The auth configuration is stored securely (encoded) in the database.

## CLI Usage

> **Note**: Request authorization is currently only available in the Web UI. CLI support for request authorization may be added in future versions.

## Security Features

### Data Protection

- **Local Storage**: Auth tokens and passwords are encoded before storage (not true encryption, but obfuscated)
- **Database Storage**: Auth configs are stored as JSON strings in the database
- **No Logging**: Sensitive auth data is never logged or exposed in UI
- **Secure Headers**: Auth headers are only injected at request execution time

### Best Practices

1. **Never commit auth tokens** to version control
2. **Use environment variables** for sensitive credentials when possible
3. **Rotate tokens regularly** for production APIs
4. **Use OAuth 2.0** with proper token refresh mechanisms when available

## Storage Format

Auth configurations are stored in the following format:

```typescript
interface AuthConfig {
  type: 'no-auth' | 'api-key' | 'bearer-token' | 'basic-auth' | 'oauth2'
  // ... type-specific fields
}
```

### Example Stored Config

```json
{
  "type": "bearer-token",
  "token": "pm_<encoded-token>"
}
```

## Integration with Collections

Authorization can be set per-request. Each request in a collection can have its own auth configuration, allowing you to:

- Mix different auth types within a collection
- Test APIs with different authentication methods
- Organize requests by auth requirements

## Environment Variables

While not directly part of the auth system, you can use environment variables in auth values:

```
Token: {{api_token}}
```

This allows you to centralize credential management using environments.

## Troubleshooting

### Auth Not Applied

1. Check that the Authorization tab has a valid auth type selected
2. Verify all required fields are filled
3. Ensure the request is saved before executing

### Token Expired

For OAuth 2.0 and Bearer tokens:
- Update the token in the Authorization tab
- Re-save the request

### Basic Auth Not Working

1. Verify username and password are correct
2. Check that the API expects Basic Auth (not Digest or other variants)
3. Some APIs may require additional headers

## API Examples

### Example 1: API Key in Header

```bash
curl -H "X-API-Key: your-key" https://api.example.com/data
```

Equivalent Postmind config:
```json
{
  "type": "api-key",
  "key": "X-API-Key",
  "value": "your-key",
  "addTo": "header",
  "headerKey": "X-API-Key"
}
```

### Example 2: Bearer Token

```bash
curl -H "Authorization: Bearer token123" https://api.example.com/user
```

Equivalent Postmind config:
```json
{
  "type": "bearer-token",
  "token": "token123"
}
```

### Example 3: Basic Auth

```bash
curl -u username:password https://api.example.com/protected
```

Equivalent Postmind config:
```json
{
  "type": "basic-auth",
  "username": "username",
  "password": "password"
}
```

## Future Enhancements

- [ ] OAuth 2.0 automatic token refresh
- [ ] AWS Signature authentication
- [ ] Digest authentication
- [ ] JWT token generation
- [ ] Auth profiles for reuse across requests
- [ ] Import/export auth from Postman collections


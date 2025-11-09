# Postmind CLI Authentication

This guide explains how to authenticate the Postmind CLI with the web UI.

## ⚠️ Authentication Required

**All Postmind CLI commands now require authentication.** You must log in before using any CLI functionality except for:

- `postmind auth login` - Login command
- `postmind auth logout` - Logout command  
- `postmind auth status` - Check authentication status
- `postmind --help` - Help command
- `postmind --version` - Version command

## Overview

The Postmind CLI can now authenticate with the web UI, allowing you to:
- Sync your CLI projects with the web interface
- Access your web UI requests and collections from the CLI
- Keep your work synchronized across platforms

## Prerequisites

1. **Web UI Running**
   - Ensure the Postmind web UI is running (http://localhost:3000 by default)
   - You need a valid account on the web UI

2. **CLI Installed**
   - Postmind CLI must be built and ready to use

## Authentication Commands

### 1. Login

Log in to connect the CLI with your web UI account:

```bash
# Interactive login (recommended)
postmind auth login

# Login with flags
postmind auth login -e user@example.com -p password -u http://localhost:3000
```

**Options:**
- `-e, --email <email>` - Your email address
- `-p, --password <password>` - Your password
- `-u, --url <url>` - API URL (default: http://localhost:3000)

**Example:**
```bash
postmind auth login -e john@example.com -p mypassword -u http://localhost:3000
```

### 2. Check Status

Check your current authentication status:

```bash
postmind auth status
```

This shows:
- Your email and name
- API URL
- Token expiration date
- Token validation status

### 3. Logout

Log out from the CLI:

```bash
postmind auth logout
```

This clears your saved credentials.

## How It Works

### Authentication Flow

1. **Login Process:**
   - CLI sends credentials to the web UI API
   - Web UI validates credentials against the database
   - A token is returned and stored locally
   - Token is valid for 7 days

2. **Token Storage:**
   - Credentials are stored in `~/.postmind/auth.json`
   - Never share this file or commit it to version control

3. **Token Validation:**
   - Tokens are validated on each API request
   - Expired tokens trigger automatic re-authentication prompts

### Security Features

- **Secure Token Storage**: Credentials stored locally in user's home directory
- **Token Expiration**: Tokens expire after 7 days
- **Password Hashing**: Passwords are hashed using bcryptjs
- **HTTPS Support**: Can connect to web UI over HTTPS

## Usage Examples

### Basic Workflow

```bash
# 1. Login to web UI
postmind auth login -e myemail@example.com -p mypassword

# 2. Check status
postmind auth status

# 3. Create a local project
postmind init my-api

# 4. Your work is now connected to the web UI
# (Future: Sync projects, requests, and collections)

# 5. When done, logout
postmind auth logout
```

### Multiple Environments

```bash
# Connect to development server
postmind auth login -e dev@example.com -p password -u http://dev-api.example.com

# Connect to production server
postmind auth login -e prod@example.com -p password -u https://api.example.com

# Check which server you're connected to
postmind auth status
```

## Troubleshooting

### "Not authenticated" Error

If you see this error when running commands:

```
Not authenticated. Please run "postmind login" first.
```

**Solution:**
1. Run `postmind auth login` to authenticate
2. Verify your credentials are correct
3. Check that the web UI is running

### "Invalid credentials" Error

If login fails with invalid credentials:

```
Login failed: Invalid email or password
```

**Solution:**
1. Verify you're using the correct email and password
2. Check that the web UI is accessible
3. Ensure your account exists in the web UI

### "Connection refused" Error

If you can't connect to the web UI:

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
1. Start the web UI server: `npm run dev` (in the main project)
2. Verify the web UI is running on the expected port
3. Check your API URL: `postmind auth status`

### Token Expired

If your token has expired:

```
Authentication token expired. Please log in again.
```

**Solution:**
1. Run `postmind auth login` to get a new token
2. Your previous session data will be preserved

## API Endpoints

The authentication uses these web UI endpoints:

### POST /api/auth/login
- **Purpose**: User login
- **Body**: `{ email, password }`
- **Response**: `{ token, user, expiresAt }`

### GET /api/auth/token
- **Purpose**: Token validation
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ user }`

## Future Features

Planned enhancements to the authentication system:

- [ ] Project synchronization between CLI and web UI
- [ ] Request and collection sync
- [ ] Team collaboration features
- [ ] OAuth integration with Google, GitHub, etc.
- [ ] Token refresh mechanism
- [ ] SSH key authentication support

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit auth.json**: The auth file contains sensitive tokens
2. **Use strong passwords**: Your web UI password should be secure
3. **HTTPS in production**: Always use HTTPS for API URLs in production
4. **Token expiration**: Tokens expire after 7 days for security
5. **Logout when done**: Always logout when using shared computers

## Support

If you encounter issues with authentication:

1. Check the troubleshooting section above
2. Run `postmind auth status` to diagnose issues
3. Verify the web UI is running and accessible
4. Check the CLI logs for detailed error messages


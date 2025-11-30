---
layout: default
title: Quick Start Guide
---

# Quick Start Guide

Get up and running with Reqbeam in 5 minutes.

## Step 1: Installation

If you haven't installed Reqbeam yet, follow the [Installation Guide](installation).

## Step 2: Start the Application

```bash
npm run dev
```

The application will start on http://localhost:3000

## Step 3: Create an Account

1. Open http://localhost:3000 in your browser
2. Click "Sign Up" or "Sign In"
3. Create an account with your email and password
4. Or sign in with Google OAuth (if configured)

## Step 4: Create a Workspace

1. After logging in, you'll be prompted to create a workspace
2. Enter a workspace name (e.g., "My API Project")
3. Optionally add a description
4. Click "Create Workspace"

## Step 5: Create Your First Request

1. Click the "New Request" button
2. Select HTTP method (e.g., GET)
3. Enter an API URL (e.g., `https://api.github.com/users/octocat`)
4. Click "Send"
5. View the response in the response viewer

## Step 6: Save to Collection

1. After sending a request, click "Save"
2. Choose or create a collection
3. Give your request a name
4. Click "Save"

## Using Environment Variables

1. Go to Environments section
2. Click "Add Environment"
3. Enter environment name (e.g., "Development")
4. Add variables (e.g., `API_URL=https://api.example.com`)
5. Use variables in requests: `{{API_URL}}/users`

## Using the CLI

1. Install CLI (see [Installation Guide](installation))
2. Authenticate: `rb auth login`
3. Create a workspace: `rb workspace create my-project`
4. Add environment: `rb env add development -i`
5. Create request: `rb request create -n "Get Users" -m GET -u "{{API_URL}}/users"`
6. Run request: `rb run request "Get Users"`

## Next Steps

- Read the [Workspace Feature Documentation](workspace-feature)
- Learn about [Authorization System](authorization)
- Explore [CLI Documentation](cli-docs/auth)
- Check out [Keyboard Shortcuts](keyboard-shortcuts)


# API Nexus CLI - Usage Examples

## Basic Commands

### 1. Simple GET Request

```bash
apicli get https://api.github.com/users/octocat
```

**Output:**
```
🚀 Making GET request...

Response:
────────────────────────────────────────────────────────────
Status: 200 OK
Time: 245ms

Body:
{
  "login": "octocat",
  "id": 1,
  "name": "The Octocat",
  ...
}
────────────────────────────────────────────────────────────
```

### 2. GET with Headers

```bash
apicli get https://api.example.com/protected -H "Authorization: Bearer token123" -H "X-Custom: value"
```

### 3. GET with Verbose Output

```bash
apicli get https://api.example.com/users -v
```

Shows response headers along with body.

### 4. POST Request

In PowerShell:
```powershell
apicli post https://jsonplaceholder.typicode.com/posts -d '{"title":"Test","body":"Content","userId":1}'
```

In Bash/Linux:
```bash
apicli post https://jsonplaceholder.typicode.com/posts -d '{"title":"Test","body":"Content","userId":1}'
```

## Collection Examples

### Simple Collection

**my-api-tests.json:**
```json
{
  "name": "My API Tests",
  "description": "Testing my REST API",
  "requests": [
    {
      "name": "Health Check",
      "method": "GET",
      "url": "https://api.example.com/health",
      "expect": {
        "status": 200,
        "contains": "ok",
        "responseTime": 500
      }
    },
    {
      "name": "Get Users List",
      "method": "GET",
      "url": "https://api.example.com/users",
      "expect": {
        "status": 200,
        "contains": ["id", "email"],
        "responseTime": 1000
      }
    },
    {
      "name": "Create User",
      "method": "POST",
      "url": "https://api.example.com/users",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "expect": {
        "statusRange": [200, 201],
        "contains": "John Doe"
      }
    }
  ]
}
```

**Run it:**
```bash
apicli test my-api-tests.json
```

### Collection with Environment Variables

**api-tests.json:**
```json
{
  "name": "E-Commerce API Tests",
  "requests": [
    {
      "name": "List Products",
      "method": "GET",
      "url": "{{BASE_URL}}/products",
      "headers": {
        "Authorization": "Bearer {{API_KEY}}"
      },
      "expect": {
        "status": 200,
        "contains": "products"
      }
    },
    {
      "name": "Get Product Details",
      "method": "GET",
      "url": "{{BASE_URL}}/products/{{PRODUCT_ID}}",
      "headers": {
        "Authorization": "Bearer {{API_KEY}}"
      },
      "expect": {
        "status": 200,
        "jsonPath": {
          "id": "{{PRODUCT_ID}}",
          "available": true
        }
      }
    },
    {
      "name": "Create Order",
      "method": "POST",
      "url": "{{BASE_URL}}/orders",
      "headers": {
        "Authorization": "Bearer {{API_KEY}}",
        "Content-Type": "application/json"
      },
      "body": {
        "productId": "{{PRODUCT_ID}}",
        "quantity": 2,
        "userId": "{{USER_ID}}"
      },
      "expect": {
        "statusRange": [200, 201],
        "contains": "order"
      }
    }
  ]
}
```

**.env:**
```env
BASE_URL=https://api.mystore.com
API_KEY=sk_test_123456789
PRODUCT_ID=prod_abc123
USER_ID=user_xyz789
```

**Run with environment:**
```bash
apicli test api-tests.json -e .env
```

### YAML Collection

**api-tests.yaml:**
```yaml
name: User Management API
description: Test user CRUD operations
requests:
  - name: Create User
    method: POST
    url: https://api.example.com/users
    headers:
      Content-Type: application/json
    body:
      name: Alice Smith
      email: alice@example.com
      role: admin
    expect:
      statusRange: [200, 201]
      contains: alice@example.com

  - name: Get User
    method: GET
    url: https://api.example.com/users/1
    expect:
      status: 200
      jsonPath:
        id: 1
        active: true

  - name: Update User
    method: PUT
    url: https://api.example.com/users/1
    headers:
      Content-Type: application/json
    body:
      name: Alice Johnson
      email: alice.johnson@example.com
    expect:
      status: 200
      contains: Johnson

  - name: Delete User
    method: DELETE
    url: https://api.example.com/users/1
    expect:
      statusRange: [200, 204]
```

**Run YAML collection:**
```bash
apicli test api-tests.yaml
```

## Advanced Assertions

### Comprehensive Assertions Example

```json
{
  "name": "Advanced Assertions Test",
  "requests": [
    {
      "name": "Complex API Test",
      "method": "GET",
      "url": "https://api.example.com/data",
      "expect": {
        "status": 200,
        "statusRange": [200, 299],
        "contains": ["success", "data"],
        "notContains": ["error", "failed"],
        "headers": {
          "content-type": "application/json",
          "x-rate-limit-remaining": "100"
        },
        "jsonPath": {
          "status": "success",
          "data.user.name": "John",
          "data.items[0].id": 1,
          "data.items[0].active": true,
          "metadata.count": 10
        },
        "responseTime": 1500
      }
    }
  ]
}
```

## HTML Report Generation

### Generate Report

```bash
apicli test my-tests.json -r test-results.html
```

### Generate Report with Environment

```bash
apicli test my-tests.json -e .env -r report.html
```

The HTML report includes:
- Summary statistics (passed/failed/total)
- Color-coded test results
- Detailed assertion results
- Response times
- Error messages with stack traces
- Beautiful, responsive design

## Interactive Mode Examples

### Start Interactive Mode

```bash
apicli interactive
```

or

```bash
apicli i
```

### Interactive Mode Flow

```
? What would you like to do?
  🚀 Make a Request
  📁 Create Collection
  🧪 Run Tests
  🚪 Exit

[Select "Make a Request"]

? Select HTTP method: POST
? Enter URL: https://jsonplaceholder.typicode.com/posts
? Enter headers (JSON format, optional): {"Content-Type":"application/json"}
? Enter request body (JSON format, optional): {"title":"Test","body":"Hello"}
? Save this request to a collection? Yes
? Request name: Create Test Post
? Collection file (will be created if not exists): my-collection.json

🚀 Making request...

Response:
────────────────────────────────────────────────────────────
Status: 201 Created
Time: 456ms
...
```

## Environment File Formats

### .env Format

```env
# API Configuration
BASE_URL=https://api.example.com
API_KEY=your-api-key-here
API_SECRET=your-secret-here

# User IDs
USER_ID=12345
ADMIN_ID=67890

# Feature Flags
DEBUG_MODE=true
TIMEOUT=5000
```

### JSON Environment Format

```json
{
  "BASE_URL": "https://api.example.com",
  "API_KEY": "your-api-key-here",
  "API_SECRET": "your-secret-here",
  "USER_ID": "12345",
  "ADMIN_ID": "67890",
  "DEBUG_MODE": "true",
  "TIMEOUT": "5000"
}
```

## Real-World Scenarios

### Scenario 1: Testing a REST API

```json
{
  "name": "Blog API Tests",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "https://api.blog.com/auth/login",
      "body": {
        "email": "{{USER_EMAIL}}",
        "password": "{{USER_PASSWORD}}"
      },
      "expect": {
        "status": 200,
        "contains": "token"
      }
    },
    {
      "name": "Get My Posts",
      "method": "GET",
      "url": "https://api.blog.com/posts/me",
      "headers": {
        "Authorization": "Bearer {{AUTH_TOKEN}}"
      },
      "expect": {
        "status": 200,
        "jsonPath": {
          "posts[0].author.email": "{{USER_EMAIL}}"
        }
      }
    },
    {
      "name": "Create Post",
      "method": "POST",
      "url": "https://api.blog.com/posts",
      "headers": {
        "Authorization": "Bearer {{AUTH_TOKEN}}"
      },
      "body": {
        "title": "My New Post",
        "content": "This is the post content",
        "published": true
      },
      "expect": {
        "status": 201,
        "contains": "My New Post",
        "responseTime": 2000
      }
    }
  ]
}
```

### Scenario 2: CI/CD Integration

**In your CI/CD pipeline (e.g., GitHub Actions):**

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install CLI
        run: |
          cd cli
          npm install
          npm run build
          npm link
      
      - name: Run API Tests
        run: apicli test tests/api-tests.json -e .env.test -r report.html
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-report
          path: report.html
```

### Scenario 3: Multiple Environments

**dev.env:**
```env
BASE_URL=https://dev-api.example.com
API_KEY=dev_key_123
```

**staging.env:**
```env
BASE_URL=https://staging-api.example.com
API_KEY=staging_key_456
```

**production.env:**
```env
BASE_URL=https://api.example.com
API_KEY=prod_key_789
```

**Run tests against different environments:**
```bash
# Development
apicli test tests.json -e dev.env -r dev-report.html

# Staging
apicli test tests.json -e staging.env -r staging-report.html

# Production (smoke tests)
apicli test smoke-tests.json -e production.env -r prod-report.html
```

## Tips and Best Practices

### 1. Organize Collections by Feature

```
collections/
├── auth-tests.json
├── user-tests.json
├── product-tests.json
└── order-tests.json
```

### 2. Use Environment Variables for Secrets

Never hardcode API keys or sensitive data in collections:

❌ **Bad:**
```json
{
  "headers": {
    "Authorization": "Bearer sk_live_abc123xyz"
  }
}
```

✅ **Good:**
```json
{
  "headers": {
    "Authorization": "Bearer {{API_KEY}}"
  }
}
```

### 3. Test Response Times

Always include response time assertions for performance monitoring:

```json
{
  "expect": {
    "status": 200,
    "responseTime": 1000
  }
}
```

### 4. Use Descriptive Names

```json
{
  "name": "POST /api/users - Create new user with admin role",
  "method": "POST",
  ...
}
```

### 5. Chain Tests Logically

Order tests in a logical flow:
1. Authentication
2. Create resources
3. Read/Retrieve
4. Update
5. Delete

## Troubleshooting

### Issue: "Module not found"

**Solution:** Run `npm run build` to compile TypeScript

### Issue: "Command not found: apicli"

**Solution:** Run `npm link` in the cli directory

### Issue: "Invalid JSON in request body"

**Solution:** Ensure JSON is properly escaped for your shell:
- PowerShell: Use single quotes and escape inner quotes
- Bash: Use single quotes or escape double quotes

### Issue: "Collection file not found"

**Solution:** Use correct path relative to current directory or absolute path

---

## More Examples

For more examples, check the `examples/` directory:
- `test-collection.json` - Comprehensive JSON collection
- `test-collection.yaml` - YAML format example
- `collection-with-env.json` - Environment variable usage
- `env-example.json` - Environment file example

Happy API testing! 🚀


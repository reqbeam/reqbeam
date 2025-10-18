# Quick Start Guide

## Installation

1. Navigate to the CLI directory:
```bash
cd cli
```

2. Install dependencies (already done):
```bash
npm install
```

3. Build the project (already done):
```bash
npm run build
```

4. Link globally to use `apicli` command anywhere:
```bash
npm link
```

## Test It Out!

### 1. Try a Simple GET Request

```bash
apicli get https://jsonplaceholder.typicode.com/users/1
```

You should see a formatted response with status, time, and body.

### 2. Make a POST Request

```bash
apicli post https://jsonplaceholder.typicode.com/posts -d '{"title":"Test","body":"Hello","userId":1}'
```

### 3. Run the Example Test Collection

```bash
apicli test examples/test-collection.json
```

You'll see all tests execute with colorful output and a summary table!

### 4. Generate an HTML Report

```bash
apicli test examples/test-collection.json -r test-report.html
```

Open `test-report.html` in your browser to see the beautiful report!

### 5. Try the YAML Collection

```bash
apicli test examples/test-collection.yaml
```

### 6. Test with Environment Variables

```bash
apicli test examples/collection-with-env.json -e examples/env-example.json
```

### 7. Interactive Mode

```bash
apicli interactive
```

or

```bash
apicli i
```

This launches an interactive prompt where you can:
- Build and send requests
- Create collections
- Run tests

## Commands Overview

```bash
# GET request
apicli get <url> [-H "Header: Value"] [-e env.json] [-v]

# POST request
apicli post <url> -d '{"key":"value"}' [-H "Header: Value"] [-e env.json]

# Run collection
apicli run collection.json [-e env.json] [-r report.html]

# Run tests
apicli test collection.json [-e env.json] [-r report.html] [-v]

# Interactive mode
apicli interactive
```

## Creating Your First Collection

1. Create a file `my-collection.json`:

```json
{
  "name": "My First Collection",
  "description": "Testing my APIs",
  "requests": [
    {
      "name": "Get Data",
      "method": "GET",
      "url": "https://api.example.com/data",
      "expect": {
        "status": 200,
        "responseTime": 1000
      }
    }
  ]
}
```

2. Run it:
```bash
apicli test my-collection.json
```

## Using Environment Variables

1. Create `.env` file:
```env
API_BASE=https://api.example.com
API_KEY=your-key-here
```

2. Use in collection:
```json
{
  "name": "API Test",
  "requests": [
    {
      "name": "Auth Request",
      "method": "GET",
      "url": "{{API_BASE}}/users",
      "headers": {
        "Authorization": "Bearer {{API_KEY}}"
      }
    }
  ]
}
```

3. Run with env:
```bash
apicli test collection.json -e .env
```

## Tips

- Use `-v` flag for verbose output (includes headers)
- Use `-r report.html` to generate HTML reports
- Collections can be JSON or YAML format
- Environment variables use `{{VARIABLE}}` syntax
- All commands support `--help` for more info

## Example Output

```
🧪 Running tests...

Collection: API Test Collection
Running 6 tests...

[1/6] Get Users
   ✓ 200 OK - 245ms

[2/6] Create Post
   ✓ 201 Created - 312ms

Summary:
┌────────┬────────┬─────────────┬─────────────┬────────┬────────────┐
│ Status │ Method │ Name        │ Status Code │ Time   │ Assertions │
├────────┼────────┼─────────────┼─────────────┼────────┼────────────┤
│ ✓      │ GET    │ Get Users   │ 200         │ 245ms  │ 3/3        │
│ ✓      │ POST   │ Create Post │ 201         │ 312ms  │ 2/2        │
└────────┴────────┴─────────────┴─────────────┴────────┴────────────┘

Summary:
  ✓ Passed: 2 | ✗ Failed: 0 | Total time: 557ms
```

Enjoy testing your APIs! 🚀


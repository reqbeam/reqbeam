# API Nexus CLI

A lightweight, powerful Postman CLI alternative for making API requests, running tests, and managing collections. Built with TypeScript, featuring colorized output, environment variable support, and comprehensive testing capabilities.

## 🚀 Features

- **Simple HTTP Requests** - Make GET, POST, PUT, DELETE, and PATCH requests from the command line
- **Collection Runner** - Execute multiple requests from JSON/YAML collection files
- **Test Automation** - Run API tests with assertions and get detailed pass/fail results
- **Environment Variables** - Support for .env files and custom environment configurations
- **Colorized Output** - Beautiful, easy-to-read CLI output with Chalk
- **HTML Reports** - Generate detailed HTML test reports
- **Interactive Mode** - User-friendly interactive CLI for building requests
- **YAML Support** - Collections in both JSON and YAML formats
- **Assertion System** - Comprehensive testing with status codes, response bodies, headers, and more

## 📦 Installation

### Install Globally

```bash
cd cli
npm install
npm run build
npm link
```

Now you can use `apicli` from anywhere on your system!

### Install Locally

```bash
cd cli
npm install
npm run build
```

Use with `node dist/index.js` or `npm start`

## 🎯 Quick Start

### Make a Simple GET Request

```bash
apicli get https://api.example.com/users
```

### Make a POST Request with Data

```bash
apicli post https://api.example.com/users -d '{"name":"John","email":"john@example.com"}'
```

### Run a Collection

```bash
apicli run examples/test-collection.json
```

### Run Tests with Assertions

```bash
apicli test examples/test-collection.json
```

### Interactive Mode

```bash
apicli interactive
# or
apicli i
```

## 📚 Command Reference

### GET Command

Make a GET request to a URL.

```bash
apicli get <url> [options]

Options:
  -H, --header <headers...>  Add headers (format: "Key: Value")
  -e, --env <file>           Load environment variables from file
  -v, --verbose              Show detailed output (includes headers)

Examples:
  apicli get https://api.example.com/users
  apicli get https://api.example.com/users -H "Authorization: Bearer token123"
  apicli get https://api.example.com/users -e .env -v
```

### POST Command

Make a POST request with optional body data.

```bash
apicli post <url> [options]

Options:
  -d, --data <data>          Request body data (JSON string)
  -H, --header <headers...>  Add headers (format: "Key: Value")
  -e, --env <file>           Load environment variables from file
  -v, --verbose              Show detailed output

Examples:
  apicli post https://api.example.com/users -d '{"name":"John"}'
  apicli post https://api.example.com/users -d '{"name":"John"}' -H "Content-Type: application/json"
  apicli post https://api.example.com/users -d '{"name":"{{USERNAME}}"}' -e .env
```

### RUN Command

Execute all requests in a collection file.

```bash
apicli run <collection> [options]

Options:
  -e, --env <file>     Load environment variables from file
  -v, --verbose        Show detailed output
  -r, --report <file>  Generate HTML report

Examples:
  apicli run collection.json
  apicli run collection.yaml -e .env
  apicli run collection.json -r report.html
```

### TEST Command

Run test scripts with assertions and print pass/fail results.

```bash
apicli test <collection> [options]

Options:
  -e, --env <file>     Load environment variables from file
  -v, --verbose        Show detailed output
  -r, --report <file>  Generate HTML report

Examples:
  apicli test collection.json
  apicli test examples/test-collection.json -e .env
  apicli test collection.json -r test-report.html
```

### INTERACTIVE Command

Start an interactive CLI mode for building and executing requests.

```bash
apicli interactive
# or
apicli i
```

## 📝 Collection File Format

### JSON Format

```json
{
  "name": "My API Collection",
  "description": "Optional description",
  "requests": [
    {
      "name": "Get Users",
      "method": "GET",
      "url": "https://api.example.com/users",
      "headers": {
        "Authorization": "Bearer {{API_KEY}}"
      },
      "expect": {
        "status": 200,
        "contains": "email",
        "responseTime": 2000
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
        "email": "john@example.com"
      },
      "expect": {
        "statusRange": [200, 201],
        "contains": "John Doe",
        "headers": {
          "content-type": "application/json"
        }
      }
    }
  ]
}
```

### YAML Format

```yaml
name: My API Collection
description: Optional description
requests:
  - name: Get Users
    method: GET
    url: https://api.example.com/users
    headers:
      Authorization: Bearer {{API_KEY}}
    expect:
      status: 200
      contains: email
      responseTime: 2000

  - name: Create User
    method: POST
    url: https://api.example.com/users
    headers:
      Content-Type: application/json
    body:
      name: John Doe
      email: john@example.com
    expect:
      statusRange: [200, 201]
      contains: John Doe
```

## 🧪 Assertion System

The `expect` field in your requests supports various assertions:

### Status Code

```json
{
  "expect": {
    "status": 200
  }
}
```

### Status Range

```json
{
  "expect": {
    "statusRange": [200, 299]
  }
}
```

### Response Contains Text

```json
{
  "expect": {
    "contains": "success",
    // or multiple values
    "contains": ["success", "user"]
  }
}
```

### Response Does Not Contain Text

```json
{
  "expect": {
    "notContains": "error"
  }
}
```

### Response Headers

```json
{
  "expect": {
    "headers": {
      "content-type": "application/json"
    }
  }
}
```

### JSON Path Assertions

```json
{
  "expect": {
    "jsonPath": {
      "user.name": "John Doe",
      "data[0].id": 1,
      "status": "active"
    }
  }
}
```

### Response Time

```json
{
  "expect": {
    "responseTime": 1000  // max response time in ms
  }
}
```

### Combined Assertions

```json
{
  "expect": {
    "status": 200,
    "responseTime": 2000,
    "contains": ["email", "name"],
    "jsonPath": {
      "user.active": true
    },
    "headers": {
      "content-type": "application/json"
    }
  }
}
```

## 🌍 Environment Variables

### .env File

Create a `.env` file in your project root:

```env
BASE_URL=https://api.example.com
API_KEY=your-api-key-here
USER_ID=12345
```

### JSON Environment File

```json
{
  "BASE_URL": "https://api.example.com",
  "API_KEY": "your-api-key-here",
  "USER_ID": "12345"
}
```

### Using Environment Variables

In your requests, use `{{VARIABLE_NAME}}` syntax:

```json
{
  "name": "Get User",
  "method": "GET",
  "url": "{{BASE_URL}}/users/{{USER_ID}}",
  "headers": {
    "Authorization": "Bearer {{API_KEY}}"
  }
}
```

Run with environment file:

```bash
apicli test collection.json -e .env
apicli test collection.json -e env.json
```

## 📊 HTML Reports

Generate beautiful HTML reports of your test runs:

```bash
apicli test collection.json -r report.html
```

The report includes:
- Summary statistics (passed/failed/total tests)
- Detailed results for each request
- Response times
- Assertion results with expected vs actual values
- Error messages for failed requests
- Color-coded status indicators

## 🎨 Output Examples

### Successful Request

```
🚀 Making GET request...

Response:
────────────────────────────────────────────────────────
Status: 200 OK
Time: 234ms

Body:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
────────────────────────────────────────────────────────
```

### Test Results

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

## 🛠️ Development

### Project Structure

```
cli/
├── src/
│   ├── commands/       # Command handlers
│   │   ├── get.ts
│   │   ├── post.ts
│   │   ├── run.ts
│   │   ├── test.ts
│   │   └── interactive.ts
│   ├── utils/          # Utility functions
│   │   ├── request.ts
│   │   ├── environment.ts
│   │   ├── assertions.ts
│   │   ├── formatter.ts
│   │   ├── collection.ts
│   │   └── report.ts
│   ├── types.ts        # TypeScript types
│   └── index.ts        # CLI entry point
├── bin/
│   └── apicli.js       # Executable entry
├── examples/           # Example collections
├── dist/               # Compiled output
└── package.json
```

### Build & Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Run directly
npm start -- get https://api.example.com

# Link for global use
npm link
```

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📄 License

MIT License

## 🙏 Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Axios](https://axios-http.com/) - HTTP client
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML parser
- [Table](https://github.com/gajus/table) - CLI tables

---

Made with ❤️ for the API testing community


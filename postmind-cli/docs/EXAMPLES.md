# Postmind CLI - Examples

Real-world examples and use cases for Postmind CLI.

## 📚 Table of Contents

1. [Basic API Testing](#basic-api-testing)
2. [REST API Development](#rest-api-development)
3. [Authentication Flows](#authentication-flows)
4. [Multi-Environment Testing](#multi-environment-testing)
5. [Collection Management](#collection-management)
6. [CI/CD Integration](#cicd-integration)
7. [API Monitoring](#api-monitoring)

## 🚀 Basic API Testing

### Example 1: JSONPlaceholder API Testing

```bash
# 1. Setup project
postmind init jsonplaceholder-test
postmind env add production -i
# Enter: API_URL=https://jsonplaceholder.typicode.com

# 2. Create test requests
postmind request create -n "Get All Posts" -m GET -u "{{API_URL}}/posts"
postmind request create -n "Get Single Post" -m GET -u "{{API_URL}}/posts/1"
postmind request create -n "Get Comments" -m GET -u "{{API_URL}}/posts/1/comments"
postmind request create -n "Get Users" -m GET -u "{{API_URL}}/users"
postmind request create -n "Get Albums" -m GET -u "{{API_URL}}/albums"

# 3. Create collection
postmind collection create "JSONPlaceholder Tests"
postmind collection add "JSONPlaceholder Tests" "Get All Posts"
postmind collection add "JSONPlaceholder Tests" "Get Single Post"
postmind collection add "JSONPlaceholder Tests" "Get Comments"
postmind collection add "JSONPlaceholder Tests" "Get Users"
postmind collection add "JSONPlaceholder Tests" "Get Albums"

# 4. Run tests
postmind run collection "JSONPlaceholder Tests"
```

### Example 2: HTTP Status Code Testing

```bash
# Test different HTTP status codes
postmind request create -n "200 OK" -m GET -u "https://httpbin.org/status/200"
postmind request create -n "201 Created" -m POST -u "https://httpbin.org/status/201"
postmind request create -n "400 Bad Request" -m GET -u "https://httpbin.org/status/400"
postmind request create -n "404 Not Found" -m GET -u "https://httpbin.org/status/404"
postmind request create -n "500 Server Error" -m GET -u "https://httpbin.org/status/500"

postmind collection create "Status Code Tests"
postmind collection add "Status Code Tests" "200 OK"
postmind collection add "Status Code Tests" "201 Created"
postmind collection add "Status Code Tests" "400 Bad Request"
postmind collection add "Status Code Tests" "404 Not Found"
postmind collection add "Status Code Tests" "500 Server Error"

postmind run collection "Status Code Tests"
```

## 🏗️ REST API Development

### Example 3: Complete CRUD Operations

```bash
# 1. Setup project for a blog API
postmind init blog-api
postmind env add development -i
# Enter: API_URL=http://localhost:3000,API_KEY=dev-key-123

# 2. Create CRUD requests for posts
postmind request create -n "List Posts" -m GET -u "{{API_URL}}/posts" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Get Post" -m GET -u "{{API_URL}}/posts/1" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Create Post" -m POST -u "{{API_URL}}/posts" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"title":"New Post","content":"This is a new blog post","author":"John Doe"}'
postmind request create -n "Update Post" -m PUT -u "{{API_URL}}/posts/1" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"title":"Updated Post","content":"This post has been updated"}'
postmind request create -n "Delete Post" -m DELETE -u "{{API_URL}}/posts/1" -H "Authorization:Bearer {{API_KEY}}"

# 3. Create CRUD requests for comments
postmind request create -n "List Comments" -m GET -u "{{API_URL}}/posts/1/comments" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Create Comment" -m POST -u "{{API_URL}}/posts/1/comments" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"content":"Great post!","author":"Jane Doe"}'
postmind request create -n "Update Comment" -m PUT -u "{{API_URL}}/comments/1" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"content":"Updated comment"}'
postmind request create -n "Delete Comment" -m DELETE -u "{{API_URL}}/comments/1" -H "Authorization:Bearer {{API_KEY}}"

# 4. Organize in collections
postmind collection create "Posts CRUD"
postmind collection add "Posts CRUD" "List Posts"
postmind collection add "Posts CRUD" "Get Post"
postmind collection add "Posts CRUD" "Create Post"
postmind collection add "Posts CRUD" "Update Post"
postmind collection add "Posts CRUD" "Delete Post"

postmind collection create "Comments CRUD"
postmind collection add "Comments CRUD" "List Comments"
postmind collection add "Comments CRUD" "Create Comment"
postmind collection add "Comments CRUD" "Update Comment"
postmind collection add "Comments CRUD" "Delete Comment"

# 5. Test the API
postmind run collection "Posts CRUD"
postmind run collection "Comments CRUD"
```

### Example 4: Pagination and Filtering

```bash
# Test pagination
postmind request create -n "First Page" -m GET -u "{{API_URL}}/posts?page=1&limit=10" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Second Page" -m GET -u "{{API_URL}}/posts?page=2&limit=10" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Large Page" -m GET -u "{{API_URL}}/posts?page=1&limit=100" -H "Authorization:Bearer {{API_KEY}}"

# Test filtering
postmind request create -n "Filter by Author" -m GET -u "{{API_URL}}/posts?author=John" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Filter by Date" -m GET -u "{{API_URL}}/posts?date=2024-01-01" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Search Posts" -m GET -u "{{API_URL}}/posts?search=javascript" -H "Authorization:Bearer {{API_KEY}}"

postmind collection create "Pagination Tests"
postmind collection add "Pagination Tests" "First Page"
postmind collection add "Pagination Tests" "Second Page"
postmind collection add "Pagination Tests" "Large Page"

postmind collection create "Filtering Tests"
postmind collection add "Filtering Tests" "Filter by Author"
postmind collection add "Filtering Tests" "Filter by Date"
postmind collection add "Filtering Tests" "Search Posts"
```

## 🔐 Authentication Flows

### Example 5: JWT Authentication

```bash
# 1. Setup project
postmind init auth-api
postmind env add development -i
# Enter: API_URL=http://localhost:3000,USERNAME=testuser,PASSWORD=testpass

# 2. Create authentication flow
postmind request create -n "Login" -m POST -u "{{API_URL}}/auth/login" -H "Content-Type:application/json" -b '{"username":"{{USERNAME}}","password":"{{PASSWORD}}"}'
postmind request create -n "Get Profile" -m GET -u "{{API_URL}}/auth/profile" -H "Authorization:Bearer {{JWT_TOKEN}}"
postmind request create -n "Refresh Token" -m POST -u "{{API_URL}}/auth/refresh" -H "Authorization:Bearer {{JWT_TOKEN}}"
postmind request create -n "Logout" -m POST -u "{{API_URL}}/auth/logout" -H "Authorization:Bearer {{JWT_TOKEN}}"

# 3. Create protected resource requests
postmind request create -n "Get Protected Data" -m GET -u "{{API_URL}}/protected/data" -H "Authorization:Bearer {{JWT_TOKEN}}"
postmind request create -n "Update Profile" -m PUT -u "{{API_URL}}/auth/profile" -H "Authorization:Bearer {{JWT_TOKEN}},Content-Type:application/json" -b '{"name":"Updated Name","email":"updated@example.com"}'

postmind collection create "Authentication Flow"
postmind collection add "Authentication Flow" "Login"
postmind collection add "Authentication Flow" "Get Profile"
postmind collection add "Authentication Flow" "Get Protected Data"
postmind collection add "Authentication Flow" "Update Profile"
postmind collection add "Authentication Flow" "Refresh Token"
postmind collection add "Authentication Flow" "Logout"
```

### Example 6: API Key Authentication

```bash
# 1. Setup project
postmind init api-key-test
postmind env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=your-api-key-here

# 2. Create API key authenticated requests
postmind request create -n "Get Data" -m GET -u "{{API_URL}}/data" -H "X-API-Key:{{API_KEY}}"
postmind request create -n "Create Resource" -m POST -u "{{API_URL}}/resources" -H "X-API-Key:{{API_KEY}},Content-Type:application/json" -b '{"name":"New Resource","type":"example"}'
postmind request create -n "Update Resource" -m PUT -u "{{API_URL}}/resources/1" -H "X-API-Key:{{API_KEY}},Content-Type:application/json" -b '{"name":"Updated Resource"}'
postmind request create -n "Delete Resource" -m DELETE -u "{{API_URL}}/resources/1" -H "X-API-Key:{{API_KEY}}"

postmind collection create "API Key Tests"
postmind collection add "API Key Tests" "Get Data"
postmind collection add "API Key Tests" "Create Resource"
postmind collection add "API Key Tests" "Update Resource"
postmind collection add "API Key Tests" "Delete Resource"
```

## 🌍 Multi-Environment Testing

### Example 7: Development, Staging, Production

```bash
# 1. Setup project
postmind init multi-env-api

# 2. Add environments
postmind env add development -i
# Enter: API_URL=http://localhost:3000,API_KEY=dev-key,DB_URL=localhost:5432

postmind env add staging -i
# Enter: API_URL=https://staging-api.example.com,API_KEY=staging-key,DB_URL=staging-db:5432

postmind env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=prod-key,DB_URL=prod-db:5432

# 3. Create requests
postmind request create -n "Health Check" -m GET -u "{{API_URL}}/health"
postmind request create -n "Get Users" -m GET -u "{{API_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
postmind request create -n "Create User" -m POST -u "{{API_URL}}/users" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"name":"Test User","email":"test@example.com"}'

# 4. Test across environments
postmind run request "Health Check" -e development
postmind run request "Health Check" -e staging
postmind run request "Health Check" -e production

# 5. Run full collection on each environment
postmind collection create "API Tests"
postmind collection add "API Tests" "Health Check"
postmind collection add "API Tests" "Get Users"
postmind collection add "API Tests" "Create User"

postmind run collection "API Tests" -e development
postmind run collection "API Tests" -e staging
postmind run collection "API Tests" -e production
```

## 📦 Collection Management

### Example 8: Organizing Large API Collections

```bash
# 1. Setup project
postmind init ecommerce-api

# 2. Create user management requests
postmind request create -n "Register User" -m POST -u "{{API_URL}}/users/register" -H "Content-Type:application/json" -b '{"email":"user@example.com","password":"password123"}'
postmind request create -n "Login User" -m POST -u "{{API_URL}}/users/login" -H "Content-Type:application/json" -b '{"email":"user@example.com","password":"password123"}'
postmind request create -n "Get User Profile" -m GET -u "{{API_URL}}/users/profile" -H "Authorization:Bearer {{TOKEN}}"
postmind request create -n "Update User Profile" -m PUT -u "{{API_URL}}/users/profile" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"Updated Name"}'

# 3. Create product management requests
postmind request create -n "List Products" -m GET -u "{{API_URL}}/products"
postmind request create -n "Get Product" -m GET -u "{{API_URL}}/products/1"
postmind request create -n "Create Product" -m POST -u "{{API_URL}}/products" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"New Product","price":29.99,"description":"A great product"}'
postmind request create -n "Update Product" -m PUT -u "{{API_URL}}/products/1" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"Updated Product","price":39.99}'
postmind request create -n "Delete Product" -m DELETE -u "{{API_URL}}/products/1" -H "Authorization:Bearer {{TOKEN}}"

# 4. Create order management requests
postmind request create -n "Create Order" -m POST -u "{{API_URL}}/orders" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"items":[{"productId":1,"quantity":2}],"shippingAddress":"123 Main St"}'
postmind request create -n "Get Order" -m GET -u "{{API_URL}}/orders/1" -H "Authorization:Bearer {{TOKEN}}"
postmind request create -n "List Orders" -m GET -u "{{API_URL}}/orders" -H "Authorization:Bearer {{TOKEN}}"
postmind request create -n "Update Order Status" -m PUT -u "{{API_URL}}/orders/1/status" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"status":"shipped"}'

# 5. Create organized collections
postmind collection create "User Management"
postmind collection add "User Management" "Register User"
postmind collection add "User Management" "Login User"
postmind collection add "User Management" "Get User Profile"
postmind collection add "User Management" "Update User Profile"

postmind collection create "Product Management"
postmind collection add "Product Management" "List Products"
postmind collection add "Product Management" "Get Product"
postmind collection add "Product Management" "Create Product"
postmind collection add "Product Management" "Update Product"
postmind collection add "Product Management" "Delete Product"

postmind collection create "Order Management"
postmind collection add "Order Management" "Create Order"
postmind collection add "Order Management" "Get Order"
postmind collection add "Order Management" "List Orders"
postmind collection add "Order Management" "Update Order Status"

# 6. Export collections for sharing
postmind collection export "User Management" ./user-management.json
postmind collection export "Product Management" ./product-management.json
postmind collection export "Order Management" ./order-management.json
```

## 🔄 CI/CD Integration

### Example 9: Automated API Testing

```bash
# Create a comprehensive test suite
postmind init ci-cd-tests
postmind env add ci -i
# Enter: API_URL=https://api.example.com,API_KEY=ci-test-key

# Create smoke tests
postmind request create -n "API Health" -m GET -u "{{API_URL}}/health"
postmind request create -n "Database Health" -m GET -u "{{API_URL}}/health/db"
postmind request create -n "Cache Health" -m GET -u "{{API_URL}}/health/cache"

# Create integration tests
postmind request create -n "User Registration" -m POST -u "{{API_URL}}/users" -H "Content-Type:application/json" -b '{"email":"test@example.com","password":"test123"}'
postmind request create -n "User Login" -m POST -u "{{API_URL}}/auth/login" -H "Content-Type:application/json" -b '{"email":"test@example.com","password":"test123"}'
postmind request create -n "Protected Endpoint" -m GET -u "{{API_URL}}/protected" -H "Authorization:Bearer {{TOKEN}}"

# Create performance tests
postmind request create -n "Load Test 1" -m GET -u "{{API_URL}}/data?limit=1000"
postmind request create -n "Load Test 2" -m GET -u "{{API_URL}}/search?q=test&limit=500"

postmind collection create "Smoke Tests"
postmind collection add "Smoke Tests" "API Health"
postmind collection add "Smoke Tests" "Database Health"
postmind collection add "Smoke Tests" "Cache Health"

postmind collection create "Integration Tests"
postmind collection add "Integration Tests" "User Registration"
postmind collection add "Integration Tests" "User Login"
postmind collection add "Integration Tests" "Protected Endpoint"

postmind collection create "Performance Tests"
postmind collection add "Performance Tests" "Load Test 1"
postmind collection add "Performance Tests" "Load Test 2"

# Run tests with parallel execution for speed
postmind run collection "Smoke Tests" --parallel
postmind run collection "Integration Tests" --parallel
postmind run collection "Performance Tests" --parallel
```

## 📊 API Monitoring

### Example 10: Health Monitoring

```bash
# Create monitoring requests
postmind request create -n "API Status" -m GET -u "{{API_URL}}/status"
postmind request create -n "Response Time" -m GET -u "{{API_URL}}/ping"
postmind request create -n "Database Status" -m GET -u "{{API_URL}}/health/database"
postmind request create -n "Cache Status" -m GET -u "{{API_URL}}/health/cache"
postmind request create -n "Queue Status" -m GET -u "{{API_URL}}/health/queue"

postmind collection create "Health Monitoring"
postmind collection add "Health Monitoring" "API Status"
postmind collection add "Health Monitoring" "Response Time"
postmind collection add "Health Monitoring" "Database Status"
postmind collection add "Health Monitoring" "Cache Status"
postmind collection add "Health Monitoring" "Queue Status"

# Run monitoring with response saving
postmind run collection "Health Monitoring" --save-response

# Check history for trends
postmind run history-list
```

## 🎯 Advanced Usage Patterns

### Example 11: Dynamic Request Building

```bash
# Use environment variables for dynamic URLs
postmind env add dynamic -i
# Enter: BASE_URL=https://api.example.com,VERSION=v1,ENDPOINT=users,ID=123

postmind request create -n "Dynamic User" -m GET -u "{{BASE_URL}}/{{VERSION}}/{{ENDPOINT}}/{{ID}}"
postmind request create -n "Dynamic List" -m GET -u "{{BASE_URL}}/{{VERSION}}/{{ENDPOINT}}"
postmind request create -n "Dynamic Search" -m GET -u "{{BASE_URL}}/{{VERSION}}/{{ENDPOINT}}?search={{SEARCH_TERM}}"
```

### Example 12: File Upload Testing

```bash
# Test file upload endpoints
postmind request create -n "Upload Image" -m POST -u "{{API_URL}}/upload" -H "Authorization:Bearer {{TOKEN}}" -b '{"file":"base64-encoded-image-data","type":"image/jpeg"}'
postmind request create -n "Upload Document" -m POST -u "{{API_URL}}/documents" -H "Authorization:Bearer {{TOKEN}},Content-Type:multipart/form-data" -b '{"file":"document.pdf","name":"report.pdf"}'
```

## 🚀 Best Practices

1. **Use meaningful names** for requests and collections
2. **Organize collections** by feature or functionality
3. **Use environment variables** for configuration
4. **Save responses** for debugging and analysis
5. **Use parallel execution** for faster testing
6. **Export collections** for team sharing
7. **Monitor execution history** for trends
8. **Test across environments** regularly
9. **Use interactive mode** for complex requests
10. **Keep collections focused** and well-organized

---

**These examples should give you a solid foundation for using Postmind CLI effectively!** 🎉

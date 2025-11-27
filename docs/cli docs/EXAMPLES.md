# Reqbeam CLI - Examples

Real-world examples and use cases for Reqbeam CLI.

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
Reqbeam init jsonplaceholder-test
Reqbeam env add production -i
# Enter: API_URL=https://jsonplaceholder.typicode.com

# 2. Create test requests
Reqbeam request create -n "Get All Posts" -m GET -u "{{API_URL}}/posts"
Reqbeam request create -n "Get Single Post" -m GET -u "{{API_URL}}/posts/1"
Reqbeam request create -n "Get Comments" -m GET -u "{{API_URL}}/posts/1/comments"
Reqbeam request create -n "Get Users" -m GET -u "{{API_URL}}/users"
Reqbeam request create -n "Get Albums" -m GET -u "{{API_URL}}/albums"

# 3. Create collection
Reqbeam collection create "JSONPlaceholder Tests"
Reqbeam collection add "JSONPlaceholder Tests" "Get All Posts"
Reqbeam collection add "JSONPlaceholder Tests" "Get Single Post"
Reqbeam collection add "JSONPlaceholder Tests" "Get Comments"
Reqbeam collection add "JSONPlaceholder Tests" "Get Users"
Reqbeam collection add "JSONPlaceholder Tests" "Get Albums"

# 4. Run tests
Reqbeam run collection "JSONPlaceholder Tests"
```

### Example 2: HTTP Status Code Testing

```bash
# Test different HTTP status codes
Reqbeam request create -n "200 OK" -m GET -u "https://httpbin.org/status/200"
Reqbeam request create -n "201 Created" -m POST -u "https://httpbin.org/status/201"
Reqbeam request create -n "400 Bad Request" -m GET -u "https://httpbin.org/status/400"
Reqbeam request create -n "404 Not Found" -m GET -u "https://httpbin.org/status/404"
Reqbeam request create -n "500 Server Error" -m GET -u "https://httpbin.org/status/500"

Reqbeam collection create "Status Code Tests"
Reqbeam collection add "Status Code Tests" "200 OK"
Reqbeam collection add "Status Code Tests" "201 Created"
Reqbeam collection add "Status Code Tests" "400 Bad Request"
Reqbeam collection add "Status Code Tests" "404 Not Found"
Reqbeam collection add "Status Code Tests" "500 Server Error"

Reqbeam run collection "Status Code Tests"
```

## 🏗️ REST API Development

### Example 3: Complete CRUD Operations

```bash
# 1. Setup project for a blog API
Reqbeam init blog-api
Reqbeam env add development -i
# Enter: API_URL=http://localhost:3000,API_KEY=dev-key-123

# 2. Create CRUD requests for posts
Reqbeam request create -n "List Posts" -m GET -u "{{API_URL}}/posts" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Get Post" -m GET -u "{{API_URL}}/posts/1" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Create Post" -m POST -u "{{API_URL}}/posts" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"title":"New Post","content":"This is a new blog post","author":"John Doe"}'
Reqbeam request create -n "Update Post" -m PUT -u "{{API_URL}}/posts/1" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"title":"Updated Post","content":"This post has been updated"}'
Reqbeam request create -n "Delete Post" -m DELETE -u "{{API_URL}}/posts/1" -H "Authorization:Bearer {{API_KEY}}"

# 3. Create CRUD requests for comments
Reqbeam request create -n "List Comments" -m GET -u "{{API_URL}}/posts/1/comments" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Create Comment" -m POST -u "{{API_URL}}/posts/1/comments" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"content":"Great post!","author":"Jane Doe"}'
Reqbeam request create -n "Update Comment" -m PUT -u "{{API_URL}}/comments/1" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"content":"Updated comment"}'
Reqbeam request create -n "Delete Comment" -m DELETE -u "{{API_URL}}/comments/1" -H "Authorization:Bearer {{API_KEY}}"

# 4. Organize in collections
Reqbeam collection create "Posts CRUD"
Reqbeam collection add "Posts CRUD" "List Posts"
Reqbeam collection add "Posts CRUD" "Get Post"
Reqbeam collection add "Posts CRUD" "Create Post"
Reqbeam collection add "Posts CRUD" "Update Post"
Reqbeam collection add "Posts CRUD" "Delete Post"

Reqbeam collection create "Comments CRUD"
Reqbeam collection add "Comments CRUD" "List Comments"
Reqbeam collection add "Comments CRUD" "Create Comment"
Reqbeam collection add "Comments CRUD" "Update Comment"
Reqbeam collection add "Comments CRUD" "Delete Comment"

# 5. Test the API
Reqbeam run collection "Posts CRUD"
Reqbeam run collection "Comments CRUD"
```

### Example 4: Pagination and Filtering

```bash
# Test pagination
Reqbeam request create -n "First Page" -m GET -u "{{API_URL}}/posts?page=1&limit=10" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Second Page" -m GET -u "{{API_URL}}/posts?page=2&limit=10" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Large Page" -m GET -u "{{API_URL}}/posts?page=1&limit=100" -H "Authorization:Bearer {{API_KEY}}"

# Test filtering
Reqbeam request create -n "Filter by Author" -m GET -u "{{API_URL}}/posts?author=John" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Filter by Date" -m GET -u "{{API_URL}}/posts?date=2024-01-01" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Search Posts" -m GET -u "{{API_URL}}/posts?search=javascript" -H "Authorization:Bearer {{API_KEY}}"

Reqbeam collection create "Pagination Tests"
Reqbeam collection add "Pagination Tests" "First Page"
Reqbeam collection add "Pagination Tests" "Second Page"
Reqbeam collection add "Pagination Tests" "Large Page"

Reqbeam collection create "Filtering Tests"
Reqbeam collection add "Filtering Tests" "Filter by Author"
Reqbeam collection add "Filtering Tests" "Filter by Date"
Reqbeam collection add "Filtering Tests" "Search Posts"
```

## 🔐 Authentication Flows

### Example 5: JWT Authentication

```bash
# 1. Setup project
Reqbeam init auth-api
Reqbeam env add development -i
# Enter: API_URL=http://localhost:3000,USERNAME=testuser,PASSWORD=testpass

# 2. Create authentication flow
Reqbeam request create -n "Login" -m POST -u "{{API_URL}}/auth/login" -H "Content-Type:application/json" -b '{"username":"{{USERNAME}}","password":"{{PASSWORD}}"}'
Reqbeam request create -n "Get Profile" -m GET -u "{{API_URL}}/auth/profile" -H "Authorization:Bearer {{JWT_TOKEN}}"
Reqbeam request create -n "Refresh Token" -m POST -u "{{API_URL}}/auth/refresh" -H "Authorization:Bearer {{JWT_TOKEN}}"
Reqbeam request create -n "Logout" -m POST -u "{{API_URL}}/auth/logout" -H "Authorization:Bearer {{JWT_TOKEN}}"

# 3. Create protected resource requests
Reqbeam request create -n "Get Protected Data" -m GET -u "{{API_URL}}/protected/data" -H "Authorization:Bearer {{JWT_TOKEN}}"
Reqbeam request create -n "Update Profile" -m PUT -u "{{API_URL}}/auth/profile" -H "Authorization:Bearer {{JWT_TOKEN}},Content-Type:application/json" -b '{"name":"Updated Name","email":"updated@example.com"}'

Reqbeam collection create "Authentication Flow"
Reqbeam collection add "Authentication Flow" "Login"
Reqbeam collection add "Authentication Flow" "Get Profile"
Reqbeam collection add "Authentication Flow" "Get Protected Data"
Reqbeam collection add "Authentication Flow" "Update Profile"
Reqbeam collection add "Authentication Flow" "Refresh Token"
Reqbeam collection add "Authentication Flow" "Logout"
```

### Example 6: API Key Authentication

```bash
# 1. Setup project
Reqbeam init api-key-test
Reqbeam env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=your-api-key-here

# 2. Create API key authenticated requests
Reqbeam request create -n "Get Data" -m GET -u "{{API_URL}}/data" -H "X-API-Key:{{API_KEY}}"
Reqbeam request create -n "Create Resource" -m POST -u "{{API_URL}}/resources" -H "X-API-Key:{{API_KEY}},Content-Type:application/json" -b '{"name":"New Resource","type":"example"}'
Reqbeam request create -n "Update Resource" -m PUT -u "{{API_URL}}/resources/1" -H "X-API-Key:{{API_KEY}},Content-Type:application/json" -b '{"name":"Updated Resource"}'
Reqbeam request create -n "Delete Resource" -m DELETE -u "{{API_URL}}/resources/1" -H "X-API-Key:{{API_KEY}}"

Reqbeam collection create "API Key Tests"
Reqbeam collection add "API Key Tests" "Get Data"
Reqbeam collection add "API Key Tests" "Create Resource"
Reqbeam collection add "API Key Tests" "Update Resource"
Reqbeam collection add "API Key Tests" "Delete Resource"
```

## 🌍 Multi-Environment Testing

### Example 7: Development, Staging, Production

```bash
# 1. Setup project
Reqbeam init multi-env-api

# 2. Add environments
Reqbeam env add development -i
# Enter: API_URL=http://localhost:3000,API_KEY=dev-key,DB_URL=localhost:5432

Reqbeam env add staging -i
# Enter: API_URL=https://staging-api.example.com,API_KEY=staging-key,DB_URL=staging-db:5432

Reqbeam env add production -i
# Enter: API_URL=https://api.example.com,API_KEY=prod-key,DB_URL=prod-db:5432

# 3. Create requests
Reqbeam request create -n "Health Check" -m GET -u "{{API_URL}}/health"
Reqbeam request create -n "Get Users" -m GET -u "{{API_URL}}/users" -H "Authorization:Bearer {{API_KEY}}"
Reqbeam request create -n "Create User" -m POST -u "{{API_URL}}/users" -H "Authorization:Bearer {{API_KEY}},Content-Type:application/json" -b '{"name":"Test User","email":"test@example.com"}'

# 4. Test across environments
Reqbeam run request "Health Check" -e development
Reqbeam run request "Health Check" -e staging
Reqbeam run request "Health Check" -e production

# 5. Run full collection on each environment
Reqbeam collection create "API Tests"
Reqbeam collection add "API Tests" "Health Check"
Reqbeam collection add "API Tests" "Get Users"
Reqbeam collection add "API Tests" "Create User"

Reqbeam run collection "API Tests" -e development
Reqbeam run collection "API Tests" -e staging
Reqbeam run collection "API Tests" -e production
```

## 📦 Collection Management

### Example 8: Organizing Large API Collections

```bash
# 1. Setup project
Reqbeam init ecommerce-api

# 2. Create user management requests
Reqbeam request create -n "Register User" -m POST -u "{{API_URL}}/users/register" -H "Content-Type:application/json" -b '{"email":"user@example.com","password":"password123"}'
Reqbeam request create -n "Login User" -m POST -u "{{API_URL}}/users/login" -H "Content-Type:application/json" -b '{"email":"user@example.com","password":"password123"}'
Reqbeam request create -n "Get User Profile" -m GET -u "{{API_URL}}/users/profile" -H "Authorization:Bearer {{TOKEN}}"
Reqbeam request create -n "Update User Profile" -m PUT -u "{{API_URL}}/users/profile" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"Updated Name"}'

# 3. Create product management requests
Reqbeam request create -n "List Products" -m GET -u "{{API_URL}}/products"
Reqbeam request create -n "Get Product" -m GET -u "{{API_URL}}/products/1"
Reqbeam request create -n "Create Product" -m POST -u "{{API_URL}}/products" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"New Product","price":29.99,"description":"A great product"}'
Reqbeam request create -n "Update Product" -m PUT -u "{{API_URL}}/products/1" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"name":"Updated Product","price":39.99}'
Reqbeam request create -n "Delete Product" -m DELETE -u "{{API_URL}}/products/1" -H "Authorization:Bearer {{TOKEN}}"

# 4. Create order management requests
Reqbeam request create -n "Create Order" -m POST -u "{{API_URL}}/orders" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"items":[{"productId":1,"quantity":2}],"shippingAddress":"123 Main St"}'
Reqbeam request create -n "Get Order" -m GET -u "{{API_URL}}/orders/1" -H "Authorization:Bearer {{TOKEN}}"
Reqbeam request create -n "List Orders" -m GET -u "{{API_URL}}/orders" -H "Authorization:Bearer {{TOKEN}}"
Reqbeam request create -n "Update Order Status" -m PUT -u "{{API_URL}}/orders/1/status" -H "Authorization:Bearer {{TOKEN}},Content-Type:application/json" -b '{"status":"shipped"}'

# 5. Create organized collections
Reqbeam collection create "User Management"
Reqbeam collection add "User Management" "Register User"
Reqbeam collection add "User Management" "Login User"
Reqbeam collection add "User Management" "Get User Profile"
Reqbeam collection add "User Management" "Update User Profile"

Reqbeam collection create "Product Management"
Reqbeam collection add "Product Management" "List Products"
Reqbeam collection add "Product Management" "Get Product"
Reqbeam collection add "Product Management" "Create Product"
Reqbeam collection add "Product Management" "Update Product"
Reqbeam collection add "Product Management" "Delete Product"

Reqbeam collection create "Order Management"
Reqbeam collection add "Order Management" "Create Order"
Reqbeam collection add "Order Management" "Get Order"
Reqbeam collection add "Order Management" "List Orders"
Reqbeam collection add "Order Management" "Update Order Status"

# 6. Export collections for sharing
Reqbeam collection export "User Management" ./user-management.json
Reqbeam collection export "Product Management" ./product-management.json
Reqbeam collection export "Order Management" ./order-management.json
```

## 🔄 CI/CD Integration

### Example 9: Automated API Testing

```bash
# Create a comprehensive test suite
Reqbeam init ci-cd-tests
Reqbeam env add ci -i
# Enter: API_URL=https://api.example.com,API_KEY=ci-test-key

# Create smoke tests
Reqbeam request create -n "API Health" -m GET -u "{{API_URL}}/health"
Reqbeam request create -n "Database Health" -m GET -u "{{API_URL}}/health/db"
Reqbeam request create -n "Cache Health" -m GET -u "{{API_URL}}/health/cache"

# Create integration tests
Reqbeam request create -n "User Registration" -m POST -u "{{API_URL}}/users" -H "Content-Type:application/json" -b '{"email":"test@example.com","password":"test123"}'
Reqbeam request create -n "User Login" -m POST -u "{{API_URL}}/auth/login" -H "Content-Type:application/json" -b '{"email":"test@example.com","password":"test123"}'
Reqbeam request create -n "Protected Endpoint" -m GET -u "{{API_URL}}/protected" -H "Authorization:Bearer {{TOKEN}}"

# Create performance tests
Reqbeam request create -n "Load Test 1" -m GET -u "{{API_URL}}/data?limit=1000"
Reqbeam request create -n "Load Test 2" -m GET -u "{{API_URL}}/search?q=test&limit=500"

Reqbeam collection create "Smoke Tests"
Reqbeam collection add "Smoke Tests" "API Health"
Reqbeam collection add "Smoke Tests" "Database Health"
Reqbeam collection add "Smoke Tests" "Cache Health"

Reqbeam collection create "Integration Tests"
Reqbeam collection add "Integration Tests" "User Registration"
Reqbeam collection add "Integration Tests" "User Login"
Reqbeam collection add "Integration Tests" "Protected Endpoint"

Reqbeam collection create "Performance Tests"
Reqbeam collection add "Performance Tests" "Load Test 1"
Reqbeam collection add "Performance Tests" "Load Test 2"

# Run tests with parallel execution for speed
Reqbeam run collection "Smoke Tests" --parallel
Reqbeam run collection "Integration Tests" --parallel
Reqbeam run collection "Performance Tests" --parallel
```

## 📊 API Monitoring

### Example 10: Health Monitoring

```bash
# Create monitoring requests
Reqbeam request create -n "API Status" -m GET -u "{{API_URL}}/status"
Reqbeam request create -n "Response Time" -m GET -u "{{API_URL}}/ping"
Reqbeam request create -n "Database Status" -m GET -u "{{API_URL}}/health/database"
Reqbeam request create -n "Cache Status" -m GET -u "{{API_URL}}/health/cache"
Reqbeam request create -n "Queue Status" -m GET -u "{{API_URL}}/health/queue"

Reqbeam collection create "Health Monitoring"
Reqbeam collection add "Health Monitoring" "API Status"
Reqbeam collection add "Health Monitoring" "Response Time"
Reqbeam collection add "Health Monitoring" "Database Status"
Reqbeam collection add "Health Monitoring" "Cache Status"
Reqbeam collection add "Health Monitoring" "Queue Status"

# Run monitoring with response saving
Reqbeam run collection "Health Monitoring" --save-response

# Check history for trends
Reqbeam run history-list
```

## 🎯 Advanced Usage Patterns

### Example 11: Dynamic Request Building

```bash
# Use environment variables for dynamic URLs
Reqbeam env add dynamic -i
# Enter: BASE_URL=https://api.example.com,VERSION=v1,ENDPOINT=users,ID=123

Reqbeam request create -n "Dynamic User" -m GET -u "{{BASE_URL}}/{{VERSION}}/{{ENDPOINT}}/{{ID}}"
Reqbeam request create -n "Dynamic List" -m GET -u "{{BASE_URL}}/{{VERSION}}/{{ENDPOINT}}"
Reqbeam request create -n "Dynamic Search" -m GET -u "{{BASE_URL}}/{{VERSION}}/{{ENDPOINT}}?search={{SEARCH_TERM}}"
```

### Example 12: File Upload Testing

```bash
# Test file upload endpoints
Reqbeam request create -n "Upload Image" -m POST -u "{{API_URL}}/upload" -H "Authorization:Bearer {{TOKEN}}" -b '{"file":"base64-encoded-image-data","type":"image/jpeg"}'
Reqbeam request create -n "Upload Document" -m POST -u "{{API_URL}}/documents" -H "Authorization:Bearer {{TOKEN}},Content-Type:multipart/form-data" -b '{"file":"document.pdf","name":"report.pdf"}'
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

**These examples should give you a solid foundation for using Reqbeam CLI effectively!** 🎉

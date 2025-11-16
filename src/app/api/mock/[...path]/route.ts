import { NextRequest, NextResponse } from 'next/server'
import { prisma, MockServerService } from '@postmind/db'

// This route handles all HTTP methods for mock endpoints
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, 'GET', params)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, 'POST', params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, 'PUT', params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, 'PATCH', params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, 'DELETE', params)
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, 'HEAD', params)
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, 'OPTIONS', params)
}

async function handleMockRequest(
  request: NextRequest,
  method: string,
  params: Promise<{ path: string[] }>
) {
  try {
    const { path: pathArray } = await params
    
    // Path format: [mockId, ...restOfPath]
    // e.g., /api/mock/abc123/users/1 -> ['abc123', 'users', '1']
    if (pathArray.length === 0) {
      return NextResponse.json(
        { error: 'Mock server ID is required' },
        { status: 400 }
      )
    }

    const mockId = pathArray[0]
    const requestPath = pathArray.length > 1 ? '/' + pathArray.slice(1).join('/') : '/'

    // Find mock server by baseUrl using service
    const mockServerService = new MockServerService(prisma)
    const mockServer = await mockServerService.getMockServerByBaseUrl(`/api/mock/${mockId}`)

    if (!mockServer) {
      return NextResponse.json(
        { error: 'Mock server not found or not running' },
        { status: 404 }
      )
    }

    // Find matching endpoint
    // Try exact match first
    let endpoint = mockServer.endpoints.find(
      (ep) => ep.method === method && ep.path === requestPath
    )

    // If no exact match, try path parameter matching (e.g., /users/:id matches /users/123)
    if (!endpoint) {
      endpoint = mockServer.endpoints.find((ep) => {
        if (ep.method !== method) return false
        
        // Simple path parameter matching
        const patternParts = ep.path.split('/')
        const requestParts = requestPath.split('/')
        
        if (patternParts.length !== requestParts.length) return false
        
        return patternParts.every((part, index) => {
          return part === requestParts[index] || part.startsWith(':')
        })
      })
    }

    // If still no match, try wildcard or default
    if (!endpoint) {
      // Try to find a wildcard endpoint
      endpoint = mockServer.endpoints.find(
        (ep) => ep.method === method && ep.path === '*'
      )
    }

    // Apply response delay
    if (mockServer.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockServer.responseDelay))
    }

    // If no endpoint found, return default response
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found', method, path: requestPath },
        { status: mockServer.defaultStatusCode === 200 ? 404 : mockServer.defaultStatusCode }
      )
    }

    // Parse response
    let responseBody: any = {}
    let contentType = 'application/json'

    try {
      if (endpoint.response) {
        // Try to parse as JSON
        try {
          responseBody = JSON.parse(endpoint.response)
        } catch {
          // If not JSON, return as plain text
          responseBody = endpoint.response
          contentType = 'text/plain'
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error)
      responseBody = { error: 'Invalid response format' }
    }

    // Parse headers
    let responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
    }

    try {
      if (endpoint.headers) {
        const parsedHeaders = JSON.parse(endpoint.headers)
        responseHeaders = { ...responseHeaders, ...parsedHeaders }
      }
    } catch (error) {
      console.error('Error parsing headers:', error)
    }

    // Return response
    return NextResponse.json(responseBody, {
      status: endpoint.statusCode,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Error handling mock request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


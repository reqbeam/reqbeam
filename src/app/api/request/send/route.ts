import { NextRequest, NextResponse } from 'next/server'
import { EnvironmentService, HistoryService } from '@shared/index'
import { getAuthenticatedUser } from '@/lib/apiAuth'
import {
  resolveEnvironmentVariables,
  resolveHeaders,
  resolveBody,
} from '@/lib/variableResolver'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let statusCode: number | undefined
  let errorMessage: string | undefined

  // Get authenticated user (optional for history logging)
  const user = await getAuthenticatedUser(request)

  try {
    let { method, url, headers, body, bodyType, workspaceId } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Load active environment variables if user is authenticated and workspaceId provided
    let envVars: Record<string, string> = {}
    if (user && workspaceId) {
      try {
        const environmentService = new EnvironmentService()
        const activeEnv = await environmentService.getActiveEnvironment(user.id, workspaceId)
        if (activeEnv && activeEnv.variables) {
          try {
            const parsed = typeof activeEnv.variables === 'string' 
              ? JSON.parse(activeEnv.variables) 
              : activeEnv.variables
            envVars = parsed as Record<string, string>
          } catch {
            envVars = {}
          }
        }
      } catch (err) {
        console.warn('Failed to load environment variables:', err)
      }
    }

    // Resolve environment variables (if any variables exist)
    if (Object.keys(envVars).length > 0) {
      url = resolveEnvironmentVariables(url, envVars)
      headers = resolveHeaders(headers, envVars) || headers
      body = resolveBody(body, envVars)
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'User-Agent': 'Postman-Clone/1.0',
      ...(headers as Record<string, string> | undefined),
    }

    // Prepare body based on type
    let requestBody: string | FormData | URLSearchParams | undefined

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      // Convert body to string if needed (after variable resolution)
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body)

      switch (bodyType) {
        case 'json':
          requestHeaders['Content-Type'] = 'application/json'
          requestBody = bodyString
          break
        case 'form-data':
          // For form-data, we'll send as JSON for now
          // In a real implementation, you'd use FormData
          requestHeaders['Content-Type'] = 'application/json'
          requestBody = bodyString
          break
        case 'x-www-form-urlencoded':
          requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
          requestBody = bodyString
          break
        default:
          requestBody = bodyString
      }
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders as HeadersInit,
      body: requestBody,
    })

    statusCode = response.status

    // Get response data
    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    // Get response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const duration = Date.now() - startTime

    // Log to history (async, don't wait)
    if (user) {
      const historyService = new HistoryService()
      historyService.createApiHistory({
        method: method.toUpperCase(),
        url,
        statusCode,
        source: 'WEB',
        duration,
        userId: user.id,
        workspaceId: workspaceId || null,
      }).catch((err) => console.error('Failed to log history:', err))
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
    })
  } catch (error) {
    console.error('Request error:', error)
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const duration = Date.now() - startTime

    // Log error to history (async, don't wait)
    if (user) {
      const historyService = new HistoryService()
      historyService.createApiHistory({
        method: 'GET', // Default if we don't have the method
        url: 'unknown',
        statusCode,
        source: 'WEB',
        duration,
        error: errorMessage,
        userId: user.id,
        workspaceId: undefined,
      }).catch((err) => console.error('Failed to log history:', err))
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma, EnvironmentService, HistoryService } from '@postmind/db'
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
        const environmentService = new EnvironmentService(prisma)
        const environments = await environmentService.getEnvironments(user.id, { workspaceId })
        const activeEnv = environments.find(env => env.isActive)
        if (activeEnv) {
          envVars = activeEnv.variables || {}
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
      const historyService = new HistoryService(prisma)
      historyService.createApiHistory(user.id, {
        method: method.toUpperCase(),
        url,
        statusCode: statusCode ?? undefined,
        source: 'WEB',
        duration,
        workspaceId: workspaceId ?? undefined,
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
      const historyService = new HistoryService(prisma)
      historyService.createApiHistory(user.id, {
        method: 'GET', // Default if we don't have the method
        url: 'unknown',
        statusCode: statusCode ?? undefined,
        source: 'WEB',
        duration,
        error: errorMessage,
        workspaceId: undefined,
      }).catch((err) => console.error('Failed to log history:', err))
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


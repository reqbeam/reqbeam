import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let statusCode: number | undefined
  let errorMessage: string | undefined

  try {
    const { method, url, headers, body, bodyType } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Prepare headers
    const requestHeaders: HeadersInit = {
      'User-Agent': 'Postman-Clone/1.0',
      ...headers,
    }

    // Prepare body based on type
    let requestBody: string | FormData | URLSearchParams | undefined

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      switch (bodyType) {
        case 'json':
          requestHeaders['Content-Type'] = 'application/json'
          requestBody = body
          break
        case 'form-data':
          // For form-data, we'll send as JSON for now
          // In a real implementation, you'd use FormData
          requestHeaders['Content-Type'] = 'application/json'
          requestBody = body
          break
        case 'x-www-form-urlencoded':
          requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
          requestBody = body
          break
        default:
          requestBody = body
      }
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
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
    prisma.apiHistory.create({
      data: {
        method: method.toUpperCase(),
        url,
        statusCode,
        source: 'WEB',
        duration,
      },
    }).catch((err) => console.error('Failed to log history:', err))

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
    prisma.apiHistory.create({
      data: {
        method: 'GET', // Default if we don't have the method
        url: 'unknown',
        statusCode,
        source: 'WEB',
        duration,
        error: errorMessage,
      },
    }).catch((err) => console.error('Failed to log history:', err))

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


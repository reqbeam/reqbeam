import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
    })
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


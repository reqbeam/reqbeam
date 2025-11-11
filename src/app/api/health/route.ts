import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker and monitoring
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Postmind API is running',
    timestamp: new Date().toISOString(),
  })
}


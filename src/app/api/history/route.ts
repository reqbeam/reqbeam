import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/history - Fetch all history entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') // Optional filter: "CLI" or "WEB"
    const limit = parseInt(searchParams.get('limit') || '100')

    const where = source ? { source } : {}

    const history = await prisma.apiHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

// POST /api/history - Add a new history entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, url, statusCode, source, duration, error } = body

    // Validate required fields
    if (!method || !url || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: method, url, source' },
        { status: 400 }
      )
    }

    // Validate source
    if (!['CLI', 'WEB'].includes(source)) {
      return NextResponse.json(
        { error: 'Source must be either "CLI" or "WEB"' },
        { status: 400 }
      )
    }

    // Create history entry
    const historyEntry = await prisma.apiHistory.create({
      data: {
        method: method.toUpperCase(),
        url,
        statusCode: statusCode || null,
        source,
        duration: duration || null,
        error: error || null,
      },
    })

    return NextResponse.json(historyEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating history entry:', error)
    return NextResponse.json(
      { error: 'Failed to create history entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/history - Clear all history
export async function DELETE(request: NextRequest) {
  try {
    await prisma.apiHistory.deleteMany({})
    return NextResponse.json({ message: 'History cleared successfully' })
  } catch (error) {
    console.error('Error clearing history:', error)
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    )
  }
}


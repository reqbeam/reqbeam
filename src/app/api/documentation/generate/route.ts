import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { collectionId, format } = await request.json()

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      )
    }

    // Fetch collection with requests
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.user.id,
      },
      include: {
        requests: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    let documentation: string

    if (format === 'markdown') {
      documentation = generateMarkdownDoc(collection)
    } else {
      documentation = generateJsonDoc(collection)
    }

    return NextResponse.json({ documentation })
  } catch (error) {
    console.error('Error generating documentation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateMarkdownDoc(collection: any): string {
  let doc = `# ${collection.name}\n\n`
  
  if (collection.description) {
    doc += `${collection.description}\n\n`
  }

  doc += `## Overview\n\n`
  doc += `This collection contains ${collection.requests.length} API requests.\n\n`

  doc += `## Requests\n\n`

  collection.requests.forEach((request: any, index: number) => {
    doc += `### ${index + 1}. ${request.name}\n\n`
    doc += `**Method:** \`${request.method}\`\n\n`
    doc += `**URL:** \`${request.url}\`\n\n`

    if (request.headers && Object.keys(request.headers).length > 0) {
      doc += `**Headers:**\n\n`
      doc += `| Header | Value |\n`
      doc += `|--------|-------|\n`
      Object.entries(request.headers).forEach(([key, value]) => {
        doc += `| ${key} | ${value} |\n`
      })
      doc += `\n`
    }

    if (request.body) {
      doc += `**Body:**\n\n`
      doc += `\`\`\`${request.bodyType || 'json'}\n`
      doc += `${request.body}\n`
      doc += `\`\`\`\n\n`
    }

    doc += `---\n\n`
  })

  doc += `## Generated on ${new Date().toLocaleDateString()}\n`

  return doc
}

function generateJsonDoc(collection: any): string {
  const doc = {
    collection: {
      name: collection.name,
      description: collection.description,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      requests: collection.requests.map((request: any) => ({
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers || {},
        body: request.body || '',
        bodyType: request.bodyType || 'json',
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
    },
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
  }

  return JSON.stringify(doc, null, 2)
}



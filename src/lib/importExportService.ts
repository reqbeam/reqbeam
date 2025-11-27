import yaml from 'js-yaml'
import { v4 as uuidv4 } from 'uuid'
import { parseOpenAPISpec, ParsedRequest } from './openApiParser'

export interface ReqbeamCollection {
  name: string
  description?: string
  requests: ReqbeamRequest[]
}

export interface ReqbeamRequest {
  name: string
  method: string
  url: string
  headers?: Record<string, string> | string
  body?: string
  bodyType?: string
  auth?: Record<string, any> | string
  description?: string
}

export interface ExternalCollectionFormat {
  info: {
    name: string
    description?: string
    schema: string
  }
  item: ExternalCollectionItem[]
}

export interface ExternalCollectionItem {
  name: string
  request?: {
    method: string
    header?: Array<{ key: string; value: string }>
    url?: {
      raw?: string
      host?: string[]
      path?: string[]
    }
    body?: {
      mode: string
      raw?: string
      formdata?: Array<{ key: string; value: string }>
      urlencoded?: Array<{ key: string; value: string }>
    }
    auth?: any
    description?: string
  }
  item?: ExternalCollectionItem[]
}

/**
 * Detect file format from content
 */
export function detectFileFormat(fileContent: string, fileName: string): 'reqbeam' | 'external' | 'openapi' {
  try {
    const data = JSON.parse(fileContent)

    // Check for external collection format (detects collection schema patterns)
    if (data.info && data.info.schema && (data.info.schema.includes('collection/v') || (typeof data.info.schema === 'string' && data.info.schema.match(/collection\/v\d+\.\d+/)))) {
      return 'external'
    }

    // Check for OpenAPI format
    if (data.openapi || data.swagger) {
      return 'openapi'
    }

    // Check for Reqbeam format (has name and requests array)
    if (data.name && Array.isArray(data.requests)) {
      return 'reqbeam'
    }

    // Default to Reqbeam if structure matches
    return 'reqbeam'
  } catch {
    // If JSON parsing fails, try YAML
    try {
      const data = yaml.load(fileContent) as any
      if (data.openapi || data.swagger) {
        return 'openapi'
      }
      if (data.name && Array.isArray(data.requests)) {
        return 'reqbeam'
      }
    } catch {
      // If both fail, check file extension
      if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        return 'openapi'
      }
      return 'reqbeam'
    }
  }
  return 'reqbeam'
}

/**
 * Normalize collection data from various formats to Reqbeam format
 */
export function normalizeCollection(
  fileContent: string,
  fileType: 'json' | 'yaml',
  fileName: string
): ReqbeamCollection {
  const format = detectFileFormat(fileContent, fileName)

  let data: any
  try {
    if (fileType === 'yaml') {
      data = yaml.load(fileContent)
    } else {
      data = JSON.parse(fileContent)
    }
  } catch (error) {
    throw new Error(`Failed to parse file: ${error}`)
  }

  switch (format) {
    case 'reqbeam':
      return normalizeReqbeamCollection(data)
    case 'external':
      return normalizeExternalCollection(data)
    case 'openapi':
      return normalizeOpenAPICollection(data, fileContent, fileType)
    default:
      throw new Error('Unsupported collection format')
  }
}

/**
 * Normalize Reqbeam collection format
 */
function normalizeReqbeamCollection(data: any): ReqbeamCollection {
  return {
    name: data.name || 'Imported Collection',
    description: data.description,
    requests: (data.requests || []).map((req: any) => ({
      name: req.name || 'Untitled Request',
      method: req.method || 'GET',
      url: req.url || '',
      headers: req.headers,
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}),
      bodyType: req.bodyType || 'json',
      auth: req.auth,
      description: req.description
    }))
  }
}

/**
 * Normalize external collection format (v2.1 compatible)
 */
function normalizeExternalCollection(data: ExternalCollectionFormat): ReqbeamCollection {
  const requests: ReqbeamRequest[] = []

  function processItem(item: ExternalCollectionItem, parentName?: string): void {
    if (item.request) {
      // It's a request
      const request = item.request
      const method = request.method || 'GET'

      // Build URL
      let url = ''
      if (request.url) {
        if (typeof request.url === 'string') {
          url = request.url
        } else if (request.url.raw) {
          url = request.url.raw
        } else {
          const host = request.url.host?.join('.') || ''
          const path = request.url.path?.join('/') || ''
          url = `${host ? 'https://' + host : ''}${path ? '/' + path : ''}`
        }
      }

      // Build headers
      const headers: Record<string, string> = {}
      if (request.header) {
        for (const header of request.header) {
          if (header.key) {
            headers[header.key] = header.value || ''
          }
        }
      }

      // Build body
      let body: string | undefined
      let bodyType: string = 'json'
      if (request.body) {
        if (request.body.mode === 'raw') {
          body = request.body.raw || ''
          bodyType = 'json'
        } else if (request.body.mode === 'formdata' && request.body.formdata) {
          bodyType = 'form-data'
          body = JSON.stringify(request.body.formdata.reduce((acc: Record<string, string>, item: any) => {
            if (item.key) acc[item.key] = item.value || ''
            return acc
          }, {}))
        } else if (request.body.mode === 'urlencoded' && request.body.urlencoded) {
          bodyType = 'x-www-form-urlencoded'
          body = JSON.stringify(request.body.urlencoded.reduce((acc: Record<string, string>, item: any) => {
            if (item.key) acc[item.key] = item.value || ''
            return acc
          }, {}))
        }
      }

      requests.push({
        name: item.name || `${method} ${url}`,
        method,
        url,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body,
        bodyType,
        auth: request.auth,
        description: request.description
      })
    } else if (item.item) {
      // It's a folder, recursively process items
      for (const subItem of item.item) {
        processItem(subItem, item.name)
      }
    }
  }

  // Process all items
  if (data.item) {
    for (const item of data.item) {
      processItem(item)
    }
  }

  return {
    name: data.info?.name || 'Imported Collection',
    description: data.info?.description,
    requests
  }
}

/**
 * Normalize OpenAPI spec to Reqbeam collection
 */
function normalizeOpenAPICollection(
  data: any,
  fileContent: string,
  fileType: 'json' | 'yaml'
): ReqbeamCollection {
  const requests = parseOpenAPISpec(fileContent, fileType)

  return {
    name: data.info?.title || 'Imported OpenAPI Collection',
    description: data.info?.description,
    requests
  }
}

/**
 * Export collection to JSON or YAML
 */
export function exportCollection(
  collection: ReqbeamCollection,
  format: 'json' | 'yaml'
): string {
  const exportData = {
    name: collection.name,
    description: collection.description,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    requests: collection.requests.map(req => ({
      name: req.name,
      method: req.method,
      url: req.url,
      headers: typeof req.headers === 'string' ? JSON.parse(req.headers) : req.headers,
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      bodyType: req.bodyType || 'json',
      auth: typeof req.auth === 'string' ? JSON.parse(req.auth) : req.auth,
      description: req.description
    }))
  }

  if (format === 'yaml') {
    return yaml.dump(exportData, { indent: 2 })
  } else {
    return JSON.stringify(exportData, null, 2)
  }
}

/**
 * Generate new IDs for imported items to avoid collisions
 */
export function generateNewId(): string {
  return uuidv4()
}


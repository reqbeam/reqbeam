import yaml from 'js-yaml'

export interface OpenAPIPath {
  [method: string]: {
    summary?: string
    description?: string
    parameters?: Array<{
      name: string
      in: string
      required?: boolean
      schema?: any
    }>
    requestBody?: {
      content?: {
        [contentType: string]: {
          schema?: any
        }
      }
    }
    responses?: {
      [statusCode: string]: {
        content?: {
          [contentType: string]: {
            schema?: any
          }
        }
      }
    }
  }
}

export interface OpenAPISpec {
  openapi?: string
  swagger?: string
  info?: {
    title?: string
    description?: string
    version?: string
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  paths?: {
    [path: string]: OpenAPIPath
  }
}

export interface ParsedRequest {
  name: string
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
  bodyType?: string
  description?: string
}

/**
 * Parse OpenAPI spec (JSON or YAML) and convert to Postmind requests
 */
export function parseOpenAPISpec(fileContent: string, fileType: 'json' | 'yaml'): ParsedRequest[] {
  let spec: OpenAPISpec

  try {
    if (fileType === 'yaml') {
      spec = yaml.load(fileContent) as OpenAPISpec
    } else {
      spec = JSON.parse(fileContent) as OpenAPISpec
    }
  } catch (error) {
    throw new Error(`Failed to parse ${fileType.toUpperCase()} file: ${error}`)
  }

  if (!spec.paths) {
    throw new Error('Invalid OpenAPI spec: missing paths')
  }

  const baseUrl = spec.servers?.[0]?.url || ''
  const requests: ParsedRequest[] = []

  // Map HTTP methods
  const methodMap: Record<string, string> = {
    get: 'GET',
    post: 'POST',
    put: 'PUT',
    delete: 'DELETE',
    patch: 'PATCH',
    head: 'HEAD',
    options: 'OPTIONS'
  }

  // Iterate through all paths
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue

    // Iterate through all methods in the path
    for (const [method, operation] of Object.entries(pathItem)) {
      const httpMethod = methodMap[method.toLowerCase()]
      if (!httpMethod || !operation) continue

      // Build full URL
      const fullUrl = baseUrl + path

      // Generate request name
      const requestName = operation.summary || 
                         operation.description ||
                         `${httpMethod} ${path}` ||
                         `${httpMethod} ${path.replace(/[^a-zA-Z0-9]/g, ' ')}`

      // Extract request body if available
      let body: string | undefined
      let bodyType: string = 'json'

      if (operation.requestBody?.content) {
        const contentType = Object.keys(operation.requestBody.content)[0] || 'application/json'
        
        if (contentType.includes('json')) {
          bodyType = 'json'
          // Generate example body from schema if available
          const schema = operation.requestBody.content[contentType]?.schema
          if (schema) {
            body = generateExampleFromSchema(schema)
          } else {
            body = '{}'
          }
        } else if (contentType.includes('form-data') || contentType.includes('multipart')) {
          bodyType = 'form-data'
          body = ''
        } else if (contentType.includes('x-www-form-urlencoded')) {
          bodyType = 'x-www-form-urlencoded'
          body = ''
        }
      }

      // Extract headers
      const headers: Record<string, string> = {}
      if (operation.parameters) {
        for (const param of operation.parameters) {
          if (param.in === 'header' && param.name) {
            headers[param.name] = param.required ? '{{value}}' : ''
          }
        }
      }

      requests.push({
        name: requestName,
        method: httpMethod,
        url: fullUrl,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body,
        bodyType,
        description: operation.description
      })
    }
  }

  return requests
}

/**
 * Generate example JSON from JSON schema
 */
function generateExampleFromSchema(schema: any): string {
  if (!schema) return '{}'

  // Handle different schema types
  if (schema.type === 'object' && schema.properties) {
    const example: Record<string, any> = {}
    for (const [key, value] of Object.entries(schema.properties as Record<string, any>)) {
      example[key] = generateValueFromSchema(value as any)
    }
    return JSON.stringify(example, null, 2)
  }

  if (schema.type === 'array' && schema.items) {
    return JSON.stringify([generateValueFromSchema(schema.items)], null, 2)
  }

  return generateValueFromSchema(schema)
}

/**
 * Generate example value from schema property
 */
function generateValueFromSchema(schema: any): any {
  if (!schema) return null

  if (schema.example !== undefined) {
    return schema.example
  }

  if (schema.default !== undefined) {
    return schema.default
  }

  switch (schema.type) {
    case 'string':
      return schema.enum ? schema.enum[0] : 'string'
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'array':
      return schema.items ? [generateValueFromSchema(schema.items)] : []
    case 'object':
      if (schema.properties) {
        const obj: Record<string, any> = {}
        for (const [key, value] of Object.entries(schema.properties as Record<string, any>)) {
          obj[key] = generateValueFromSchema(value as any)
        }
        return obj
      }
      return {}
    default:
      return null
  }
}


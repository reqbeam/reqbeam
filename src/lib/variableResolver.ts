/**
 * Resolves environment variables in a template string
 * Replaces {{variableName}} with corresponding values from variables object
 * 
 * @param template - String containing variable placeholders like {{baseUrl}}
 * @param variables - Object mapping variable names to their values
 * @returns String with variables replaced, or empty string if variable not found
 * 
 * @example
 * resolveEnvironmentVariables('{{baseUrl}}/users', { baseUrl: 'https://api.dev.com' })
 * // Returns: 'https://api.dev.com/users'
 */
export function resolveEnvironmentVariables(
  template: string,
  variables: Record<string, string>
): string {
  if (!template || typeof template !== 'string') {
    return template
  }

  if (!variables || Object.keys(variables).length === 0) {
    return template
  }

  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmedKey = key.trim()
    return variables[trimmedKey] ?? `{{${key}}}`
  })
}

/**
 * Resolves environment variables in request headers
 * 
 * @param headers - Headers object with potential variable placeholders
 * @param variables - Environment variables object
 * @returns Headers object with variables resolved
 */
export function resolveHeaders(
  headers: Record<string, string> | undefined,
  variables: Record<string, string>
): Record<string, string> | undefined {
  if (!headers || Object.keys(headers).length === 0) {
    return headers
  }

  const resolved: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (key && value != null && value !== '') {
      resolved[key] = resolveEnvironmentVariables(String(value), variables)
    }
  }
  return resolved
}

/**
 * Resolves environment variables in request body
 * Handles both string and JSON string bodies
 * 
 * @param body - Request body (string, object, or undefined)
 * @param variables - Environment variables object
 * @returns Body with variables resolved
 */
export function resolveBody(
  body: unknown,
  variables: Record<string, string>
): unknown {
  if (!body) {
    return body
  }

  if (typeof body === 'string') {
    // Check if it's JSON and try to resolve variables within JSON strings
    try {
      const parsed = JSON.parse(body)
      if (typeof parsed === 'object' && parsed !== null) {
        // Recursively resolve variables in object values
        const resolved = resolveObjectVariables(parsed, variables)
        return JSON.stringify(resolved)
      }
    } catch {
      // Not JSON, treat as plain string
    }
    return resolveEnvironmentVariables(body, variables)
  }

  if (typeof body === 'object' && body !== null) {
    return resolveObjectVariables(body, variables)
  }

  return body
}

/**
 * Recursively resolves variables in object values
 */
function resolveObjectVariables(
  obj: any,
  variables: Record<string, string>
): any {
  if (typeof obj === 'string') {
    return resolveEnvironmentVariables(obj, variables)
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveObjectVariables(item, variables))
  }

  if (typeof obj === 'object' && obj !== null) {
    const resolved: any = {}
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveObjectVariables(value, variables)
    }
    return resolved
  }

  return obj
}


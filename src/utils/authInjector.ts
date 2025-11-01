/**
 * Auth Injector - Injects authorization headers/params into requests
 */

import type { AuthConfig } from '@/types/auth'

export class AuthInjector {
  /**
   * Inject auth configuration into request headers and/or URL
   */
  static injectAuth(
    auth: AuthConfig | null | undefined,
    headers: Record<string, string> = {},
    url: string = ''
  ): { headers: Record<string, string>; url: string } {
    if (!auth || auth.type === 'no-auth') {
      return { headers, url }
    }

    const resultHeaders = { ...headers }
    let resultUrl = url

    switch (auth.type) {
      case 'api-key': {
        if (auth.addTo === 'header') {
          const headerKey = auth.headerKey || 'X-API-Key'
          resultHeaders[headerKey] = auth.value
        } else if (auth.addTo === 'query-params') {
          const urlObj = new URL(url)
          urlObj.searchParams.set(auth.key, auth.value)
          resultUrl = urlObj.toString()
        }
        break
      }

      case 'bearer-token': {
        resultHeaders['Authorization'] = `Bearer ${auth.token}`
        break
      }

      case 'basic-auth': {
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
        resultHeaders['Authorization'] = `Basic ${credentials}`
        break
      }

      case 'oauth2': {
        const tokenType = auth.tokenType || 'Bearer'
        resultHeaders['Authorization'] = `${tokenType} ${auth.accessToken}`
        break
      }
    }

    return { headers: resultHeaders, url: resultUrl }
  }

  /**
   * Extract auth from headers (reverse operation for debugging)
   */
  static extractAuthFromHeaders(headers: Record<string, string>): Partial<AuthConfig> | null {
    const authHeader = headers['Authorization'] || headers['authorization']
    
    if (!authHeader) {
      // Check for common API key headers
      const apiKeyHeaders = ['X-API-Key', 'X-Api-Key', 'Api-Key', 'API-Key']
      for (const key of apiKeyHeaders) {
        if (headers[key]) {
          return {
            type: 'api-key',
            key: key,
            value: headers[key],
            addTo: 'header',
            headerKey: key,
          }
        }
      }
      return null
    }

    if (authHeader.startsWith('Bearer ')) {
      return {
        type: 'bearer-token',
        token: authHeader.substring(7),
      }
    }

    if (authHeader.startsWith('Basic ')) {
      try {
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8')
        const [username, password] = credentials.split(':')
        return {
          type: 'basic-auth',
          username,
          password,
        }
      } catch {
        return null
      }
    }

    return null
  }
}


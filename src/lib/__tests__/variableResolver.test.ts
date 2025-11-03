/**
 * Unit tests for variable resolver
 * Run with: npm test variableResolver
 */

import {
  resolveEnvironmentVariables,
  resolveHeaders,
  resolveBody,
} from '../variableResolver'

describe('resolveEnvironmentVariables', () => {
  const variables = {
    baseUrl: 'https://api.dev.com',
    token: '123xyz',
    apiKey: 'abc-456',
  }

  test('replaces single variable in URL', () => {
    const result = resolveEnvironmentVariables('{{baseUrl}}/users', variables)
    expect(result).toBe('https://api.dev.com/users')
  })

  test('replaces multiple variables', () => {
    const result = resolveEnvironmentVariables(
      '{{baseUrl}}/users?token={{token}}',
      variables
    )
    expect(result).toBe('https://api.dev.com/users?token=123xyz')
  })

  test('handles variables with whitespace', () => {
    const result = resolveEnvironmentVariables('{{ baseUrl }}/users', variables)
    expect(result).toBe('https://api.dev.com/users')
  })

  test('leaves unknown variables unchanged', () => {
    const result = resolveEnvironmentVariables('{{unknownVar}}/users', variables)
    expect(result).toBe('{{unknownVar}}/users')
  })

  test('handles empty string', () => {
    const result = resolveEnvironmentVariables('', variables)
    expect(result).toBe('')
  })

  test('handles string without variables', () => {
    const result = resolveEnvironmentVariables('https://api.com/users', variables)
    expect(result).toBe('https://api.com/users')
  })
})

describe('resolveHeaders', () => {
  const variables = {
    token: 'Bearer 123xyz',
    apiKey: 'abc-456',
  }

  test('replaces variables in header values', () => {
    const headers = {
      Authorization: '{{token}}',
      'X-API-Key': '{{apiKey}}',
    }
    const result = resolveHeaders(headers, variables)
    expect(result).toEqual({
      Authorization: 'Bearer 123xyz',
      'X-API-Key': 'abc-456',
    })
  })

  test('handles undefined headers', () => {
    const result = resolveHeaders(undefined, variables)
    expect(result).toBeUndefined()
  })

  test('handles empty headers object', () => {
    const result = resolveHeaders({}, variables)
    expect(result).toEqual({})
  })
})

describe('resolveBody', () => {
  const variables = {
    userId: '123',
    name: 'John Doe',
  }

  test('replaces variables in JSON string', () => {
    const body = '{"id": "{{userId}}", "name": "{{name}}"}'
    const result = resolveBody(body, variables)
    expect(result).toBe('{"id":"123","name":"John Doe"}')
  })

  test('replaces variables in plain string', () => {
    const body = 'User ID: {{userId}}, Name: {{name}}'
    const result = resolveBody(body, variables)
    expect(result).toBe('User ID: 123, Name: John Doe')
  })

  test('handles undefined body', () => {
    const result = resolveBody(undefined, variables)
    expect(result).toBeUndefined()
  })
})


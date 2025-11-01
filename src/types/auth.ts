/**
 * Authorization Types and Interfaces
 */

export type AuthType = 'no-auth' | 'api-key' | 'bearer-token' | 'basic-auth' | 'oauth2'

export interface BaseAuthConfig {
  type: AuthType
}

export interface NoAuthConfig extends BaseAuthConfig {
  type: 'no-auth'
}

export interface ApiKeyAuthConfig extends BaseAuthConfig {
  type: 'api-key'
  key: string
  value: string
  addTo: 'header' | 'query-params'
  headerKey?: string // Custom header key (default: 'X-API-Key')
}

export interface BearerTokenAuthConfig extends BaseAuthConfig {
  type: 'bearer-token'
  token: string
}

export interface BasicAuthConfig extends BaseAuthConfig {
  type: 'basic-auth'
  username: string
  password: string
}

export interface OAuth2AuthConfig extends BaseAuthConfig {
  type: 'oauth2'
  accessToken: string
  tokenType?: string // Usually 'Bearer', defaults to 'Bearer'
}

export type AuthConfig =
  | NoAuthConfig
  | ApiKeyAuthConfig
  | BearerTokenAuthConfig
  | BasicAuthConfig
  | OAuth2AuthConfig

export interface AuthProfile {
  id: string
  name: string
  auth: AuthConfig
  createdAt: string
  updatedAt: string
}


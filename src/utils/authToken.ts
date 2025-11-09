/**
 * Utility functions for managing auth server JWT tokens in localStorage
 */

export interface AuthUser {
  id: string
  email: string
  name: string | null
}

/**
 * Store auth token and user data in localStorage
 */
export function storeAuthToken(token: string, user: AuthUser, expiresAt?: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token)
    localStorage.setItem('authUser', JSON.stringify(user))
    if (expiresAt) {
      localStorage.setItem('authTokenExpiresAt', expiresAt)
    }
  }
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken')
  }
  return null
}

/**
 * Get auth user from localStorage
 */
export function getAuthUser(): AuthUser | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('authUser')
    if (userStr) {
      try {
        return JSON.parse(userStr) as AuthUser
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * Get token expiration date
 */
export function getTokenExpiresAt(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authTokenExpiresAt')
  }
  return null
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiresAt = getTokenExpiresAt()
  if (!expiresAt) return true
  
  try {
    const expiryDate = new Date(expiresAt)
    return expiryDate < new Date()
  } catch {
    return true
  }
}

/**
 * Clear auth token and user data from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('authTokenExpiresAt')
  }
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken()
  if (!token) return false
  return !isTokenExpired()
}


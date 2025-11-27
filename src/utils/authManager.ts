/**
 * Auth Manager - Handles storage and retrieval of auth configurations
 * Supports both web (IndexedDB/localStorage) and secure storage
 */

import type { AuthConfig, AuthProfile } from '@/types/auth'

/**
 * Simple encoding (Base64 + obfuscation) - NOT SECURE, just prevents casual viewing
 * In production, use proper encryption with user-specific keys
 */
export class AuthManager {
  private static instance: AuthManager
  private storageKey = 'reqbeam-auth-profiles'

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  /**
   * Simple encoding - obfuscates sensitive data (NOT true encryption)
   * In production, use Web Crypto API or server-side encryption
   */
  private encode(data: string): string {
    // Simple base64 with slight obfuscation
    const encoded = btoa(unescape(encodeURIComponent(data)))
    // Reverse and add prefix to make it less obvious
    return 'pm_' + encoded.split('').reverse().join('')
  }

  /**
   * Decode obfuscated data
   */
  private decode(encodedData: string): string {
    try {
      if (!encodedData.startsWith('pm_')) {
        // Legacy format or unencoded
        return encodedData
      }
      const cleaned = encodedData.substring(3).split('').reverse().join('')
      return decodeURIComponent(escape(atob(cleaned)))
    } catch {
      // If decoding fails, return as-is (might be plain text from older versions)
      return encodedData
    }
  }

  /**
   * Get all auth profiles
   */
  async getProfiles(): Promise<AuthProfile[]> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []

      const profiles = JSON.parse(stored) as AuthProfile[]
      // Decrypt sensitive fields
      return profiles.map(profile => this.decryptProfile(profile))
    } catch (error) {
      console.error('Error loading auth profiles:', error)
      return []
    }
  }

  /**
   * Save auth profile
   */
  async saveProfile(profile: Omit<AuthProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuthProfile> {
    const profiles = await this.getProfiles()
    const newProfile: AuthProfile = {
      ...profile,
      id: `auth-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Encrypt sensitive fields before saving
    const encrypted = this.encryptProfile(newProfile)
    profiles.push(encrypted)

    localStorage.setItem(this.storageKey, JSON.stringify(profiles))
    return newProfile
  }

  /**
   * Update auth profile
   */
  async updateProfile(id: string, updates: Partial<Omit<AuthProfile, 'id' | 'createdAt'>>): Promise<AuthProfile | null> {
    const profiles = await this.getProfiles()
    const index = profiles.findIndex(p => p.id === id)
    
    if (index === -1) return null

    const updated: AuthProfile = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const encrypted = this.encryptProfile(updated)
    profiles[index] = encrypted

    localStorage.setItem(this.storageKey, JSON.stringify(profiles))
    return updated
  }

  /**
   * Delete auth profile
   */
  async deleteProfile(id: string): Promise<boolean> {
    const profiles = await this.getProfiles()
    const filtered = profiles.filter(p => p.id !== id)
    
    if (filtered.length === profiles.length) return false

    const encrypted = filtered.map(p => this.encryptProfile(p))
    localStorage.setItem(this.storageKey, JSON.stringify(encrypted))
    return true
  }

  /**
   * Encrypt sensitive fields in auth config
   */
  private encryptProfile(profile: AuthProfile): AuthProfile {
    const encrypted = { ...profile }
    
    if (encrypted.auth.type === 'bearer-token') {
      encrypted.auth = {
        ...encrypted.auth,
        token: this.encode(encrypted.auth.token),
      }
    } else if (encrypted.auth.type === 'basic-auth') {
      encrypted.auth = {
        ...encrypted.auth,
        username: this.encode(encrypted.auth.username),
        password: this.encode(encrypted.auth.password),
      }
    } else if (encrypted.auth.type === 'api-key') {
      encrypted.auth = {
        ...encrypted.auth,
        value: this.encode(encrypted.auth.value),
      }
    } else if (encrypted.auth.type === 'oauth2') {
      encrypted.auth = {
        ...encrypted.auth,
        accessToken: this.encode(encrypted.auth.accessToken),
      }
    }

    return encrypted
  }

  /**
   * Decrypt sensitive fields in auth config
   */
  private decryptProfile(profile: AuthProfile): AuthProfile {
    const decrypted = { ...profile }
    
    if (decrypted.auth.type === 'bearer-token') {
      decrypted.auth = {
        ...decrypted.auth,
        token: this.decode(decrypted.auth.token),
      }
    } else if (decrypted.auth.type === 'basic-auth') {
      decrypted.auth = {
        ...decrypted.auth,
        username: this.decode(decrypted.auth.username),
        password: this.decode(decrypted.auth.password),
      }
    } else if (decrypted.auth.type === 'api-key') {
      decrypted.auth = {
        ...decrypted.auth,
        value: this.decode(decrypted.auth.value),
      }
    } else if (decrypted.auth.type === 'oauth2') {
      decrypted.auth = {
        ...decrypted.auth,
        accessToken: this.decode(decrypted.auth.accessToken),
      }
    }

    return decrypted
  }
}


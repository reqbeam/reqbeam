'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AuthConfig } from '@/types/auth'

interface AuthorizationTabProps {
  auth: AuthConfig | null | undefined
  onChange: (auth: AuthConfig | null) => void
}

// Helper to compare auth configs
function authConfigEqual(a: AuthConfig | null, b: AuthConfig | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.type !== b.type) return false
  
  switch (a.type) {
    case 'api-key':
      return a.key === (b as any).key && a.value === (b as any).value && a.addTo === (b as any).addTo && a.headerKey === (b as any).headerKey
    case 'bearer-token':
      return a.token === (b as any).token
    case 'basic-auth':
      return a.username === (b as any).username && a.password === (b as any).password
    case 'oauth2':
      return a.accessToken === (b as any).accessToken && a.tokenType === (b as any).tokenType
    default:
      return true
  }
}

export default function AuthorizationTab({ auth, onChange }: AuthorizationTabProps) {
  const [authType, setAuthType] = useState<AuthConfig['type']>(auth?.type || 'no-auth')
  const [apiKey, setApiKey] = useState('')
  const [apiValue, setApiValue] = useState('')
  const [apiAddTo, setApiAddTo] = useState<'header' | 'query-params'>('header')
  const [apiHeaderKey, setApiHeaderKey] = useState('X-API-Key')
  const [bearerToken, setBearerToken] = useState('')
  const [basicUsername, setBasicUsername] = useState('')
  const [basicPassword, setBasicPassword] = useState('')
  const [oauthToken, setOauthToken] = useState('')
  const [oauthTokenType, setOauthTokenType] = useState('Bearer')
  
  // Track the last computed auth to prevent unnecessary updates
  const lastComputedAuthRef = useRef<AuthConfig | null>(null)
  const isUpdatingFromProp = useRef(false)
  const onChangeRef = useRef(onChange)

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Load existing auth config when component mounts or auth changes externally
  useEffect(() => {
    // Only update from prop if it's different from what we computed
    const currentComputed = lastComputedAuthRef.current
    if (!authConfigEqual(currentComputed, auth || null)) {
      isUpdatingFromProp.current = true
      
      // Update the ref immediately so comparisons work correctly
      lastComputedAuthRef.current = auth || null
      
      if (auth) {
        setAuthType(auth.type)
        if (auth.type === 'api-key') {
          setApiKey(auth.key)
          setApiValue(auth.value)
          setApiAddTo(auth.addTo)
          setApiHeaderKey(auth.headerKey || 'X-API-Key')
        } else if (auth.type === 'bearer-token') {
          setBearerToken(auth.token)
        } else if (auth.type === 'basic-auth') {
          setBasicUsername(auth.username)
          setBasicPassword(auth.password)
        } else if (auth.type === 'oauth2') {
          setOauthToken(auth.accessToken)
          setOauthTokenType(auth.tokenType || 'Bearer')
        }
      } else {
        setAuthType('no-auth')
        // Clear all fields
        setApiKey('')
        setApiValue('')
        setBearerToken('')
        setBasicUsername('')
        setBasicPassword('')
        setOauthToken('')
      }
      
      // Reset flag after a microtask to let state updates settle
      Promise.resolve().then(() => {
        isUpdatingFromProp.current = false
      })
    }
  }, [auth])

  // Compute auth config from current state
  const computeAuth = useCallback((): AuthConfig | null => {
    if (authType === 'no-auth') {
      return null
    } else if (authType === 'api-key') {
      if (apiKey.trim() && apiValue.trim()) {
        return {
          type: 'api-key',
          key: apiKey.trim(),
          value: apiValue.trim(),
          addTo: apiAddTo,
          headerKey: apiAddTo === 'header' ? apiHeaderKey.trim() : undefined,
        }
      }
      return null
    } else if (authType === 'bearer-token') {
      if (bearerToken.trim()) {
        return {
          type: 'bearer-token',
          token: bearerToken.trim(),
        }
      }
      return null
    } else if (authType === 'basic-auth') {
      if (basicUsername.trim() && basicPassword.trim()) {
        return {
          type: 'basic-auth',
          username: basicUsername.trim(),
          password: basicPassword.trim(),
        }
      }
      return null
    } else if (authType === 'oauth2') {
      if (oauthToken.trim()) {
        return {
          type: 'oauth2',
          accessToken: oauthToken.trim(),
          tokenType: oauthTokenType.trim() || 'Bearer',
        }
      }
      return null
    }
    return null
  }, [authType, apiKey, apiValue, apiAddTo, apiHeaderKey, bearerToken, basicUsername, basicPassword, oauthToken, oauthTokenType])

  // Update parent when auth config changes (only when user makes changes)
  useEffect(() => {
    // Skip if we're updating from prop to prevent loops
    if (isUpdatingFromProp.current) return

    const newAuth = computeAuth()
    
    // Only call onChange if the auth actually changed
    if (!authConfigEqual(lastComputedAuthRef.current, newAuth)) {
      lastComputedAuthRef.current = newAuth
      onChangeRef.current(newAuth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authType, apiKey, apiValue, apiAddTo, apiHeaderKey, bearerToken, basicUsername, basicPassword, oauthToken, oauthTokenType])

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Type
        </label>
        <select
          value={authType}
          onChange={(e) => setAuthType(e.target.value as AuthConfig['type'])}
          className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-orange-500"
        >
          <option value="no-auth">No Auth</option>
          <option value="api-key">API Key</option>
          <option value="bearer-token">Bearer Token</option>
          <option value="basic-auth">Basic Auth</option>
          <option value="oauth2">OAuth 2.0</option>
        </select>
      </div>

      {authType === 'api-key' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key name"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Value
            </label>
            <input
              type="password"
              value={apiValue}
              onChange={(e) => setApiValue(e.target.value)}
              placeholder="API Key value"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add to
            </label>
            <select
              value={apiAddTo}
              onChange={(e) => setApiAddTo(e.target.value as 'header' | 'query-params')}
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-orange-500"
            >
              <option value="header">Header</option>
              <option value="query-params">Query Parameters</option>
            </select>
          </div>
          {apiAddTo === 'header' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Header Name
              </label>
              <input
                type="text"
                value={apiHeaderKey}
                onChange={(e) => setApiHeaderKey(e.target.value)}
                placeholder="X-API-Key"
                className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}
        </div>
      )}

      {authType === 'bearer-token' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Token
          </label>
          <input
            type="password"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="Enter your bearer token"
            className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          <p className="mt-2 text-xs text-gray-400">
            This will be sent as: <code className="bg-[#2a2a2a] px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code>
          </p>
        </div>
      )}

      {authType === 'basic-auth' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={basicUsername}
              onChange={(e) => setBasicUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={basicPassword}
              onChange={(e) => setBasicPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Credentials will be Base64 encoded and sent as: <code className="bg-[#2a2a2a] px-1 py-0.5 rounded">Authorization: Basic &lt;encoded&gt;</code>
          </p>
        </div>
      )}

      {authType === 'oauth2' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Token
            </label>
            <input
              type="password"
              value={oauthToken}
              onChange={(e) => setOauthToken(e.target.value)}
              placeholder="Enter OAuth 2.0 access token"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Type
            </label>
            <input
              type="text"
              value={oauthTokenType}
              onChange={(e) => setOauthTokenType(e.target.value)}
              placeholder="Bearer"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <p className="mt-2 text-xs text-gray-400">
              Usually "Bearer" for OAuth 2.0
            </p>
          </div>
        </div>
      )}

      {authType === 'no-auth' && (
        <div className="text-sm text-gray-400">
          This request will be sent without any authentication.
        </div>
      )}
    </div>
  )
}


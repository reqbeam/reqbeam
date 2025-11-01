import { create } from 'zustand'
import type { AuthConfig } from '@/types/auth'

export interface QueryParam {
  key: string
  value: string
  enabled: boolean
}

export interface RequestTab {
  id: string
  name: string
  method: string
  url: string
  params: QueryParam[]
  headers: Record<string, string>
  body: string
  bodyType: 'json' | 'form-data' | 'x-www-form-urlencoded'
  auth?: AuthConfig | null
  requestId?: string
  collectionId?: string
}

export interface Response {
  status?: number
  statusText?: string
  headers?: Record<string, string>
  data?: any
  duration?: number
  size?: number
  error?: string
}

interface RequestStore {
  // Tabs
  tabs: RequestTab[]
  activeTab: string | null
  
  // Response
  response: Response | null
  isLoading: boolean

  // Tab management
  createTab: () => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<RequestTab>) => void
  loadRequestIntoActiveTab: (requestData: Partial<RequestTab>) => void

  // Request execution
  sendRequest: (tabId: string) => Promise<void>
  setResponse: (response: Response | null) => void
  setLoading: (loading: boolean) => void
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  // Initial state
  tabs: [],
  activeTab: null,
  response: null,
  isLoading: false,

  // Tab management
  createTab: () => {
    const newTab: RequestTab = {
      id: `tab-${Date.now()}`,
      name: 'New Request',
      method: 'GET',
      url: '',
      params: [],
      headers: {},
      body: '',
      bodyType: 'json',
    }

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTab: newTab.id,
    }))
  },

  closeTab: (tabId: string) => {
    set((state) => {
      const newTabs = state.tabs.filter((tab) => tab.id !== tabId)
      const newActiveTab = 
        state.activeTab === tabId
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].id
            : null
          : state.activeTab

      return {
        tabs: newTabs,
        activeTab: newActiveTab,
      }
    })
  },

  setActiveTab: (tabId: string) => {
    set({ activeTab: tabId, response: null })
  },

  updateTab: (tabId: string, updates: Partial<RequestTab>) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }))
  },

  loadRequestIntoActiveTab: (requestData: Partial<RequestTab>) => {
    set((state) => {
      if (!state.activeTab) {
        // If no active tab, create a new one
        const newTab: RequestTab = {
          id: `tab-${Date.now()}`,
          name: 'New Request',
          method: 'GET',
          url: '',
          params: [],
          headers: {},
          body: '',
          bodyType: 'json',
          ...requestData,
        }
        return {
          tabs: [...state.tabs, newTab],
          activeTab: newTab.id,
          response: null,
        }
      } else {
        // Update the active tab with the request data
        return {
          tabs: state.tabs.map((tab) =>
            tab.id === state.activeTab ? { ...tab, ...requestData } : tab
          ),
          response: null,
        }
      }
    })
  },

  // Request execution
  sendRequest: async (tabId: string) => {
    const tab = get().tabs.find((t) => t.id === tabId)
    if (!tab) return

    set({ isLoading: true, response: null })

    try {
      const startTime = Date.now()
      
      // Get active workspace ID from localStorage or workspace store
      let workspaceId: string | null = null
      try {
        const workspaceStorage = localStorage.getItem('workspace-storage')
        if (workspaceStorage) {
          const parsed = JSON.parse(workspaceStorage)
          workspaceId = parsed.state?.activeWorkspace?.id || null
        }
      } catch (err) {
        console.error('Error reading workspace from storage:', err)
      }
      
      // Inject auth into headers and URL
      const { AuthInjector } = await import('@/utils/authInjector')
      const { headers: authHeaders, url: authUrl } = AuthInjector.injectAuth(
        tab.auth,
        tab.headers,
        tab.url
      )
      
      const response = await fetch('/api/request/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: tab.method,
          url: authUrl,
          headers: authHeaders,
          body: tab.body,
          bodyType: tab.bodyType,
          workspaceId,
        }),
      })

      const duration = Date.now() - startTime
      const responseText = await response.text()

      let parsed: any
      try {
        parsed = JSON.parse(responseText)
      } catch {
        parsed = responseText
      }

      // If our API returns a wrapper { status, statusText, headers, data }, unwrap it for the body tab
      const unwrappedData = parsed && typeof parsed === 'object' && 'data' in parsed ? (parsed as any).data : parsed

      // Prefer upstream status/headers from wrapper when available
      const effectiveStatus = parsed && typeof parsed === 'object' && 'status' in parsed ? (parsed as any).status : response.status
      const effectiveStatusText = parsed && typeof parsed === 'object' && 'statusText' in parsed ? (parsed as any).statusText : response.statusText

      const responseHeaders: Record<string, string> = {}
      if (parsed && typeof parsed === 'object' && 'headers' in parsed && parsed.headers) {
        Object.entries((parsed as any).headers as Record<string, string>).forEach(([k, v]) => {
          responseHeaders[k] = v
        })
      } else {
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })
      }

      set({
        response: {
          status: effectiveStatus,
          statusText: effectiveStatusText,
          headers: responseHeaders,
          data: unwrappedData,
          duration,
          size: responseText.length,
        },
        isLoading: false,
      })
    } catch (error) {
      set({
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        isLoading: false,
      })
    }
  },

  setResponse: (response: Response | null) => {
    set({ response })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
}))


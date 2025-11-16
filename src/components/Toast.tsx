'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  show: (message: string, options?: { type?: ToastType; title?: string; duration?: number }) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, options?: { type?: ToastType; title?: string; duration?: number }) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = {
      id,
      message,
      type: options?.type || 'info',
      title: options?.title,
      duration: options?.duration ?? 3500,
    }
    setToasts((prev) => [...prev, toast])
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration)
    }
  }, [remove])

  const api = useMemo<ToastContextValue>(() => ({
    show,
    success: (message, title) => show(message, { type: 'success', title }),
    error: (message, title) => show(message, { type: 'error', title, duration: 5000 }),
    info: (message, title) => show(message, { type: 'info', title }),
    warning: (message, title) => show(message, { type: 'warning', title }),
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast container */}
      <div className="fixed inset-0 pointer-events-none z[1000]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[92vw] max-w-md items-center">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto rounded-md p-3 transition-all 
                bg-gradient-to-b from-[#2a2a2b] to-[#1a1a1a]
                border border-orange-500/60 text-gray-100 
                shadow-[0_10px_30px_-10px_rgba(255,108,55,0.6)] ring-1 ring-orange-500/20`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full ${
                  t.type === 'error' ? 'bg-red-500' : 'bg-orange-500'
                }`} />
                <div className="flex-1">
                  {t.title && <div className="text-sm font-semibold mb-0.5 text-orange-300">{t.title}</div>}
                  <div className="text-xs text-gray-200 whitespace-pre-wrap">{t.message}</div>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="text-gray-400 hover:text-gray-200"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // During static generation, context might be null
  // Return a no-op implementation to prevent errors
  if (!ctx) {
    if (typeof window === 'undefined') {
      // Server-side/static generation - return no-op
      return {
        show: () => {},
        success: () => {},
        error: () => {},
        info: () => {},
        warning: () => {},
      }
    }
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}



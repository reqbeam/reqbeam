'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  // Initialize theme on mount
  useEffect(() => {
    const root = document.documentElement
    if (!root.classList.contains('light') && !root.classList.contains('dark')) {
      root.classList.add(theme)
    }
  }, [])

  return <>{children}</>
}


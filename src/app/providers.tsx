'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Prevent hydration issues during static generation
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During static generation, render without providers to avoid context errors
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}



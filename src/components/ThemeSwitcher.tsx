'use client'

import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useThemeStore()

  // Apply theme class when theme changes
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-700" />
      )}
    </button>
  )
}


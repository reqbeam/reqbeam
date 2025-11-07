import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: (e: KeyboardEvent) => void
  preventDefault?: boolean
}

/**
 * Hook to handle keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
        
        // Handle Ctrl/Cmd: if shortcut requires ctrlKey, accept either Ctrl (Windows/Linux) or Cmd (Mac)
        const isMac = navigator.platform.includes('Mac')
        const ctrlOrCmdPressed = isMac ? e.metaKey : e.ctrlKey
        const ctrlMatch = shortcut.ctrlKey 
          ? ctrlOrCmdPressed 
          : (!e.ctrlKey && !e.metaKey)
        
        const metaMatch = shortcut.metaKey ? e.metaKey : !e.metaKey
        const shiftMatch = shortcut.shiftKey !== undefined 
          ? (shortcut.shiftKey ? e.shiftKey : !e.shiftKey)
          : true
        const altMatch = shortcut.altKey !== undefined
          ? (shortcut.altKey ? e.altKey : !e.altKey)
          : true

        // Check if we're in an input, textarea, or contenteditable
        const target = e.target as HTMLElement
        const isInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable

        // For some shortcuts, allow them even in inputs (like Ctrl+S)
        const allowInInput = shortcut.key === 's' && shortcut.ctrlKey

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            // Only prevent default if not in input (unless explicitly allowed)
            if (!isInput || allowInInput) {
              e.preventDefault()
            }
          }
          shortcut.handler(e)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

/**
 * Format keyboard shortcut for display
 * @param shortcut Keyboard shortcut configuration
 * @returns Formatted string like "Ctrl+S" or "Cmd+Enter"
 */
export function formatShortcut(shortcut: {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}): string {
  const parts: string[] = []
  
  if (shortcut.ctrlKey) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
  }
  if (shortcut.metaKey) {
    parts.push('⌘')
  }
  if (shortcut.shiftKey) {
    parts.push('Shift')
  }
  if (shortcut.altKey) {
    parts.push('Alt')
  }
  
  // Format key
  let key = shortcut.key
  if (key === ' ') key = 'Space'
  if (key.length === 1) key = key.toUpperCase()
  
  parts.push(key)
  return parts.join('+')
}


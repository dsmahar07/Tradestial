'use client'

import { logger } from '@/lib/logger'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  mounted: boolean
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  mounted: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'tradestial-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount without localStorage (SSR-safe)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        // Prefer SSR-provided <html> class to avoid FOUC and keep consistency
        const root = document.documentElement
        const ssrClass = root.classList.contains('dark') ? 'dark' : (root.classList.contains('light') ? 'light' : undefined)
        const initial = ssrClass || defaultTheme || (prefersDark ? 'dark' : 'light')
        logger.debug('🔍 Initialized theme (no storage):', initial)
        setThemeState(initial)
      }
    } catch (error) {
      logger.warn('Failed to initialize theme', error)
    } finally {
      setMounted(true)
    }
  }, [defaultTheme])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    logger.debug('🎨 Applying theme to document:', theme)
    const root = document.documentElement
    
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    logger.debug('✅ Applied classes:', Array.from(root.classList))
  }, [theme, mounted])

  const setTheme = useCallback((newTheme: Theme) => {
    logger.debug('🔄 Theme change requested:', newTheme)
    
    try {
      // Persist selection via cookie (1 year)
      document.cookie = `theme=${newTheme}; Path=/; Max-Age=31536000; SameSite=Lax`
    } catch (error) {
      logger.warn('Failed to set theme cookie', error)
    }
    setThemeState(newTheme)
  }, [])

  const value = {
    theme,
    setTheme,
    mounted,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
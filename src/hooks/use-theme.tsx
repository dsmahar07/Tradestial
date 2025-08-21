'use client'

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

  // Load theme from storage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey)
      console.log('🔍 Loaded theme from storage:', savedTheme)
      
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme)
      }
    } catch (error) {
      console.warn('Failed to load theme:', error)
    } finally {
      setMounted(true)
    }
  }, [storageKey])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    console.log('🎨 Applying theme to document:', theme)
    const root = document.documentElement
    
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    console.log('✅ Applied classes:', Array.from(root.classList))
  }, [theme, mounted])

  const setTheme = useCallback((newTheme: Theme) => {
    console.log('🔄 Theme change requested:', newTheme)
    
    try {
      localStorage.setItem(storageKey, newTheme)
      console.log('💾 Saved theme to storage')
    } catch (error) {
      console.warn('Failed to save theme:', error)
    }
    
    setThemeState(newTheme)
  }, [storageKey])

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
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface PrivacyContextType {
  isPrivacyMode: boolean
  setPrivacyMode: (enabled: boolean) => void
  displayFormat: string
  setDisplayFormat: (format: string) => void
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [displayFormat, setDisplayFormat] = useState('dollar')

  // Load privacy mode from localStorage on mount
  useEffect(() => {
    const savedPrivacyMode = localStorage.getItem('tradestial-privacy-mode')
    const savedDisplayFormat = localStorage.getItem('tradestial-display-format')
    
    if (savedPrivacyMode) {
      setIsPrivacyMode(savedPrivacyMode === 'true')
    }
    if (savedDisplayFormat) {
      setDisplayFormat(savedDisplayFormat)
    }
  }, [])

  const setPrivacyMode = (enabled: boolean) => {
    setIsPrivacyMode(enabled)
    localStorage.setItem('tradestial-privacy-mode', enabled.toString())
  }

  const handleDisplayFormatChange = (format: string) => {
    setDisplayFormat(format)
    localStorage.setItem('tradestial-display-format', format)
    
    // Update privacy mode based on format selection
    setPrivacyMode(format === 'privacy')
  }

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMode,
        setPrivacyMode,
        displayFormat,
        setDisplayFormat: handleDisplayFormatChange,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}

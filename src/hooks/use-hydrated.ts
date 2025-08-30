import { useState, useEffect } from 'react'

/**
 * Hook to detect if the component has been hydrated on the client
 * This helps prevent hydration mismatches between server and client
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    setHydrated(true)
  }, [])
  
  return hydrated
}
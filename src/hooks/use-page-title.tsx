'use client'

import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title || 'Tradtrace - Trading Analytics Platform'
  }, [title])
}
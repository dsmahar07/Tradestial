'use client'

import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title || 'Tradestial - Trading Analytics Platform'
  }, [title])
}
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TrackerRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get trade ID from search params
    const tradeId = searchParams.get('trade')
    
    if (tradeId) {
      // Redirect to the dynamic tracker page with the trade ID
      router.replace(`/trades/tracker/${encodeURIComponent(tradeId)}`)
    } else {
      // No trade ID provided, redirect to trades list
      router.replace('/trades')
    }
  }, [router, searchParams])

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#171717]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading trade...</p>
      </div>
    </div>
  )
}
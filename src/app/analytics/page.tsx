import type { Metadata } from 'next'
import { AnalyticsPageClient } from './analytics-client'

export const metadata: Metadata = {
  title: 'Analytics',
}

export default function AnalyticsPage() {
  return <AnalyticsPageClient />
}

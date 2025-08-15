'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { DailyJournalContent } from '@/components/features/daily-journal-content'
import { usePageTitle } from '@/hooks/use-page-title'

export default function DailyJournalPage() {
  usePageTitle('Daily Journal')
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <DailyJournalContent />
      </div>
    </div>
  )
}
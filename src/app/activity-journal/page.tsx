'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { ActivityJournalContent } from '@/components/features/activity-journal-content'
import { usePageTitle } from '@/hooks/use-page-title'

export default function ActivityJournalPage() {
  usePageTitle('Activity Journal')
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <ActivityJournalContent />
      </div>
    </div>
  )
}
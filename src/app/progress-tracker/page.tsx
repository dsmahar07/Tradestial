'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { ProgressTrackerContent } from '@/components/features/progress-tracker-content'
import { usePageTitle } from '@/hooks/use-page-title'

export default function ProgressTrackerPage() {
  usePageTitle('Progress Tracker')
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <ProgressTrackerContent />
      </div>
    </div>
  )
}
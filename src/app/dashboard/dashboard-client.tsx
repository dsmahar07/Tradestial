'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { DashboardContent } from '@/components/features/dashboard-content'

export function DashboardPageClient() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <DashboardContent />
      </div>
    </div>
  )
}

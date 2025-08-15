'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { ModelOverview } from '@/components/features/model-overview'
import { usePageTitle } from '@/hooks/use-page-title'

export default function ModelPage() {
  usePageTitle('Model')
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1C1C1C] p-6">
          <div className="max-w-7xl mx-auto">
            <ModelOverview />
          </div>
        </main>
      </div>
    </div>
  )
}



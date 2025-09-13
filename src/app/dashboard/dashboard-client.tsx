'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { DashboardContent } from '@/components/features/dashboard-content'

export function DashboardPageClient() {
  const [isEditMode, setIsEditMode] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          isEditMode={isEditMode}
          onEditModeChange={setIsEditMode}
        />
        <DashboardContent 
          isEditMode={isEditMode}
          onEditModeChange={setIsEditMode}
        />
      </div>
    </div>
  )
}

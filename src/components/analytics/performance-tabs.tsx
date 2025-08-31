'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { PerformanceTab } from '@/types/performance'
import { cn } from '@/lib/utils'

interface PerformanceTabsProps {
  activeTab?: PerformanceTab
  onTabChange?: (tab: PerformanceTab) => void
  className?: string
}

const tabs: { id: PerformanceTab; label: string }[] = [
  { id: 'Summary', label: 'Summary' },
  { id: 'Days', label: 'Days' },
  { id: 'Trades', label: 'Trades' }
]

export function PerformanceTabs({ 
  activeTab = 'Summary', 
  onTabChange,
  className 
}: PerformanceTabsProps) {
  const [currentTab, setCurrentTab] = useState<PerformanceTab>(activeTab)

  const handleTabClick = (tabId: PerformanceTab) => {
    setCurrentTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={cn("flex items-center justify-between bg-white dark:bg-[#0f0f0f] rounded-lg", className)}>
      <nav className="flex space-x-1 px-4" aria-label="Performance Navigation">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "text-[#335CFF] dark:text-[#335CFF] drop-shadow-[0_0_8px_rgba(51,92,255,0.4)] dark:drop-shadow-[0_0_8px_rgba(51,92,255,0.4)]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
      
      {/* Settings icon */}
      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 mr-4">
        <Settings className="w-4 h-4" />
      </button>
    </div>
  )
}
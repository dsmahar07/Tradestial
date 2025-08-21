'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnalyticsTab, DropdownItem } from '@/config/analytics-navigation'

interface AnalyticsTabNavigationProps {
  tabs: AnalyticsTab[]
  activeTabId?: string
  onTabChange?: (tabId: string) => void
  onDropdownItemClick?: (tabId: string, itemId: string) => void
}

export function AnalyticsTabNavigation({ 
  tabs, 
  activeTabId,
  onTabChange,
  onDropdownItemClick
}: AnalyticsTabNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(activeTabId || tabs.find(tab => tab.isActive)?.id || tabs[0]?.id)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get current active report name based on pathname
  const getCurrentReportName = () => {
    const reportsTab = tabs.find(tab => tab.id === 'reports')
    if (!reportsTab?.dropdownItems) return 'Reports'
    
    const currentReportItem = reportsTab.dropdownItems.find(item => 
      item.href && pathname === item.href
    )
    
    return currentReportItem ? currentReportItem.label : 'Reports'
  }

  const handleTabClick = (tab: AnalyticsTab) => {
    if (tab.hasDropdown) {
      setOpenDropdown(openDropdown === tab.id ? null : tab.id)
    } else {
      setActiveTab(tab.id)
      onTabChange?.(tab.id)
      setOpenDropdown(null)
      
      // Navigate to the tab's href if it exists
      if (tab.href) {
        router.push(tab.href)
      }
    }
  }

  const handleDropdownItemClick = (tabId: string, item: DropdownItem) => {
    onDropdownItemClick?.(tabId, item.id)
    setOpenDropdown(null)
    
    // Navigate to the dropdown item's href if it exists
    if (item.href) {
      router.push(item.href)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#171717]">
      <nav className="flex space-x-1 px-4" aria-label="Analytics Navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (tab.id === 'reports' && pathname.startsWith('/analytics/reports/'))
          const isDropdownOpen = openDropdown === tab.id
          
          return (
            <div key={tab.id} className="relative" ref={tab.hasDropdown ? dropdownRef : undefined}>
              <button
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                  isActive || isDropdownOpen
                    ? "text-[#335CFF] dark:text-[#335CFF] drop-shadow-[0_0_8px_rgba(51,92,255,0.4)] dark:drop-shadow-[0_0_8px_rgba(51,92,255,0.4)]"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <span>{tab.id === 'reports' ? getCurrentReportName() : tab.label}</span>
                
                {tab.isNew && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-[#335CFF] text-white rounded">
                    NEW
                  </span>
                )}
                
                {tab.hasDropdown && (
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )} />
                )}
              </button>
              
              {/* Dropdown Menu */}
              {tab.hasDropdown && tab.dropdownItems && (
                <div className={cn(
                  "absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 transition-opacity",
                  isDropdownOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  <div className="py-1">
                    {tab.dropdownItems.map((item, index) => (
                      <div key={item.id}>
                        <button
                          onClick={() => handleDropdownItemClick(tab.id, item)}
                          className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {item.label}
                        </button>
                        {index < (tab.dropdownItems?.length ?? 0) - 1 && (
                          <div className="mx-2 border-t border-gray-100 dark:border-gray-700"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/use-page-title'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import TradingViewEconomicCalendar from '@/components/widgets/TradingViewEconomicCalendar'
import { CalendarIcon } from '@/components/icons/mageicons'

export default function ResourcesPage() {
  usePageTitle('Trading Resources')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#171717]">
          <div className="max-w-4xl mx-auto p-6 space-y-6">

            {/* Economic Calendar Widget */}
            <Card className="border-0 shadow-sm bg-white dark:bg-[#0f0f0f]">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle>Economic Calendar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="flex justify-center"
                  style={{ overflow: 'hidden' }}
                  onWheel={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <TradingViewEconomicCalendar 
                    width={800}
                    height={600}
                    colorTheme="light"
                    isTransparent={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

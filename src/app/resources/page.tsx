'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/use-page-title'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import TradingViewEconomicCalendar from '@/components/widgets/TradingViewEconomicCalendar'
import { AdvancedPositionSizeCalculator } from '@/components/calculators/advanced-position-size-calculator'
import { CalendarIcon } from '@/components/icons/mageicons'
import { Calculator, TrendingUp, BookOpen, BarChart3 } from 'lucide-react'

export default function ResourcesPage() {
  usePageTitle('Trading Resources')
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#171717]">
          <div className="max-w-6xl mx-auto p-6 space-y-6">

            {/* Trading Tools Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card 
                className="border-0 shadow-sm bg-white dark:bg-[#0f0f0f] cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => setIsCalculatorOpen(true)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                        Position Calculator
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Advanced position sizing
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-[#0f0f0f] cursor-pointer hover:shadow-md transition-shadow group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                        Risk Calculator
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Portfolio risk analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-[#0f0f0f] cursor-pointer hover:shadow-md transition-shadow group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                        P&L Calculator
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Profit & loss analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-[#0f0f0f] cursor-pointer hover:shadow-md transition-shadow group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                        Trading Guide
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Educational resources
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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

      {/* Position Size Calculator Modal */}
      <AdvancedPositionSizeCalculator 
        open={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  )
}

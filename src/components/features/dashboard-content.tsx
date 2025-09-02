'use client'

import { lazy, Suspense, useState, useEffect } from 'react'
import { AnalyticsCard } from '@/components/ui/optimized'
import { TradeDashboardCalendar } from '@/components/ui/trade-dashboard-calendar'
import { RadixJournalDatePicker } from '@/components/ui/radix-journal-date-picker'
import { ChartSkeleton } from '@/components/ui/chart-skeleton'
import { getAnalyticsCardsConfig, getEmptyAnalyticsCards, AnalyticsCardConfig } from '@/components/ui/analytics-cards-config'
import { DataStore } from '@/services/data-store.service'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/hooks/use-hydrated'
import { DailyCheckListDialog } from '@/components/features/daily-checklist-dialog'
import { MoodSelectionModal, MoodType } from '@/components/features/mood-selection-modal'
import { MoodTrackerService } from '@/services/mood-tracker.service'

// Lazy load heavy chart components
const PnlOverviewChart = lazy(() => import('@/components/ui/pnl-overview-chart').then(m => ({ default: m.PnlOverviewChart })))
const CumulativePnlChart = lazy(() => import('@/components/ui/cumulative-pnl-chart').then(m => ({ default: m.CumulativePnlChart })))
const DailyCumulativePnlWidget = lazy(() => import('@/components/ui/daily-cumulative-pnl-widget').then(m => ({ default: m.DailyCumulativePnlWidget })))
const MetricsOverTimeChart = lazy(() => import('@/components/ui/metrics-over-time-chart').then(m => ({ default: m.MetricsOverTimeChart })))
const RecentTradesTable = lazy(() => import('@/components/ui/recent-trades-table').then(m => ({ default: m.RecentTradesTable })))
const SymbolPerformanceChart = lazy(() => import('@/components/ui/symbol-performance-chart').then(m => ({ default: m.SymbolPerformanceChart })))
const CumulativePnlBar = lazy(() => import('@/components/ui/cumulative-pnl-bar').then(m => ({ default: m.CumulativePnlBar })))
const TradingStreakHeatmap = lazy(() => import('@/components/ui/trading-streak-heatmap').then(m => ({ default: m.TradingStreakHeatmap })))
const ProgressTrackerHeatmap = lazy(() => import('@/components/ui/progress-tracker-heatmap').then(m => ({ default: m.ProgressTrackerHeatmap })))
const DrawdownChart = lazy(() => import('@/components/ui/drawdown-chart').then(m => ({ default: m.DrawdownChart })))
const TradeTimePerformance = lazy(() => import('@/components/ui/trade-time-performance').then(m => ({ default: m.TradeTimePerformance })))
const YearlyCalendar = lazy(() => import('@/components/ui/yearly-calendar').then(m => ({ default: m.YearlyCalendar })))
const ReportChart = lazy(() => import('@/components/ui/report-chart').then(m => ({ default: m.ReportChart })))
const AccountBalanceChart = lazy(() => import('@/components/ui/account-balance-chart').then(m => ({ default: m.AccountBalanceChart })))
const AdvanceRadar = lazy(() => import('@/components/ui/AdvanceRadar').then(m => ({ default: m.default })))


export function DashboardContent() {
  const [isNavigating, setIsNavigating] = useState(false)
  const [isDailyChecklistOpen, setIsDailyChecklistOpen] = useState(false)
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const isHydrated = useHydrated()
  const [analyticsCards, setAnalyticsCards] = useState<AnalyticsCardConfig[]>(() => {
    // Always start with empty state to prevent hydration mismatch
    // Force empty state for both server and client initial render
    return getEmptyAnalyticsCards()
  })
  const router = useRouter()

  // Update analytics cards after hydration
  useEffect(() => {
    if (isHydrated) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        setAnalyticsCards(getAnalyticsCardsConfig(true)) // forceReal = true
      }, 0)
      
      const unsubscribe = DataStore.subscribe(() => {
        setAnalyticsCards(getAnalyticsCardsConfig(true)) // forceReal = true
      })

      return () => {
        clearTimeout(timeoutId)
        unsubscribe()
      }
    }
  }, [isHydrated])

  const handleDateSelect = (date: Date) => {
    // Check if mood is already logged for this date
    const existingMood = MoodTrackerService.getMoodEntry(date)
    
    if (existingMood) {
      // Mood already logged, navigate directly
      navigateToJournal(date)
    } else {
      // Show mood selection modal first
      setSelectedDate(date)
      setIsMoodModalOpen(true)
    }
  }

  const navigateToJournal = (date: Date) => {
    setIsNavigating(true)
    // Navigate to journal page with selected date
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}` // Format: YYYY-MM-DD
    router.push(`/journal-page?date=${dateStr}`)
  }

  const handleMoodSelected = (mood: MoodType, notes?: string) => {
    if (selectedDate) {
      // Save mood entry
      MoodTrackerService.saveMoodEntry(selectedDate, mood, notes)
      
      // Close modal and navigate to journal
      setIsMoodModalOpen(false)
      navigateToJournal(selectedDate)
      setSelectedDate(null)
    }
  }

  const handleMoodModalClose = () => {
    setIsMoodModalOpen(false)
    setSelectedDate(null)
    setIsNavigating(false)
  }


  return (
    <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
      <div className="space-y-6">
        {/* Journal Button with Dropdown - Top Right of Content */}
        <div className="flex justify-end mb-4">
          <RadixJournalDatePicker 
            onDateSelect={handleDateSelect}
            isNavigating={isNavigating}
          />
        </div>

        {/* Analytics Cards Row - Load immediately */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {analyticsCards.map((cardConfig, index) => (
            <AnalyticsCard
              key={cardConfig.title}
              {...cardConfig}
            />
          ))}
        </div>

        {/* Charts Row - Lazy loaded */}
        <div className="space-y-6">
          {/* Top Row: SymbolPerformanceChart + AdvanceRadar + AccountBalanceChart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <SymbolPerformanceChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <AdvanceRadar />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <AccountBalanceChart />
            </Suspense>
          </div>
          
          {/* Second Row: TradingStreakHeatmap + DrawdownChart + CumulativePnlChart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <TradingStreakHeatmap />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <DrawdownChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <CumulativePnlChart />
            </Suspense>
          </div>
          
          {/* Third Row: CumulativePnlBar + ReportChart + ProgressTrackerHeatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <CumulativePnlBar />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <ReportChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <ProgressTrackerHeatmap onOpenDailyChecklist={() => setIsDailyChecklistOpen(true)} />
            </Suspense>
          </div>

          {/* Fourth Row: PNL Overview + Daily & Cumulative P&L + Trade Time Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Suspense fallback={<ChartSkeleton />}>
                <PnlOverviewChart />
              </Suspense>
            </div>
            <div>
              <Suspense fallback={<ChartSkeleton />}>
                <DailyCumulativePnlWidget />
              </Suspense>
            </div>
            <div>
              <Suspense fallback={<ChartSkeleton />}>
                <TradeTimePerformance />
              </Suspense>
            </div>
          </div>
          
          {/* Recent Trades + Calendar row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 self-start">
              <Suspense fallback={<ChartSkeleton />}>
                <RecentTradesTable />
              </Suspense>
            </div>
            <div className="lg:col-span-8 h-full">
              <div className="h-full">
                <TradeDashboardCalendar className="h-full" />
              </div>
            </div>
          </div>
          
          {/* Yearly Calendar row */}
          <div className="w-full">
            <Suspense fallback={<ChartSkeleton />}>
              <YearlyCalendar />
            </Suspense>
          </div>
          
        </div>
      </div>

      {/* Daily Checklist Dialog */}
      <DailyCheckListDialog 
        open={isDailyChecklistOpen} 
        onClose={() => setIsDailyChecklistOpen(false)}
        manualRules={[]}
        onUpdateManualRules={() => {}}
      />

      {/* Mood Selection Modal */}
      {selectedDate && (
        <MoodSelectionModal
          open={isMoodModalOpen}
          onClose={handleMoodModalClose}
          onMoodSelected={handleMoodSelected}
          selectedDate={selectedDate}
        />
      )}
    </main>
  )
}
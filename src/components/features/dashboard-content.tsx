'use client'

import { lazy, Suspense, useState, useEffect, useMemo } from 'react'
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
import { RuleTrackingService } from '@/services/rule-tracking.service'

// Lazy load heavy chart components
const PnlOverviewChart = lazy(() => import('@/components/ui/pnl-overview-chart').then(m => ({ default: m.PnlOverviewChart })))
const DailyNetCumulativePnlChart = lazy(() => import('@/components/ui/daily-net-cumulative-pnl-chart').then(m => ({ default: m.DailyNetCumulativePnlChart })))
const DailyCumulativePnlWidget = lazy(() => import('@/components/ui/daily-cumulative-pnl-widget').then(m => ({ default: m.DailyCumulativePnlWidget })))
const MetricsOverTimeChart = lazy(() => import('@/components/ui/metrics-over-time-chart').then(m => ({ default: m.MetricsOverTimeChart })))
const RecentTradesTable = lazy(() => import('@/components/ui/recent-trades-table').then(m => ({ default: m.RecentTradesTable })))
const SymbolPerformanceChart = lazy(() => import('@/components/ui/symbol-performance-chart').then(m => ({ default: m.SymbolPerformanceChart })))
const CumulativePnlBar = lazy(() => import('@/components/ui/cumulative-pnl-bar').then(m => ({ default: m.CumulativePnlBar })))
const TradingStreakHeatmap = lazy(() => import('@/components/ui/trading-streak-heatmap').then(m => ({ default: m.TradingStreakHeatmap })))
const ActivityJournalHeatmap = lazy(() => import('@/components/ui/activity-journal-heatmap').then(m => ({ default: m.ActivityJournalHeatmap })))
const DrawdownChart = lazy(() => import('@/components/ui/drawdown-chart').then(m => ({ default: m.DrawdownChart })))
const TradeTimePerformance = lazy(() => import('@/components/ui/trade-time-performance').then(m => ({ default: m.TradeTimePerformance })))
const YearlyCalendar = lazy(() => import('@/components/ui/yearly-calendar').then(m => ({ default: m.YearlyCalendar })))
const PerformanceWeekDays = lazy(() => import('@/components/ui/performance-week-days').then(m => ({ default: m.PerformanceWeekDays })))
const ReportChart = lazy(() => import('@/components/ui/report-chart').then(m => ({ default: m.ReportChart })))
const AccountBalanceChart = lazy(() => import('@/components/ui/account-balance-chart').then(m => ({ default: m.AccountBalanceChart })))
const AdvanceRadar = lazy(() => import('@/components/ui/AdvanceRadar').then(m => ({ default: m.default })))


interface TradingRule {
  id: string
  name: string
  enabled: boolean
  type: 'trading_hours' | 'start_day' | 'link_model' | 'stop_loss' | 'max_loss_trade' | 'max_loss_day'
  config?: any
}

interface ManualRule {
  id: string
  name: string
  days: string
  completed?: boolean
}

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

  // Activity Journal state - matching the main page logic
  const [tradingDays, setTradingDays] = useState(['Mo', 'Tu', 'We', 'Th', 'Fr'])
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([
    {
      id: '1',
      name: 'Trading hours',
      enabled: true,
      type: 'trading_hours',
      config: { from: '09:00', to: '12:00' }
    },
    {
      id: '2',
      name: 'Step into the day',
      enabled: true,
      type: 'start_day',
      config: { time: '08:30' }
    },
    {
      id: '3',
      name: 'Link trades to model',
      enabled: true,
      type: 'link_model'
    },
    {
      id: '4',
      name: 'Input Stop loss to all trades',
      enabled: true,
      type: 'stop_loss'
    },
    {
      id: '5',
      name: 'Net max loss /trade',
      enabled: true,
      type: 'max_loss_trade',
      config: { amount: '100', type: '$' }
    },
    {
      id: '6',
      name: 'Net max loss /day',
      enabled: true,
      type: 'max_loss_day',
      config: { amount: '100' }
    }
  ])
  
  const [manualRules, setManualRules] = useState<ManualRule[]>(() => {
    try {
      const saved = localStorage.getItem('tradestial:manual-rules')
      if (saved) {
        return JSON.parse(saved)
      } else {
        const defaultRules = [
          {
            id: 'mr1',
            name: 'Review market analysis',
            days: 'Daily',
            completed: false
          },
          {
            id: 'mr2', 
            name: 'Check economic calendar',
            days: 'Mon-Fri',
            completed: false
          },
          {
            id: 'mr3',
            name: 'Update trading journal',
            days: 'Daily',
            completed: false
          }
        ]
        localStorage.setItem('tradestial:manual-rules', JSON.stringify(defaultRules))
        return defaultRules
      }
    } catch {
      return []
    }
  })

  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>(() => {
    return RuleTrackingService.getDayCompletions()
  })
  const [history, setHistory] = useState<Record<string, { completed: number; total: number; score: number }>>({})

  // Helper function
  const toKey = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Check if today is a trading day
  const isTradingDay = useMemo(() => {
    const today = new Date().getDay()
    const dayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    return tradingDays.includes(dayMap[today])
  }, [tradingDays])

  // Calculate active rules for today
  const activeRules = useMemo(() => {
    const rules: any[] = []
    
    // Add enabled trading rules only if it's a trading day
    if (isTradingDay) {
      tradingRules.forEach(rule => {
        if (rule.enabled) {
          rules.push({
            id: rule.id,
            name: rule.name,
            completed: todayCompletions[rule.id] || false
          })
        }
      })
    }
    
    // Add manual rules for today
    manualRules.forEach(rule => {
      const today = new Date().getDay()
      let shouldInclude = false
      
      if (rule.days === 'Daily') shouldInclude = true
      else if (rule.days === 'Mon-Fri' && today >= 1 && today <= 5) shouldInclude = true
      else if (rule.days === 'Weekends' && (today === 0 || today === 6)) shouldInclude = true
      
      if (shouldInclude) {
        rules.push({
          id: `manual_${rule.id}`,
          name: rule.name,
          completed: rule.completed || false
        })
      }
    })
    
    return rules
  }, [isTradingDay, tradingRules, manualRules, todayCompletions])

  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    const totalRules = activeRules.length
    const completedRules = activeRules.filter(rule => rule.completed).length
    const progressPercentage = totalRules > 0 ? (completedRules / totalRules) * 100 : 0
    
    return {
      total: totalRules,
      completed: completedRules,
      percentage: progressPercentage
    }
  }, [activeRules])

  // Auto-check rules based on user actions
  useEffect(() => {
    const checkRules = () => {
      const today = toKey(new Date())
      
      // Check all trading rules for completion
      tradingRules.forEach(rule => {
        if (!rule.enabled) return
        
        switch (rule.type) {
          case 'start_day':
            // This will be triggered when user accesses dashboard
            break
          case 'link_model':
            RuleTrackingService.trackLinkTradesToModelRule(today)
            break
          case 'stop_loss':
            RuleTrackingService.trackStopLossRule(today)
            break
          case 'max_loss_trade':
            if (rule.config?.amount) {
              RuleTrackingService.trackMaxLossPerTradeRule(rule.config.amount, today)
            }
            break
          case 'max_loss_day':
            if (rule.config?.amount) {
              RuleTrackingService.trackMaxLossPerDayRule(rule.config.amount, today)
            }
            break
        }
      })
      
      // Update completions from tracking service
      setTodayCompletions(RuleTrackingService.getDayCompletions())
    }
    
    // Check rules on component mount and when trading rules change
    checkRules()
    
    // Set up interval to check rules periodically
    const interval = setInterval(checkRules, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [tradingRules])

  // Load persisted state on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const tRules = window.localStorage.getItem('progress:tradingRules')
      const mRules = window.localStorage.getItem('progress:manualRules')
      const tDays = window.localStorage.getItem('progress:tradingDays')
      const hist = window.localStorage.getItem('progress:history')
      if (tRules) setTradingRules(JSON.parse(tRules))
      if (mRules) setManualRules(JSON.parse(mRules))
      if (tDays) setTradingDays(JSON.parse(tDays))
      if (hist) setHistory(JSON.parse(hist))
    } catch {}
  }, [])

  // Update today's history entry when metrics change
  useEffect(() => {
    const key = toKey(new Date())
    setHistory(prev => {
      const entry = {
        completed: progressMetrics.completed,
        total: progressMetrics.total,
        score: Math.round(progressMetrics.percentage)
      }
      const next = { ...prev, [key]: entry }
      return next
    })
  }, [progressMetrics.completed, progressMetrics.total])

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
    <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-[#F5F5F5] dark:bg-[#171717]">
      <div className="space-y-6">
        {/* Journal Button with Dropdown - Top Right of Content */}
        <div className="flex justify-end mb-4">
          <RadixJournalDatePicker 
            onDateSelect={handleDateSelect}
            isNavigating={isNavigating}
          />
        </div>

        {/* Analytics Cards Row - Load immediately */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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
          
          {/* Second Row: TradingStreakHeatmap + DrawdownChart + DailyNetCumulativePnlChart */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <TradingStreakHeatmap />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <DrawdownChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <DailyNetCumulativePnlChart />
            </Suspense>
          </div>
          
          {/* Third Row: CumulativePnlBar + ReportChart + ActivityJournalHeatmap */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <CumulativePnlBar />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <ReportChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <ActivityJournalHeatmap 
                todayScore={progressMetrics.percentage}
                todayCompleted={progressMetrics.completed}
                todayTotal={progressMetrics.total}
                history={history}
                onOpenDailyChecklist={() => setIsDailyChecklistOpen(true)} 
              />
            </Suspense>
          </div>

          {/* Fourth Row: PNL Overview + Daily & Cumulative P&L + Trade Time Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
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
          
          {/* Performance Week Days row - Same size as Daily & Cumulative P&L */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div>
              <Suspense fallback={<ChartSkeleton />}>
                <PerformanceWeekDays />
              </Suspense>
            </div>
          </div>
          
        </div>
      </div>

      {/* Daily Checklist Dialog */}
      <DailyCheckListDialog 
        open={isDailyChecklistOpen} 
        onClose={() => setIsDailyChecklistOpen(false)}
        manualRules={manualRules}
        onUpdateManualRules={setManualRules}
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
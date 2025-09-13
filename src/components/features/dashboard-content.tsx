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
import { CustomizableWidgetsBoard } from '@/components/features/customizable-widgets-board'
import { MoodSelectionModal, MoodType } from '@/components/features/mood-selection-modal'
import { MoodTrackerService } from '@/services/mood-tracker.service'
import { RuleTrackingService } from '@/services/rule-tracking.service'
import { usePrivacy } from '@/contexts/privacy-context'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon, Cog6ToothIcon, EyeIcon, EyeSlashIcon, TrashIcon, BookmarkIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

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

interface LayoutManagementDropdownProps {
  onCustomizeChange: (isCustomizing: boolean) => void
  isEditMode: boolean
}

// Layout Management Dropdown Component
function LayoutManagementDropdown({ onCustomizeChange, isEditMode }: LayoutManagementDropdownProps) {
  const [savedLayouts, setSavedLayouts] = useState<Record<string, any>>({})
  const [activeLayout, setActiveLayout] = useState<string>("Default")
  const [newLayoutName, setNewLayoutName] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Load layouts from localStorage
  useEffect(() => {
    try {
      const layoutsRaw = localStorage.getItem('tradestial:dashboard:layouts:v1')
      const activeRaw = localStorage.getItem('tradestial:dashboard:active-layout:v1')
      const layouts = layoutsRaw ? JSON.parse(layoutsRaw) : { "Default": { order: [], hidden: {} } }
      const active = activeRaw ? JSON.parse(activeRaw) : "Default"
      
      setSavedLayouts(layouts)
      setActiveLayout(active)
    } catch {
      setSavedLayouts({ "Default": { order: [], hidden: {} } })
      setActiveLayout("Default")
    }
  }, [])

  const handleCreateNewLayout = () => {
    if (!newLayoutName.trim()) return
    
    // Enter edit mode when creating new layout
    onCustomizeChange(true)
    setIsCreateDialogOpen(false)
    setNewLayoutName("")
    
    // Save new layout
    try {
      const newLayouts = { ...savedLayouts, [newLayoutName.trim()]: { order: [], hidden: {} } }
      localStorage.setItem('tradestial:dashboard:layouts:v1', JSON.stringify(newLayouts))
      localStorage.setItem('tradestial:dashboard:active-layout:v1', JSON.stringify(newLayoutName.trim()))
      setSavedLayouts(newLayouts)
      setActiveLayout(newLayoutName.trim())
    } catch {}
  }

  const handleLoadLayout = (layoutName: string) => {
    setActiveLayout(layoutName)
    try {
      localStorage.setItem('tradestial:dashboard:active-layout:v1', JSON.stringify(layoutName))
    } catch {}
  }

  const handleDeleteLayout = (layoutName: string) => {
    if (Object.keys(savedLayouts).length <= 1) return
    
    const newLayouts = { ...savedLayouts }
    delete newLayouts[layoutName]
    
    try {
      localStorage.setItem('tradestial:dashboard:layouts:v1', JSON.stringify(newLayouts))
      setSavedLayouts(newLayouts)
      
      if (activeLayout === layoutName) {
        const fallback = Object.keys(newLayouts)[0] || "Default"
        setActiveLayout(fallback)
        localStorage.setItem('tradestial:dashboard:active-layout:v1', JSON.stringify(fallback))
      }
    } catch {}
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Layout: {activeLayout}
            <ChevronDownIcon className="w-4 h-4" />
          </Button>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="min-w-[200px] bg-white dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg p-2 z-50">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Layouts
            </div>
            
            {Object.keys(savedLayouts).map(layoutName => (
              <DropdownMenu.Item
                key={layoutName}
                className="flex items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none"
                onSelect={() => handleLoadLayout(layoutName)}
              >
                <span className={activeLayout === layoutName ? "font-medium" : ""}>{layoutName}</span>
                {Object.keys(savedLayouts).length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLayout(layoutName)
                    }}
                    className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-red-500"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                )}
              </DropdownMenu.Item>
            ))}
            
            <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-[#2a2a2a] my-2" />
            
            <DropdownMenu.Item
              className="flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none"
              onSelect={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create New Layout
            </DropdownMenu.Item>
            
            <DropdownMenu.Item
              className="flex items-center px-3 py-2 text-sm text-gray-900 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none"
              onSelect={() => onCustomizeChange(!isEditMode)}
            >
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              {isEditMode ? 'Exit Edit Mode' : 'Edit Current Layout'}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Create New Layout Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Layout
            </Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Layout Name
                </label>
                <input
                  type="text"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  placeholder="Enter layout name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewLayout()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleCreateNewLayout}
                  disabled={!newLayoutName.trim()}
                  size="sm"
                >
                  Create & Edit
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

interface DashboardContentProps {
  isEditMode?: boolean
  onEditModeChange?: (isEditing: boolean) => void
}

export function DashboardContent({ isEditMode: propIsEditMode, onEditModeChange }: DashboardContentProps = {}) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [isDailyChecklistOpen, setIsDailyChecklistOpen] = useState(false)
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // Use prop edit mode if provided, otherwise use internal state
  const isEditMode = propIsEditMode ?? false
  const setIsEditMode = onEditModeChange ?? (() => {})
  const isHydrated = useHydrated()
  const { isPrivacyMode } = usePrivacy()
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
        const cards = getAnalyticsCardsConfig(true, isPrivacyMode) // forceReal = true, pass privacy mode
        
        // Apply saved order if it exists
        try {
          const savedOrder = localStorage.getItem('tradestial:analytics-cards-order')
          if (savedOrder) {
            const orderArray = JSON.parse(savedOrder) as string[]
            const orderedCards = orderArray
              .map(title => cards.find(card => card.title === title))
              .filter(Boolean) as AnalyticsCardConfig[]
            
            // Add any new cards that weren't in the saved order
            const existingTitles = new Set(orderArray)
            const newCards = cards.filter(card => !existingTitles.has(card.title))
            
            setAnalyticsCards([...orderedCards, ...newCards])
          } else {
            setAnalyticsCards(cards)
          }
        } catch {
          setAnalyticsCards(cards)
        }
      }, 0)
      
      const unsubscribe = DataStore.subscribe(() => {
        const cards = getAnalyticsCardsConfig(true, isPrivacyMode) // forceReal = true, pass privacy mode
        
        // Preserve current order when data updates
        setAnalyticsCards(prevCards => {
          const cardsByTitle = new Map(cards.map(card => [card.title, card]))
          return prevCards.map(prevCard => cardsByTitle.get(prevCard.title) || prevCard)
        })
      })

      return () => {
        clearTimeout(timeoutId)
        unsubscribe()
      }
    }
  }, [isHydrated, isPrivacyMode])

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

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 3,
        delay: 0,
        tolerance: 0
      } 
    })
  )

  const handleAnalyticsCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = analyticsCards.findIndex(card => card.title === active.id)
    const newIndex = analyticsCards.findIndex(card => card.title === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newCards = arrayMove(analyticsCards, oldIndex, newIndex)
      setAnalyticsCards(newCards)

      // Persist the new order to localStorage
      try {
        const cardOrder = newCards.map(card => card.title)
        localStorage.setItem('tradestial:analytics-cards-order', JSON.stringify(cardOrder))
      } catch {}
    }
  }

// Sortable wrapper for Analytics Cards
function SortableAnalyticsCard({ cardConfig, isEditMode }: { cardConfig: AnalyticsCardConfig; isEditMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: cardConfig.title,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...(isEditMode ? attributes : {})}
      {...(isEditMode ? listeners : {})}
      className={isEditMode ? "cursor-grab active:cursor-grabbing touch-none will-change-transform" : ""}
    >
      <AnalyticsCard {...cardConfig} />
    </div>
  )
}

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-[#f8f9f8] dark:bg-[#171717]">
      <div className="space-y-6">
        {/* Edit mode toolbar with save functionality */}
        {isEditMode && (
          <div className="flex justify-between items-center mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center text-blue-700 dark:text-blue-300">
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              <span className="font-medium">Layout editing mode</span>
              <span className="ml-2 text-sm opacity-75">Drag cards and widgets to rearrange</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Save Layout Dialog */}
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded-lg">
                    <BookmarkIcon className="w-4 h-4 mr-2" />
                    Save Layout
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-xl p-6 w-full max-w-md z-50">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Save Current Layout
                    </Dialog.Title>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Layout Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter layout name..."
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              // Save layout logic will be handled by the widgets board
                              const event = new CustomEvent('saveLayout', { detail: e.currentTarget.value.trim() })
                              window.dispatchEvent(event)
                              e.currentTarget.value = ""
                              const dlg = e.currentTarget.closest('[role="dialog"]') as HTMLElement | null
                              const closeBtn = dlg?.querySelector('[data-radix-dialog-close]') as HTMLButtonElement | null
                              closeBtn?.click()
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Dialog.Close asChild>
                          <Button variant="outline" className="px-3 py-2 text-sm">
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Dialog.Close asChild>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              const input = e.currentTarget.closest('[role="dialog"]')?.querySelector('input') as HTMLInputElement
                              if (input?.value.trim()) {
                                const event = new CustomEvent('saveLayout', { detail: input.value.trim() })
                                window.dispatchEvent(event)
                                input.value = ""
                              }
                            }}
                          >
                            Save Layout
                          </Button>
                        </Dialog.Close>
                      </div>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

              {/* Exit Edit Mode */}
              <Button 
                variant="outline"
                className="px-3 py-2 text-sm"
                onClick={() => setIsEditMode(false)}
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Exit Edit Mode
              </Button>
            </div>
          </div>
        )}   {/* Analytics Cards Row - Load immediately */}
        <DndContext sensors={sensors} onDragEnd={handleAnalyticsCardDragEnd}>
          <SortableContext items={analyticsCards.map(card => card.title)} strategy={horizontalListSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {analyticsCards.map((cardConfig) => (
                <SortableAnalyticsCard key={cardConfig.title} cardConfig={cardConfig} isEditMode={isEditMode} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Customizable Widgets Board */}
        <div className="space-y-6">
          <CustomizableWidgetsBoard 
            activity={{
              todayScore: progressMetrics.percentage,
              todayCompleted: progressMetrics.completed,
              todayTotal: progressMetrics.total,
              history: history,
              onOpenDailyChecklist: () => setIsDailyChecklistOpen(true)
            }}
            onCustomizeChange={setIsEditMode}
            isEditMode={isEditMode}
          />
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
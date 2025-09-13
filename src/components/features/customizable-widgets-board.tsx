"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChartSkeleton } from "@/components/ui/chart-skeleton"
import * as Dialog from "@radix-ui/react-dialog"
import { Root as FancyButton } from "@/components/ui/fancy-button"

// Lazy load heavy chart components (same as dashboard)
const PnlOverviewChart = React.lazy(() => import("@/components/ui/pnl-overview-chart").then(m => ({ default: m.PnlOverviewChart })))
const DailyNetCumulativePnlChart = React.lazy(() => import("@/components/ui/daily-net-cumulative-pnl-chart").then(m => ({ default: m.DailyNetCumulativePnlChart })))
const DailyCumulativePnlWidget = React.lazy(() => import("@/components/ui/daily-cumulative-pnl-widget").then(m => ({ default: m.DailyCumulativePnlWidget })))
const MetricsOverTimeChart = React.lazy(() => import("@/components/ui/metrics-over-time-chart").then(m => ({ default: m.MetricsOverTimeChart })))
const RecentTradesTable = React.lazy(() => import("@/components/ui/recent-trades-table").then(m => ({ default: m.RecentTradesTable })))
const SymbolPerformanceChart = React.lazy(() => import("@/components/ui/symbol-performance-chart").then(m => ({ default: m.SymbolPerformanceChart })))
const CumulativePnlBar = React.lazy(() => import("@/components/ui/cumulative-pnl-bar").then(m => ({ default: m.CumulativePnlBar })))
const TradingStreakHeatmap = React.lazy(() => import("@/components/ui/trading-streak-heatmap").then(m => ({ default: m.TradingStreakHeatmap })))
const DrawdownChart = React.lazy(() => import("@/components/ui/drawdown-chart").then(m => ({ default: m.DrawdownChart })))
const TradeTimePerformance = React.lazy(() => import("@/components/ui/trade-time-performance").then(m => ({ default: m.TradeTimePerformance })))
const YearlyCalendar = React.lazy(() => import("@/components/ui/yearly-calendar").then(m => ({ default: m.YearlyCalendar })))
const ReportChart = React.lazy(() => import("@/components/ui/report-chart").then(m => ({ default: m.ReportChart })))
const AccountBalanceChart = React.lazy(() => import("@/components/ui/account-balance-chart").then(m => ({ default: m.AccountBalanceChart })))
const AdvanceRadar = React.lazy(() => import("@/components/ui/AdvanceRadar").then(m => ({ default: m.default })))
const ActivityJournalHeatmap = React.lazy(() => import("@/components/ui/activity-journal-heatmap").then(m => ({ default: m.ActivityJournalHeatmap })))
const TradeDashboardCalendar = React.lazy(() => import("@/components/ui/trade-dashboard-calendar").then(m => ({ default: m.TradeDashboardCalendar })))

const LS_KEY = "tradestial:dashboard:widgets:v1" // legacy single-layout key
const LAYOUTS_KEY = "tradestial:dashboard:layouts:v1" // map of name -> layout
const ACTIVE_LAYOUT_KEY = "tradestial:dashboard:active-layout:v1"

export type WidgetId =
  | "symbol-performance"
  | "advance-radar"
  | "account-balance"
  | "trading-streak"
  | "drawdown"
  | "daily-net-cum-pnl"
  | "cumulative-pnl-bar"
  | "report-chart"
  | "activity-journal-heatmap"
  | "pnl-overview"
  | "daily-cum-pnl-widget"
  | "trade-time-performance"
  | "recent-trades"
  | "calendar"
  | "yearly-calendar"
  | "performance-week-days"

interface WidgetDef {
  id: WidgetId
  title: string
  render: () => React.ReactNode
}

const PerformanceWeekDays = React.lazy(() => import("@/components/ui/performance-week-days").then(m => ({ default: m.default })))

const ALL_WIDGETS: WidgetDef[] = [
  { id: "symbol-performance", title: "Symbol Performance", render: () => <SymbolPerformanceChart /> },
  { id: "advance-radar", title: "Advance Radar", render: () => <AdvanceRadar /> },
  { id: "account-balance", title: "Account Balance", render: () => <AccountBalanceChart /> },
  { id: "trading-streak", title: "Trading Streak Heatmap", render: () => <TradingStreakHeatmap /> },
  { id: "drawdown", title: "Drawdown", render: () => <DrawdownChart /> },
  { id: "daily-net-cum-pnl", title: "Daily Net Cumulative PnL", render: () => <DailyNetCumulativePnlChart /> },
  { id: "cumulative-pnl-bar", title: "Cumulative PnL Bar", render: () => <CumulativePnlBar /> },
  { id: "report-chart", title: "Report Chart", render: () => <ReportChart /> },
  { id: "pnl-overview", title: "PNL Overview", render: () => <PnlOverviewChart /> },
  { id: "daily-cum-pnl-widget", title: "Daily & Cumulative PnL", render: () => <DailyCumulativePnlWidget /> },
  { id: "trade-time-performance", title: "Trade Time Performance", render: () => <TradeTimePerformance /> },
  { id: "recent-trades", title: "Recent Trades", render: () => <RecentTradesTable /> },
  { id: "performance-week-days", title: "Performance Week Days", render: () => <PerformanceWeekDays /> },
  { id: "yearly-calendar", title: "Yearly Calendar", render: () => <YearlyCalendar /> },
]

const DEFAULT_ORDER: WidgetId[] = [
  "symbol-performance",
  "advance-radar", 
  "account-balance",
  "trading-streak",
  "drawdown",
  "daily-net-cum-pnl",
  "cumulative-pnl-bar",
  "report-chart",
  "pnl-overview",
  "daily-cum-pnl-widget",
  "trade-time-performance",
  "activity-journal-heatmap",
  "recent-trades",
  "calendar",
  "performance-week-days",
]

interface PersistedState {
  order: WidgetId[]
  hidden: Record<WidgetId, boolean>
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState
      return {
        order: parsed.order?.filter(id => DEFAULT_ORDER.includes(id)) ?? DEFAULT_ORDER,
        hidden: { ...parsed.hidden, "yearly-calendar": true } // Hide yearly calendar by default
      }
    }
  } catch {}
  return { order: DEFAULT_ORDER, hidden: { "yearly-calendar": true } as Record<WidgetId, boolean> } // Hide yearly calendar by default
}

function saveState(state: PersistedState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state))
}

function usePersistentLayout(isEditing?: boolean) {
  const [order, setOrder] = useState<WidgetId[]>(DEFAULT_ORDER)
  const [hidden, setHidden] = useState<Record<WidgetId, boolean>>({} as Record<WidgetId, boolean>)
  const [activeLayout, setActiveLayout] = useState<string>("Default")
  const [savedLayouts, setSavedLayouts] = useState<Record<string, PersistedState>>({})

  useEffect(() => {
    // Load named layouts
    try {
      const layoutsRaw = localStorage.getItem(LAYOUTS_KEY)
      const activeRaw = localStorage.getItem(ACTIVE_LAYOUT_KEY)
      const layouts = layoutsRaw ? (JSON.parse(layoutsRaw) as Record<string, PersistedState>) : {}

      // Migrate legacy single layout into "Default" if no layouts exist
      if (!layoutsRaw) {
        const legacy = loadState()
        layouts["Default"] = legacy
        localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts))
        localStorage.setItem(ACTIVE_LAYOUT_KEY, JSON.stringify("Default"))
      }

      const name = activeRaw ? (JSON.parse(activeRaw) as string) : "Default"
      setSavedLayouts(layouts)
      setActiveLayout(name)
      const current = layouts[name] ?? layouts[Object.keys(layouts)[0]] ?? { order: DEFAULT_ORDER, hidden: {} as Record<WidgetId, boolean> }
      setOrder(current.order)
      setHidden((current.hidden ?? {}) as Record<WidgetId, boolean>)
    } catch {
      const s = loadState()
      setOrder(s.order)
      setHidden(s.hidden as Record<WidgetId, boolean>)
      setSavedLayouts({ Default: s })
      setActiveLayout("Default")
    }
  }, [])

  useEffect(() => {
    // Persist into active named layout snapshot
    try {
      // If editing the Default layout, do NOT persist changes to the Default entry
      if (activeLayout === 'Default' && isEditing) {
        return
      }
      const layoutsRaw = localStorage.getItem(LAYOUTS_KEY)
      const layouts = layoutsRaw ? (JSON.parse(layoutsRaw) as Record<string, PersistedState>) : {}
      layouts[activeLayout] = { order, hidden }
      localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts))
      setSavedLayouts(layouts)
      // Also keep legacy key updated for backward compatibility
      saveState({ order, hidden })
    } catch {}
  }, [order, hidden, activeLayout, isEditing])

  const show = useCallback((id: WidgetId, v: boolean) => {
    setHidden(prev => ({ ...prev, [id]: !v ? true : false }))
  }, [])

  const reset = useCallback(() => {
    setOrder(DEFAULT_ORDER)
    setHidden({} as Record<WidgetId, boolean>)
  }, [])

  const saveLayoutAs = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const nextLayouts = { ...savedLayouts, [trimmed]: { order, hidden } }
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(nextLayouts))
    localStorage.setItem(ACTIVE_LAYOUT_KEY, JSON.stringify(trimmed))
    setSavedLayouts(nextLayouts)
    setActiveLayout(trimmed)
  }, [order, hidden, savedLayouts])

  const loadLayout = useCallback((name: string) => {
    const target = savedLayouts[name]
    if (!target) return
    setActiveLayout(name)
    localStorage.setItem(ACTIVE_LAYOUT_KEY, JSON.stringify(name))
    setOrder(target.order)
    setHidden(target.hidden as Record<WidgetId, boolean>)
  }, [savedLayouts])

  const deleteLayout = useCallback((name: string) => {
    const copy = { ...savedLayouts }
    delete copy[name]
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(copy))
    setSavedLayouts(copy)
    if (activeLayout === name) {
      const fallback = Object.keys(copy)[0] ?? "Default"
      localStorage.setItem(ACTIVE_LAYOUT_KEY, JSON.stringify(fallback))
      setActiveLayout(fallback)
      const target = copy[fallback] ?? { order: DEFAULT_ORDER, hidden: {} as Record<WidgetId, boolean> }
      setOrder(target.order)
      setHidden(target.hidden as Record<WidgetId, boolean>)
    }
  }, [activeLayout, savedLayouts])

  return { order, setOrder, hidden, show, reset, activeLayout, savedLayouts, saveLayoutAs, loadLayout, deleteLayout, setActiveLayout }
}

function SortableTile({ id, title, children, customize }: { id: WidgetId; title: string; children: React.ReactNode; customize: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${customize ? 'border border-dashed border-blue-400/60 dark:border-blue-500/50 rounded-lg' : ''}`}
    >
      {customize && (
        <button
          {...listeners}
          {...attributes}
          className="absolute right-2 top-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-10 bg-white/60 dark:bg-black/40 backdrop-blur px-2 py-0.5 rounded"
          aria-label="Drag widget"
          title={title}
        >
          ::
        </button>
      )}
      <React.Suspense fallback={<ChartSkeleton />}>{children}</React.Suspense>
    </div>
  )
}

export interface CustomizableWidgetsBoardProps {
  activity: {
    todayScore: number
    todayCompleted: number
    todayTotal: number
    history: Record<string, { completed: number; total: number; score: number }>
    onOpenDailyChecklist: () => void
  }
  onCustomizeChange?: (isCustomizing: boolean) => void
  isEditMode?: boolean
  onExitEditMode?: () => void
}

export function CustomizableWidgetsBoard(props: CustomizableWidgetsBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const customize = props.isEditMode ?? false
  const { order, setOrder, hidden, show, reset, activeLayout, savedLayouts, saveLayoutAs, loadLayout, deleteLayout } = usePersistentLayout(customize)
  const [newLayoutName, setNewLayoutName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [previousEditMode, setPreviousEditMode] = useState(false)
  const [isNewLayoutSession, setIsNewLayoutSession] = useState(false)
  const onCustomizeChangeRef = useRef(props.onCustomizeChange)

  // Keep ref in sync so we can call latest callback from effects without changing deps shape
  useEffect(() => {
    onCustomizeChangeRef.current = props.onCustomizeChange
  }, [props.onCustomizeChange])


  // Track changes to detect when layout has been modified
  useEffect(() => {
    if (customize) {
      setHasUnsavedChanges(true)
    }
  }, [order, hidden, customize])

  // Detect when exiting edit mode and prompt for save if there are changes
  useEffect(() => {
    if (previousEditMode && !customize && hasUnsavedChanges) {
      // User just exited edit mode and has unsaved changes
      setShowSaveDialog(true)
    }
    setPreviousEditMode(customize)
  }, [customize, previousEditMode, hasUnsavedChanges])

  // Listen for save layout events from the main toolbar
  useEffect(() => {
    const handleSaveLayout = (event: CustomEvent) => {
      const layoutName = event.detail
      if (layoutName) {
        saveLayoutAs(layoutName)
        setHasUnsavedChanges(false)
        setIsNewLayoutSession(false)
        // Exit edit mode after saving
        onCustomizeChangeRef.current?.(false)
      }
    }

    window.addEventListener('saveLayout', handleSaveLayout as EventListener)
    return () => {
      window.removeEventListener('saveLayout', handleSaveLayout as EventListener)
    }
  }, [saveLayoutAs])

  // Listen for active layout switch requests from header
  useEffect(() => {
    const handleSetActiveLayout = (event: CustomEvent) => {
      const name = event.detail as string
      if (name) {
        loadLayout(name)
      }
    }
    window.addEventListener('setActiveLayout', handleSetActiveLayout as EventListener)
    return () => {
      window.removeEventListener('setActiveLayout', handleSetActiveLayout as EventListener)
    }
  }, [loadLayout])

  // Start a new layout session from header
  useEffect(() => {
    const handleStartNew = () => {
      setIsNewLayoutSession(true)
      setHasUnsavedChanges(true)
    }
    window.addEventListener('startNewLayoutSession', handleStartNew)
    return () => {
      window.removeEventListener('startNewLayoutSession', handleStartNew)
    }
  }, [])

  const widgetsById = useMemo(() => {
    const map = Object.fromEntries(ALL_WIDGETS.map(w => [w.id, w])) as Record<WidgetId, WidgetDef>
    // Inject widgets that require props
    if (props.activity) {
      map["activity-journal-heatmap"] = {
        id: "activity-journal-heatmap",
        title: "Activity Journal Heatmap",
        render: () => (
          <ActivityJournalHeatmap
            todayScore={props.activity!.todayScore}
            todayCompleted={props.activity!.todayCompleted}
            todayTotal={props.activity!.todayTotal}
            history={props.activity!.history}
            onOpenDailyChecklist={props.activity!.onOpenDailyChecklist}
          />
        ),
      }
    }
    map["calendar"] = {
      id: "calendar",
      title: "Calendar",
      render: () => <TradeDashboardCalendar />,
    }
    return map
  }, [props.activity])
  const visibleOrder = order.filter(id => !hidden[id])

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = visibleOrder.indexOf(active.id as WidgetId)
    const newIndex = visibleOrder.indexOf(over.id as WidgetId)
    const rearranged = arrayMove(visibleOrder, oldIndex, newIndex)

    // merge back with hidden ones preserving their relative order at the end
    const hiddenIds = order.filter(id => hidden[id])
    setOrder([...rearranged, ...hiddenIds])
  }

  const handleSaveLayout = () => {
    const trimmed = newLayoutName.trim()
    if (!trimmed) return
    
    saveLayoutAs(trimmed)
    setHasUnsavedChanges(false)
    setShowSaveDialog(false)
    setNewLayoutName("")
    // Ensure we exit edit mode after saving via dialog as well
    onCustomizeChangeRef.current?.(false)
  }

  const handleSkipSave = () => {
    setHasUnsavedChanges(false)
    setShowSaveDialog(false)
    setNewLayoutName("")
  }

  const toggleHidden = (id: WidgetId) => show(id, hidden[id])

  const getSpanClasses = (id: WidgetId) => {
    switch (id) {
      case "calendar":
        return "col-span-1 md:col-span-2 xl:col-span-2 md:row-span-2 xl:row-span-2"
      case "yearly-calendar":
        // Full width on xl (3 cols), 2 cols on md, 1 on mobile
        return "col-span-1 md:col-span-2 xl:col-span-3"
      default:
        // Default single column tile
        return "col-span-1"
    }
  }

  return (
    <div className="space-y-3">
      

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={visibleOrder}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 grid-flow-row-dense">
            {visibleOrder.map(id => {
              const def = widgetsById[id]
              if (!def) return null
              const span = getSpanClasses(id)
              return (
                <div key={id} className={span}>
                  <SortableTile id={id} title={def.title} customize={customize}>
                    {def.render()}
                  </SortableTile>
                </div>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Save Layout Dialog */}
      <Dialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a] shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Layout Changes
            </Dialog.Title>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You've made changes to your dashboard layout. Would you like to save these changes as a new layout?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Layout Name
                </label>
                <input
                  type="text"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  placeholder="Enter layout name..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newLayoutName.trim()) {
                      handleSaveLayout()
                    } else if (e.key === 'Escape') {
                      handleSkipSave()
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <FancyButton
                  variant="outline"
                  className="px-3 py-2 text-sm"
                  onClick={handleSkipSave}
                >
                  Skip Saving
                </FancyButton>
                <FancyButton
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm"
                  onClick={handleSaveLayout}
                  disabled={!newLayoutName.trim()}
                >
                  Save Layout
                </FancyButton>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  )
}

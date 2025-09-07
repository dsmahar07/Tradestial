/**
 * Lazy-loaded components for code splitting and performance optimization
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading component for lazy-loaded components
const LoadingComponent = () => {
  const React = require('react')
  return React.createElement('div', 
    { className: "flex items-center justify-center p-8" },
    React.createElement('div', 
      { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }
    )
  )
}

// Heavy chart components - lazy loaded
export const SymbolPerformanceChart = dynamic(
  () => import('@/components/ui/symbol-performance-chart'),
  { loading: LoadingComponent, ssr: false }
)

export const AdvanceRadar = dynamic(
  () => import('@/components/ui/advance-radar'),
  { loading: LoadingComponent, ssr: false }
)

export const AccountBalanceChart = dynamic(
  () => import('@/components/ui/account-balance-chart'),
  { loading: LoadingComponent, ssr: false }
)

export const CumulativePnlBar = dynamic(
  () => import('@/components/ui/cumulative-pnl-bar'),
  { loading: LoadingComponent, ssr: false }
)

export const TradeDashboardCalendar = dynamic(
  () => import('@/components/ui/trade-dashboard-calendar'),
  { loading: LoadingComponent, ssr: false }
)

export const PerformanceWeekDays = dynamic(
  () => import('@/components/ui/performance-week-days'),
  { loading: LoadingComponent, ssr: false }
)

// Heavy feature components
export const ActivityJournalHeatmap = dynamic(
  () => import('@/components/features/activity-journal-heatmap'),
  { loading: LoadingComponent, ssr: false }
)

export const StialChat = dynamic(
  () => import('@/components/ui/stial-chat').then(mod => ({ default: mod.StialChat })),
  { loading: LoadingComponent, ssr: false }
)

// Analytics components
export const AnalyticsOverview = dynamic(
  () => import('@/app/analytics/overview/page'),
  { loading: LoadingComponent }
)

// Model/Strategy components
export const StrategyMaker = dynamic(
  () => import('@/components/features/strategy-maker'),
  { loading: LoadingComponent, ssr: false }
)

export const StrategyOverview = dynamic(
  () => import('@/components/features/strategy-overview'),
  { loading: LoadingComponent, ssr: false }
)

'use client'

import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { PerformanceChart } from '@/components/analytics/performance-chart'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'
import { ChevronDown, TrendingUp, TrendingDown, Sparkles, Award } from 'lucide-react'


// Base mock data for charts
const baseDailyData = [
  { date: '2024-01-07', value: 0 }, // Sun
  { date: '2024-01-08', value: 2 }, // Mon
  { date: '2024-01-09', value: 1.57 }, // Tue
  { date: '2024-01-10', value: 2.75 }, // Wed
  { date: '2024-01-11', value: 1.67 }, // Thu
  { date: '2024-01-12', value: 1 }, // Fri
  { date: '2024-01-13', value: 0 } // Sat
]

const baseHoldTimeData = [
  { date: '2024-01-07', value: 0 }, // Sun
  { date: '2024-01-08', value: 5 }, // Mon
  { date: '2024-01-09', value: 20 }, // Tue
  { date: '2024-01-10', value: 25 }, // Wed
  { date: '2024-01-11', value: 30 }, // Thu
  { date: '2024-01-12', value: 15 }, // Fri
  { date: '2024-01-13', value: 0 } // Sat
]

// Generate mock data for different metrics based on base patterns
const generateMockData = (baseData: typeof baseDailyData, multiplier: number = 1, offset: number = 0) => {
  return baseData.map(point => ({
    ...point,
    value: Math.max(0, (point.value * multiplier) + offset)
  }))
}

// Dynamic summary data based on active filter
const getSummaryData = (filter: string) => {
  switch (filter) {
    case 'days':
      return [
        { period: 'Sunday', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'Monday', avgLoss: '-$350', avgVolume: 2, avgWin: '$0', grossPnL: '-$700', tradeCount: 2, winRate: '0%' },
        { period: 'Tuesday', avgLoss: '$222.5', avgVolume: 1.57, avgWin: '$676.67', grossPnL: '$3,170', tradeCount: 10, winRate: '60%' },
        { period: 'Wednesday', avgLoss: '-$912.5', avgVolume: 2.75, avgWin: '$1,057.5', grossPnL: '$435', tradeCount: 6, winRate: '50%' },
        { period: 'Thursday', avgLoss: '-$405', avgVolume: 1.67, avgWin: '$3,510', grossPnL: '$2,700', tradeCount: 4, winRate: '33.33%' },
        { period: 'Friday', avgLoss: '$0', avgVolume: 1, avgWin: '$1,031.67', grossPnL: '$3,095', tradeCount: 3, winRate: '100%' },
        { period: 'Saturday', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' }
      ]
    case 'months':
      return [
        { period: 'January', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'February', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'March', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'April', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'May', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'June', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'July', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'August', avgLoss: '-$180', avgVolume: 3, avgWin: '$1,035', grossPnL: '$1,890', tradeCount: 3, winRate: '66.67%' },
        { period: 'September', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'October', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'November', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: 'December', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' }
      ]
    case 'trade-time':
      return [
        { period: '00:00 - 18:00', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: '19:00', avgLoss: '-$180', avgVolume: 1.5, avgWin: '$1,035', grossPnL: '$1,890', tradeCount: 3, winRate: '66.67%' },
        { period: '20:00 - 23:00', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' }
      ]
    case 'trade-duration':
      return [
        { period: '<1m', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: '1-1:59m', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: '2-4:59m', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: '5-9:59m', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: '10-29:59m', avgLoss: '-$180', avgVolume: 1, avgWin: '$45', grossPnL: '-$135', tradeCount: 2, winRate: '50%' },
        { period: '30-59:59m', avgLoss: '$0', avgVolume: 1, avgWin: '$2,025', grossPnL: '$2,025', tradeCount: 1, winRate: '100%' },
        { period: '1-1:59h', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' },
        { period: '2-3:59h', avgLoss: '$0', avgVolume: 0, avgWin: '$0', grossPnL: '$0', tradeCount: 0, winRate: '0%' }
      ]
    default:
      return getSummaryData('days')
  }
}

// Dynamic metrics based on active filter
const getTopMetrics = (filter: string) => {
  const baseMetrics = {
    'days': {
      bestPeriod: { label: 'Best performing day', value: 'Tuesday', subValue: '10 trades • $3,170', positive: true },
      leastPeriod: { label: 'Least performing day', value: 'Monday', subValue: '2 trades • -$700', positive: false },
      mostActive: { label: 'Most active day', value: 'Tuesday', subValue: '10 trades', positive: true },
      bestWinRate: { label: 'Best win rate', value: 'Friday', subValue: '100% • 3 trades', positive: true }
    },
    'months': {
      bestPeriod: { label: 'Best performing month', value: 'August', subValue: '3 trades • $1,890', positive: true },
      leastPeriod: { label: 'Least performing month', value: 'August', subValue: '3 trades • $1,890', positive: true },
      mostActive: { label: 'Most active month', value: 'August', subValue: '3 trades', positive: true },
      bestWinRate: { label: 'Best win rate', value: 'August', subValue: '66.67% • 3 trades', positive: true }
    },
    'trade-time': {
      bestPeriod: { label: 'Best performing hour', value: '19:00', subValue: '3 trades • $1,890', positive: true },
      leastPeriod: { label: 'Least performing hour', value: '19:00', subValue: '3 trades • $1,890', positive: true },
      mostActive: { label: 'Most active hour', value: '19:00', subValue: '3 trades', positive: true },
      bestWinRate: { label: 'Best win rate', value: '19:00', subValue: '66.67% • 3 trades', positive: true }
    },
    'trade-duration': {
      bestPeriod: { label: 'Best performing trade duration', value: '30-59:59m', subValue: '1 trade • $2,025', positive: true },
      leastPeriod: { label: 'Least performing trade duration', value: '10-29:59m', subValue: '2 trades • -$135', positive: false },
      mostActive: { label: 'Most active trade duration', value: '10-29:59m', subValue: '2 trades', positive: true },
      bestWinRate: { label: 'Best win rate', value: '30-59:59m', subValue: '100% • 1 trade', positive: true }
    }
  }
  return baseMetrics[filter as keyof typeof baseMetrics] || baseMetrics.days
}

// Dynamic column headers based on filter
const getColumnHeaders = (filter: string) => {
  const headers = {
    'days': { period: 'Days', volume: 'Avg daily volume' },
    'months': { period: 'Months', volume: 'Avg monthly volume' },
    'trade-time': { period: 'Hours', volume: 'Avg trade volume' },
    'trade-duration': { period: 'Trade durations', volume: 'Avg daily volume' }
  }
  return headers[filter as keyof typeof headers] || headers.days
}

export default function DayTimePage() {
  usePageTitle('Analytics - Day & Time Report')

  const [activeFilter, setActiveFilter] = useState('days')
  const [selectedMetric, setSelectedMetric] = useState<'GROSS P&L' | 'NET P&L'>('GROSS P&L')
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)
  const metricMenuRef = useRef<HTMLDivElement>(null)

  // Close metric dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (metricMenuRef.current && !metricMenuRef.current.contains(target)) {
        setMetricMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTabChange = (tabId: string) => {
    console.log('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    console.log(`Selected ${itemId} from ${tabId} tab`)
  }

  // Dynamic chart configuration based on active filter
  const getChartConfigurations = () => {
    const configs = {
      'days': {
        chart1: { title: 'Avg daily volume', data: baseDailyData },
        chart2: { title: 'Avg hold time', data: baseHoldTimeData }
      },
      'months': {
        chart1: { title: 'Avg monthly volume', data: generateMockData(baseDailyData, 25, 10) },
        chart2: { title: 'Avg hold time', data: baseHoldTimeData }
      },
      'trade-time': {
        chart1: { title: 'Avg trade volume', data: generateMockData(baseDailyData, 1.5, 0.5) },
        chart2: { title: 'Avg hold time', data: baseHoldTimeData }
      },
      'trade-duration': {
        chart1: { title: 'Avg daily volume', data: baseDailyData },
        chart2: { title: 'Avg hold time', data: baseHoldTimeData }
      }
    }
    return configs[activeFilter as keyof typeof configs] || configs.days
  }

  // Get current chart data based on active filter
  const currentChartConfig = getChartConfigurations()

  const firstChartData = {
    title: currentChartConfig.chart1.title,
    timeframe: 'Day' as const,
    data: currentChartConfig.chart1.data,
    color: '#335CFF'
  }

  const secondChartData = {
    title: currentChartConfig.chart2.title,
    timeframe: 'Day' as const,
    data: currentChartConfig.chart2.data,
    color: '#FA7319'
  }

  const filters = [
    { id: 'days', label: 'days' },
    { id: 'months', label: 'months' },
    { id: 'trade-time', label: 'trade time' },
    { id: 'trade-duration', label: 'trade duration' }
  ]

  // Get dynamic metrics and data based on active filter
  const currentMetrics = getTopMetrics(activeFilter)
  const summaryData = getSummaryData(activeFilter)
  const columnHeaders = getColumnHeaders(activeFilter)

  // Metrics for top cards
  const topMetrics = [
    {
      label: currentMetrics.bestPeriod.label,
      value: currentMetrics.bestPeriod.value,
      subValue: currentMetrics.bestPeriod.subValue,
      icon: '📈',
      positive: currentMetrics.bestPeriod.positive
    },
    {
      label: currentMetrics.leastPeriod.label,
      value: currentMetrics.leastPeriod.value, 
      subValue: currentMetrics.leastPeriod.subValue,
      icon: '📉',
      positive: currentMetrics.leastPeriod.positive
    },
    {
      label: currentMetrics.mostActive.label,
      value: currentMetrics.mostActive.value,
      subValue: currentMetrics.mostActive.subValue,
      icon: '🎯',
      positive: currentMetrics.mostActive.positive
    },
    {
      label: currentMetrics.bestWinRate.label,
      value: currentMetrics.bestWinRate.value,
      subValue: currentMetrics.bestWinRate.subValue,
      icon: '🎯',
      positive: currentMetrics.bestWinRate.positive
    }
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#0f0f0f]">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig.map(tab => ({
              ...tab,
              isActive: tab.id === 'reports'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#0f0f0f]"
                >
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {(() => {
                      const isBest = metric.label.includes('Best performing')
                      const isLeast = metric.label.includes('Least')
                      const isActive = metric.label.includes('Most active')
                      const iconClass = isBest
                        ? 'text-green-600'
                        : isLeast
                        ? 'text-red-600'
                        : isActive
                        ? 'text-amber-500'
                        : 'text-violet-600'
                      const IconComp = isBest
                        ? TrendingUp
                        : isLeast
                        ? TrendingDown
                        : isActive
                        ? Sparkles
                        : Award
                      return <IconComp className={`w-4 h-4 ${iconClass}`} />
                    })()}
                    <span>{metric.label}</span>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {metric.value}
                  </div>
                  {(() => {
                    const parts = metric.subValue.split('•').map((p) => p.trim())
                    const hasPnL = parts.some((p) => p.includes('$'))
                    const leftText = hasPnL ? parts.find((p) => !p.includes('$')) : parts.join(' / ')
                    const rightText = hasPnL ? parts.find((p) => p.includes('$')) : null
                    return (
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{leftText}</span>
                        {rightText ? (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full font-semibold',
                              metric.positive
                                ? 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                            )}
                          >
                            {rightText}
                          </span>
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
              ))}
            </div>

            {/* Filter Controls (Standalone pills + right dropdown, no container) */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center rounded-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                      "border-r border-gray-300 dark:border-gray-700 last:border-r-0",
                      activeFilter === filter.id
                        ? "bg-indigo-100 text-indigo-700 font-semibold dark:bg-indigo-500/20 dark:text-indigo-300"
                        : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#0f0f0f] dark:text-gray-300 dark:hover:bg-gray-800/60"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="relative" ref={metricMenuRef}>
                <button
                  onClick={() => setMetricMenuOpen((o) => !o)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between focus:outline-none"
                  aria-label="Select header metric"
                  aria-expanded={metricMenuOpen}
                  aria-haspopup="true"
                >
                  <span>{selectedMetric}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", metricMenuOpen && "rotate-180")} />
                </button>
                {metricMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[160px] overflow-hidden z-50">
                    <button
                      onClick={() => { setSelectedMetric('GROSS P&L'); setMetricMenuOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                      role="option"
                      aria-selected={selectedMetric === 'GROSS P&L'}
                    >
                      Gross P&L
                    </button>
                    <button
                      onClick={() => { setSelectedMetric('NET P&L'); setMetricMenuOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                      role="option"
                      aria-selected={selectedMetric === 'NET P&L'}
                    >
                      Net P&L
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceChart 
                data={firstChartData} 
                key={`chart1-${activeFilter}`}
                contextInfo={{
                  subTab: activeFilter,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (activeFilter) {
                      case 'days':
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                        return dayNames[index] || `Day ${index + 1}`
                      case 'months':
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                        return monthNames[index] || `Month ${index + 1}`
                      case 'trade-time':
                        const timeRanges = ['00:00 - 18:00', '19:00', '20:00 - 23:00']
                        return timeRanges[index] || `Time ${index + 1}`
                      case 'trade-duration':
                        const durationRanges = ['<1m', '1-1:59m', '2-4:59m', '5-9:59m', '10-29:59m', '30-59:59m', '1-1:59h', '2-3:59h']
                        return durationRanges[index] || `Duration ${index + 1}`
                      default:
                        return date
                    }
                  }
                }}
              />
              <PerformanceChart 
                data={secondChartData} 
                key={`chart2-${activeFilter}`}
                contextInfo={{
                  subTab: activeFilter,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (activeFilter) {
                      case 'days':
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                        return dayNames[index] || `Day ${index + 1}`
                      case 'months':
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                        return monthNames[index] || `Month ${index + 1}`
                      case 'trade-time':
                        const timeRanges = ['00:00 - 18:00', '19:00', '20:00 - 23:00']
                        return timeRanges[index] || `Time ${index + 1}`
                      case 'trade-duration':
                        const durationRanges = ['<1m', '1-1:59m', '2-4:59m', '5-9:59m', '10-29:59m', '30-59:59m', '1-1:59h', '2-3:59h']
                        return durationRanges[index] || `Duration ${index + 1}`
                      default:
                        return date
                    }
                  }
                }}
              />
            </div>

            {/* Summary Table */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">{columnHeaders.period}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg loss</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">{columnHeaders.volume}</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg win</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Gross P&L</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Trade count</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white font-medium">{row.period}</td>
                        <td className={cn(
                          "py-4 px-6 text-sm",
                          row.avgLoss.includes('-') ? "text-red-500" : "text-gray-900 dark:text-white"
                        )}>{row.avgLoss}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{row.avgVolume}</td>
                        <td className={cn(
                          "py-4 px-6 text-sm",
                          row.avgWin !== '$0' ? "text-green-500" : "text-gray-900 dark:text-white"
                        )}>{row.avgWin}</td>
                        <td className={cn(
                          "py-4 px-6 text-sm font-medium",
                          row.grossPnL.includes('-') ? "text-red-500" : 
                          row.grossPnL !== '$0' ? "text-green-500" : "text-gray-900 dark:text-white"
                        )}>{row.grossPnL}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{row.tradeCount}</td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{row.winRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross Analysis */}
            <div className="bg-white dark:bg-[#0f0f0f] rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cross analysis</h2>
                  <div className="flex items-center gap-4">
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>Account</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>Win rate</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>P&L</option>
                    </select>
                    <select className="text-sm border border-gray-300 dark:border-[#2a2a2a] rounded px-3 py-1 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white">
                      <option>Trades</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* Horizontal bar chart representation */}
                <div className="space-y-4">
                  {summaryData.map((item, index) => {
                    const pnlValue = parseFloat(item.grossPnL.replace(/[$,]/g, ''))
                    const maxValue = Math.max(...summaryData.map(d => Math.abs(parseFloat(d.grossPnL.replace(/[$,]/g, ''))))) || 3170
                    const barWidth = Math.abs(pnlValue) / maxValue * 100
                    const isPositive = pnlValue >= 0

                    return (
                      <div key={index} className="flex items-center">
                        <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                          {item.period}
                        </div>
                        <div className="flex-1 relative h-8">
                          {pnlValue !== 0 && (
                            <div
                              className={cn(
                                "h-full rounded flex items-center justify-end pr-2",
                                isPositive ? "bg-green-500" : "bg-red-500"
                              )}
                              style={{ width: `${barWidth}%` }}
                            >
                              <span className="text-white text-sm font-medium">
                                {item.grossPnL}
                              </span>
                            </div>
                          )}
                          {pnlValue === 0 && (
                            <div className="h-full flex items-center">
                              <span className="text-gray-400 text-sm">$0</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 text-right text-xs text-gray-500 dark:text-gray-400">
                  TradingView Paper Trading
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

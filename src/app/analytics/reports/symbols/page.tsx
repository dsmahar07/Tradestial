'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { PerformanceChart } from '@/components/analytics/performance-chart'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { cn } from '@/lib/utils'
import { ChevronDown, TrendingUp, TrendingDown, Award, Activity } from 'lucide-react'

// Simple helpers
function formatCurrency(n: number) {
  const sign = n < 0 ? '-' : ''
  const val = Math.abs(n)
  return `${sign}$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function SymbolsPage() {
  usePageTitle('Analytics - Symbols Report')
  
  // Tabs on the top nav
  const handleTabChange = (tabId: string) => {
    console.log('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    console.log(`Selected ${itemId} from ${tabId} tab`)
  }

  // Local sub-tabs inside Symbols page
  const [subTab, setSubTab] = useState<'symbols' | 'instruments' | 'prices'>('symbols')

  // Controls: Top N and P&L metric dropdowns (custom, no shadcn)
  const [topN, setTopN] = useState<number>(50)
  const [pnlMetric, setPnlMetric] = useState<'NET P&L' | 'GROSS P&L'>('GROSS P&L')
  const [openMenu, setOpenMenu] = useState<'top' | 'pnl' | null>(null)
  const topMenuRef = useRef<HTMLDivElement>(null)
  const pnlMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (openMenu === 'top' && topMenuRef.current && !topMenuRef.current.contains(t)) setOpenMenu(null)
      if (openMenu === 'pnl' && pnlMenuRef.current && !pnlMenuRef.current.contains(t)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [openMenu])

  // Get labels based on current tab
  const getLabels = () => {
    switch (subTab) {
      case 'symbols': return { singular: 'symbol', plural: 'symbols', title: 'Symbol' }
      case 'instruments': return { singular: 'instrument', plural: 'instruments', title: 'Instruments' }
      case 'prices': return { singular: 'price', plural: 'prices', title: 'Prices' }
      default: return { singular: 'symbol', plural: 'symbols', title: 'Symbol' }
    }
  }
  
  const labels = getLabels()
  
  // Dynamic data based on active sub-tab
  const getDataForTab = () => {
    switch (subTab) {
      case 'symbols':
        return [
          { item: 'NQ', trades: 3, netPnL: 1890, avgDailyVolume: 1.5, avgWin: 1035, avgLoss: 180, winRate: 66.67 },
          { item: 'ES', trades: 2, netPnL: 0, avgDailyVolume: 1, avgWin: 12.5, avgLoss: -12.5, winRate: 50 },
          { item: 'YM', trades: 5, netPnL: 1200, avgDailyVolume: 1.8, avgWin: 950, avgLoss: 380, winRate: 60 },
          { item: 'RTY', trades: 6, netPnL: -200, avgDailyVolume: 2.5, avgWin: 600, avgLoss: 450, winRate: 45 }
        ]
      case 'instruments':
        return [
          { item: 'Future', trades: 3, netPnL: 1890, avgDailyVolume: 1.5, avgWin: 1035, avgLoss: 180, winRate: 66.67 },
          { item: 'Option', trades: 2, netPnL: -200, avgDailyVolume: 0.8, avgWin: 300, avgLoss: 400, winRate: 45 },
          { item: 'Stock', trades: 6, netPnL: 800, avgDailyVolume: 2.2, avgWin: 450, avgLoss: 200, winRate: 60 },
          { item: 'ETF', trades: 4, netPnL: 500, avgDailyVolume: 1.1, avgWin: 380, avgLoss: 180, winRate: 55 }
        ]
      case 'prices':
        return [
          { item: '>$4,999.99', trades: 3, netPnL: 1890, avgDailyVolume: 0, avgWin: 0, avgLoss: 0, winRate: 66.67 },
          { item: '<$2', trades: 0, netPnL: 0, avgDailyVolume: 0, avgWin: 0, avgLoss: 0, winRate: 0 },
          { item: '$2-$4.99', trades: 0, netPnL: 0, avgDailyVolume: 0, avgWin: 0, avgLoss: 0, winRate: 0 },
          { item: '$5-$9.99', trades: 0, netPnL: 0, avgDailyVolume: 0, avgWin: 0, avgLoss: 0, winRate: 0 }
        ]
      default:
        return []
    }
  }
  
  const symbolStats = getDataForTab()

  const bestPerforming = useMemo(() => symbolStats.reduce((a, b) => (b.netPnL > a.netPnL ? b : a), symbolStats[0]), [symbolStats])
  const leastPerforming = useMemo(() => symbolStats.reduce((a, b) => (b.netPnL < a.netPnL ? b : a), symbolStats[0]), [symbolStats])
  const mostActive = useMemo(() => symbolStats.reduce((a, b) => (b.trades > a.trades ? b : a), symbolStats[0]), [symbolStats])
  const bestWinRate = useMemo(() => symbolStats.reduce((a, b) => (b.winRate > a.winRate ? b : a), symbolStats[0]), [symbolStats])

  // Generate categorical data based on active sub-tab
  const getCategoricalChartData = useMemo(() => {
    switch (subTab) {
      case 'symbols':
        return {
          loggedDaysChart: [
            { date: '2024-01-01', value: 24 }, // NQ
            { date: '2024-01-02', value: 18 }, // ES
            { date: '2024-01-03', value: 22 }, // YM
            { date: '2024-01-04', value: 15 }  // RTY
          ],
          avgDailyNetPnLChart: [
            { date: '2024-01-01', value: 820 },  // NQ
            { date: '2024-01-02', value: 0 },    // ES
            { date: '2024-01-03', value: 680 },  // YM
            { date: '2024-01-04', value: -120 }  // RTY
          ]
        }
      case 'instruments':
        return {
          loggedDaysChart: [
            { date: '2024-01-01', value: 24 }, // Future
            { date: '2024-01-02', value: 12 }, // Option
            { date: '2024-01-03', value: 20 }, // Stock
            { date: '2024-01-04', value: 16 }  // ETF
          ],
          avgDailyNetPnLChart: [
            { date: '2024-01-01', value: 820 },  // Future
            { date: '2024-01-02', value: -80 },  // Option
            { date: '2024-01-03', value: 450 },  // Stock
            { date: '2024-01-04', value: 280 }   // ETF
          ]
        }
      case 'prices':
        return {
          loggedDaysChart: [
            { date: '2024-01-01', value: 24 }, // >$4,999.99
            { date: '2024-01-02', value: 0 },  // <$2
            { date: '2024-01-03', value: 0 },  // $2-$4.99
            { date: '2024-01-04', value: 0 }   // $5-$9.99
          ],
          avgDailyNetPnLChart: [
            { date: '2024-01-01', value: 820 },  // >$4,999.99
            { date: '2024-01-02', value: 0 },    // <$2
            { date: '2024-01-03', value: 0 },    // $2-$4.99
            { date: '2024-01-04', value: 0 }     // $5-$9.99
          ]
        }
      default:
        return {
          loggedDaysChart: [
            { date: '2024-01-01', value: 24 },
            { date: '2024-01-02', value: 18 },
            { date: '2024-01-03', value: 22 },
            { date: '2024-01-04', value: 15 }
          ],
          avgDailyNetPnLChart: [
            { date: '2024-01-01', value: 820 },
            { date: '2024-01-02', value: 0 },
            { date: '2024-01-03', value: 680 },
            { date: '2024-01-04', value: -120 }
          ]
        }
    }
  }, [subTab])

  // Charts: Use categorical data for proper X-axis labeling
  const loggedDaysChart = {
    title: 'Logged days',
    timeframe: 'Day' as const,
    data: getCategoricalChartData.loggedDaysChart
  }

  const avgDailyNetPnLChart = {
    title: 'Avg daily net P&L',
    timeframe: 'Day' as const,
    data: getCategoricalChartData.avgDailyNetPnLChart
  }

  // Cross analysis mock values per month and metric - dynamic based on sub-tab
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  type MatrixMetric = 'Win rate' | 'P&L' | 'Trades'
  const [matrixMetric, setMatrixMetric] = useState<MatrixMetric>('P&L')
  
  const getCrossAnalysisData = () => {
    switch (subTab) {
      case 'symbols':
        return {
          'NQ': [0,0,0,0,0,0,0,1890,0,0,0,0].map((v) => (matrixMetric === 'Trades' ? Math.max(0, Math.round(v/630)) : matrixMetric === 'Win rate' ? (v > 0 ? 66.67 : 0) : v)),
          'ES': [0,0,0,0,0,12.5,12.5,0,0,0,0,0].map((v, i) => (matrixMetric === 'Trades' ? Math.max(0, Math.round(v/12)) : v))
        }
      case 'instruments':
        return {
          'Future': [0,0,0,0,0,0,0,1890,0,0,0,0].map((v) => (matrixMetric === 'Trades' ? Math.max(0, Math.round(v/630)) : matrixMetric === 'Win rate' ? (v > 0 ? 66.67 : 0) : v)),
          'Option': [0,0,0,0,0,0,0,0,0,0,0,0].map((v, i) => (matrixMetric === 'Trades' ? 0 : v))
        }
      case 'prices':
        return {
          '>$4,999.99': [0,0,0,0,0,0,0,1890,0,0,0,0].map((v) => (matrixMetric === 'Trades' ? Math.max(0, Math.round(v/630)) : matrixMetric === 'Win rate' ? (v > 0 ? 66.67 : 0) : v)),
          '<$2': [0,0,0,0,0,0,0,0,0,0,0,0].map((v, i) => (matrixMetric === 'Trades' ? 0 : v))
        }
      default:
        return {}
    }
  }
  
  const crossValues: Record<string, number[]> = useMemo(() => getCrossAnalysisData(), [subTab, matrixMetric])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-gray-800">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig.map(tab => ({
              ...tab,
              isActive: tab.id === 'reports'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#1C1C1C]">
          <div className="w-full">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Symbols Report</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Performance analysis by trading symbols and instruments
              </p>
            </div>

            {/* Toolbar: left sub-tabs + right controls in same line */}
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                {(['symbols','instruments','prices'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setSubTab(k)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md border',
                      subTab === k
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-[#171717] dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800/60'
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={topMenuRef}>
                  <button
                    onClick={() => setOpenMenu(openMenu === 'top' ? null : 'top')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[110px] justify-between"
                    aria-expanded={openMenu === 'top'}
                    aria-haspopup="true"
                  >
                    <span>Top {topN}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", openMenu === 'top' && "rotate-180")} />
                  </button>
                  {openMenu === 'top' && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[140px] overflow-hidden z-50">
                      {[5,10,20,50].map(n => (
                        <button
                          key={n}
                          onClick={() => { setTopN(n); setOpenMenu(null) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                          role="option"
                          aria-selected={topN === n}
                        >
                          Top {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={pnlMenuRef}>
                  <button
                    onClick={() => setOpenMenu(openMenu === 'pnl' ? null : 'pnl')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between"
                    aria-expanded={openMenu === 'pnl'}
                    aria-haspopup="true"
                  >
                    <span>{pnlMetric}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", openMenu === 'pnl' && "rotate-180")} />
                  </button>
                  {openMenu === 'pnl' && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[160px] overflow-hidden z-50">
                      {(['NET P&L','GROSS P&L'] as const).map(val => (
                        <button
                          key={val}
                          onClick={() => { setPnlMetric(val); setOpenMenu(null) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                          role="option"
                          aria-selected={pnlMetric === val}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Best performing {labels.singular}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{bestPerforming?.item}</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{bestPerforming?.trades} trades</div>
                <div className="mt-1 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">{formatCurrency(bestPerforming?.netPnL || 0)}</div>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Least performing {labels.singular}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{leastPerforming?.item}</div>
                  </div>
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{leastPerforming?.trades} trades</div>
                <div className="mt-1 text-rose-600 dark:text-rose-400 text-sm font-semibold">{formatCurrency(leastPerforming?.netPnL || 0)}</div>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Most active {labels.singular}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{mostActive?.item}</div>
                  </div>
                  <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{mostActive?.trades} trades</div>
                <div className="mt-1 text-gray-700 dark:text-gray-300 text-sm font-semibold">Avg daily vol {mostActive?.avgDailyVolume}</div>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Best win rate</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{bestWinRate?.item}</div>
                  </div>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{bestWinRate?.trades} trades</div>
                <div className="mt-1 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">{bestWinRate?.winRate}%</div>
              </div>
            </div>

            

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <PerformanceChart 
                data={loggedDaysChart}
                contextInfo={{
                  subTab: subTab,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (subTab) {
                      case 'symbols':
                        const symbolLabels = ['NQ', 'ES', 'YM', 'RTY']
                        return symbolLabels[index] || `Symbol ${index + 1}`
                      case 'instruments':
                        const instrumentLabels = ['Future', 'Option', 'Stock', 'ETF']
                        return instrumentLabels[index] || `Instrument ${index + 1}`
                      case 'prices':
                        const priceLabels = ['>$4,999.99', '<$2', '$2-$4.99', '$5-$9.99']
                        return priceLabels[index] || `Price ${index + 1}`
                      default:
                        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  }
                }}
              />
              <PerformanceChart 
                data={avgDailyNetPnLChart}
                contextInfo={{
                  subTab: subTab,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (subTab) {
                      case 'symbols':
                        const symbolLabels = ['NQ', 'ES', 'YM', 'RTY']
                        return symbolLabels[index] || `Symbol ${index + 1}`
                      case 'instruments':
                        const instrumentLabels = ['Future', 'Option', 'Stock', 'ETF']
                        return instrumentLabels[index] || `Instrument ${index + 1}`
                      case 'prices':
                        const priceLabels = ['>$4,999.99', '<$2', '$2-$4.99', '$5-$9.99']
                        return priceLabels[index] || `Price ${index + 1}`
                      default:
                        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  }
                }}
              />
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Summary</div>
                <div className="text-xs text-gray-500">Settings</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Symbols</th>
                      <th className="px-4 py-3 font-medium">Win %</th>
                      <th className="px-4 py-3 font-medium">Net P&L</th>
                      <th className="px-4 py-3 font-medium">Trade count</th>
                      <th className="px-4 py-3 font-medium">Avg daily volume</th>
                      <th className="px-4 py-3 font-medium">Avg win</th>
                      <th className="px-4 py-3 font-medium">Avg loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolStats.map((s, i) => (
                      <tr key={s.item} className={cn(i % 2 === 0 ? 'bg-white dark:bg-[#171717]' : 'bg-gray-50 dark:bg-[#191919]')}>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{s.item}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.winRate}%</td>
                        <td className={cn('px-4 py-3 font-semibold', s.netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>{formatCurrency(s.netPnL)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.trades}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.avgDailyVolume}</td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{formatCurrency(s.avgWin)}</td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400">{formatCurrency(s.avgLoss)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross analysis */}
            <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm mt-6">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Cross analysis</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Month</span>
                  {(['Win rate','P&L','Trades'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMatrixMetric(m)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded border',
                        matrixMetric === m
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-[#171717] dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800/60'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Symbols</th>
                      {months.map(m => (
                        <th key={m} className="px-4 py-3 font-medium">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(crossValues).map(([sym, vals], rowIndex) => (
                      <tr key={sym} className={cn(rowIndex % 2 === 0 ? 'bg-white dark:bg-[#171717]' : 'bg-gray-50 dark:bg-[#191919]')}>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{sym}</td>
                        {vals.map((v, i) => (
                          <td key={`${sym}-${i}`} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {matrixMetric === 'P&L' ? formatCurrency(v) : matrixMetric === 'Win rate' ? `${v}%` : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
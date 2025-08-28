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
import { useAnalytics } from '@/hooks/use-analytics'

// Simple helpers
function formatCurrency(n: number) {
  const sign = n < 0 ? '-' : ''
  const val = Math.abs(n)
  return `${sign}$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default function SymbolsPage() {
  usePageTitle('Analytics - Symbols Report')
  
  const { trades, loading, error } = useAnalytics()
  
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
  
  // Calculate real data based on active sub-tab using actual trade data
  const getDataForTab = useMemo(() => {
    if (!trades?.length) return []

    const getValue = (trade: any) => {
      return pnlMetric === 'NET P&L' ? (trade.netPnl || 0) : (trade.grossPnl || trade.netPnl || 0)
    }

    switch (subTab) {
      case 'symbols': {
        // Group by symbol
        const symbolGroups: Record<string, any[]> = {}
        trades.forEach(trade => {
          if (!symbolGroups[trade.symbol]) symbolGroups[trade.symbol] = []
          symbolGroups[trade.symbol].push(trade)
        })

        return Object.entries(symbolGroups).map(([symbol, symbolTrades]) => {
          const wins = symbolTrades.filter(t => getValue(t) > 0)
          const losses = symbolTrades.filter(t => getValue(t) < 0)
          const winRate = symbolTrades.length > 0 ? (wins.length / symbolTrades.length) * 100 : 0
          const totalPnl = symbolTrades.reduce((sum, t) => sum + getValue(t), 0)
          const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + getValue(t), 0) / wins.length : 0
          const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + getValue(t), 0)) / losses.length : 0
          
          // Calculate daily volume - group trades by day
          const dailyGroups: Record<string, any[]> = {}
          symbolTrades.forEach(trade => {
            const day = trade.openDate.split('T')[0]
            if (!dailyGroups[day]) dailyGroups[day] = []
            dailyGroups[day].push(trade)
          })
          const avgDailyVolume = Object.keys(dailyGroups).length > 0 ? 
            Object.values(dailyGroups).reduce((sum, dayTrades) => 
              sum + dayTrades.reduce((s, t) => s + (t.contractsTraded || 0), 0), 0
            ) / Object.keys(dailyGroups).length : 0

          return {
            item: symbol,
            trades: symbolTrades.length,
            netPnL: totalPnl,
            avgDailyVolume: Number(avgDailyVolume.toFixed(1)),
            avgWin: avgWin,
            avgLoss: avgLoss,
            winRate: Number(winRate.toFixed(2))
          }
        }).sort((a, b) => b.netPnL - a.netPnL) // Sort by P&L descending
      }
      
      case 'instruments': {
        // Group by instrument type
        const instrumentGroups: Record<string, any[]> = {
          'Future': [],
          'Option': [],
          'Stock': [],
          'ETF': [],
          'Other': []
        }
        
        trades.forEach(trade => {
          const instrument = trade.instrument || trade.instrumentType || 'Other'
          let category = 'Other'
          
          if (instrument.toLowerCase().includes('future')) category = 'Future'
          else if (instrument.toLowerCase().includes('option')) category = 'Option'
          else if (instrument.toLowerCase().includes('stock')) category = 'Stock'
          else if (instrument.toLowerCase().includes('etf')) category = 'ETF'
          
          instrumentGroups[category].push(trade)
        })

        return Object.entries(instrumentGroups)
          .filter(([_, trades]) => trades.length > 0)
          .map(([instrument, instrumentTrades]) => {
            const wins = instrumentTrades.filter(t => getValue(t) > 0)
            const losses = instrumentTrades.filter(t => getValue(t) < 0)
            const winRate = instrumentTrades.length > 0 ? (wins.length / instrumentTrades.length) * 100 : 0
            const totalPnl = instrumentTrades.reduce((sum, t) => sum + getValue(t), 0)
            const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + getValue(t), 0) / wins.length : 0
            const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + getValue(t), 0)) / losses.length : 0
            
            const dailyGroups: Record<string, any[]> = {}
            instrumentTrades.forEach(trade => {
              const day = trade.openDate.split('T')[0]
              if (!dailyGroups[day]) dailyGroups[day] = []
              dailyGroups[day].push(trade)
            })
            const avgDailyVolume = Object.keys(dailyGroups).length > 0 ? 
              Object.values(dailyGroups).reduce((sum, dayTrades) => 
                sum + dayTrades.reduce((s, t) => s + (t.contractsTraded || 0), 0), 0
              ) / Object.keys(dailyGroups).length : 0

            return {
              item: instrument,
              trades: instrumentTrades.length,
              netPnL: totalPnl,
              avgDailyVolume: Number(avgDailyVolume.toFixed(1)),
              avgWin: avgWin,
              avgLoss: avgLoss,
              winRate: Number(winRate.toFixed(2))
            }
          }).sort((a, b) => b.netPnL - a.netPnL)
      }
      
      case 'prices': {
        // Group by price ranges
        const priceRanges = [
          { label: '<$2', min: 0, max: 2 },
          { label: '$2-$4.99', min: 2, max: 4.99 },
          { label: '$5-$9.99', min: 5, max: 9.99 },
          { label: '$10-$19.99', min: 10, max: 19.99 },
          { label: '$20-$49.99', min: 20, max: 49.99 },
          { label: '$50-$99.99', min: 50, max: 99.99 },
          { label: '$100-$499.99', min: 100, max: 499.99 },
          { label: '$500-$999.99', min: 500, max: 999.99 },
          { label: '$1,000-$4,999.99', min: 1000, max: 4999.99 },
          { label: '>$5,000', min: 5000, max: Infinity }
        ]

        const priceGroups: Record<string, any[]> = {}
        priceRanges.forEach(range => {
          priceGroups[range.label] = []
        })

        trades.forEach(trade => {
          const price = trade.entryPrice || 0
          const range = priceRanges.find(r => price >= r.min && price <= r.max)
          if (range) {
            priceGroups[range.label].push(trade)
          }
        })

        return Object.entries(priceGroups)
          .filter(([_, trades]) => trades.length > 0)
          .map(([priceRange, rangeTrades]) => {
            const wins = rangeTrades.filter(t => getValue(t) > 0)
            const losses = rangeTrades.filter(t => getValue(t) < 0)
            const winRate = rangeTrades.length > 0 ? (wins.length / rangeTrades.length) * 100 : 0
            const totalPnl = rangeTrades.reduce((sum, t) => sum + getValue(t), 0)
            const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + getValue(t), 0) / wins.length : 0
            const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + getValue(t), 0)) / losses.length : 0

            return {
              item: priceRange,
              trades: rangeTrades.length,
              netPnL: totalPnl,
              avgDailyVolume: 0, // Not applicable for price ranges
              avgWin: avgWin,
              avgLoss: avgLoss,
              winRate: Number(winRate.toFixed(2))
            }
          }).sort((a, b) => b.netPnL - a.netPnL)
      }
      
      default:
        return []
    }
  }, [trades, subTab, pnlMetric])
  
  const symbolStats = getDataForTab

  const bestPerforming = useMemo(() => 
    symbolStats.length > 0 ? symbolStats.reduce((a, b) => (b.netPnL > a.netPnL ? b : a), symbolStats[0]) : null, [symbolStats])
  const leastPerforming = useMemo(() => 
    symbolStats.length > 0 ? symbolStats.reduce((a, b) => (b.netPnL < a.netPnL ? b : a), symbolStats[0]) : null, [symbolStats])
  const mostActive = useMemo(() => 
    symbolStats.length > 0 ? symbolStats.reduce((a, b) => (b.trades > a.trades ? b : a), symbolStats[0]) : null, [symbolStats])
  const bestWinRate = useMemo(() => 
    symbolStats.length > 0 ? symbolStats.reduce((a, b) => (b.winRate > a.winRate ? b : a), symbolStats[0]) : null, [symbolStats])

  // Generate categorical chart data based on real trade data
  const getCategoricalChartData = useMemo(() => {
    if (!trades?.length || !symbolStats.length) {
      return {
        loggedDaysChart: [],
        avgDailyNetPnLChart: []
      }
    }

    return {
      loggedDaysChart: symbolStats.map((stat, index) => ({
        date: `2024-01-${(index + 1).toString().padStart(2, '0')}`, // Placeholder dates for chart
        value: stat.trades
      })),
      avgDailyNetPnLChart: symbolStats.map((stat, index) => ({
        date: `2024-01-${(index + 1).toString().padStart(2, '0')}`, // Placeholder dates for chart
        value: stat.trades > 0 ? Math.round(stat.netPnL / Math.max(1, stat.trades)) : 0 // Avg P&L per trade as proxy for daily
      }))
    }
  }, [trades, symbolStats])

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
    if (!trades?.length || !symbolStats.length) return {}

    const getValue = (trade: any) => {
      return pnlMetric === 'NET P&L' ? (trade.netPnl || 0) : (trade.grossPnl || trade.netPnl || 0)
    }

    // Create monthly data for each category in symbolStats
    const result: Record<string, number[]> = {}

    symbolStats.forEach(stat => {
      const categoryTrades = trades.filter(trade => {
        switch (subTab) {
          case 'symbols':
            return trade.symbol === stat.item
          case 'instruments':
            const instrument = trade.instrument || trade.instrumentType || 'Other'
            let category = 'Other'
            if (instrument.toLowerCase().includes('future')) category = 'Future'
            else if (instrument.toLowerCase().includes('option')) category = 'Option'
            else if (instrument.toLowerCase().includes('stock')) category = 'Stock'
            else if (instrument.toLowerCase().includes('etf')) category = 'ETF'
            return category === stat.item
          case 'prices':
            const price = trade.entryPrice || 0
            if (stat.item === '<$2') return price < 2
            if (stat.item === '$2-$4.99') return price >= 2 && price <= 4.99
            if (stat.item === '$5-$9.99') return price >= 5 && price <= 9.99
            if (stat.item === '$10-$19.99') return price >= 10 && price <= 19.99
            if (stat.item === '$20-$49.99') return price >= 20 && price <= 49.99
            if (stat.item === '$50-$99.99') return price >= 50 && price <= 99.99
            if (stat.item === '$100-$499.99') return price >= 100 && price <= 499.99
            if (stat.item === '$500-$999.99') return price >= 500 && price <= 999.99
            if (stat.item === '$1,000-$4,999.99') return price >= 1000 && price <= 4999.99
            if (stat.item === '>$5,000') return price >= 5000
            return false
          default:
            return false
        }
      })

      // Group trades by month and calculate metric for each month
      const monthlyData: number[] = []
      
      for (let month = 0; month < 12; month++) {
        const monthTrades = categoryTrades.filter(trade => {
          const tradeDate = new Date(trade.openDate)
          return tradeDate.getMonth() === month
        })

        let value = 0
        if (monthTrades.length > 0) {
          switch (matrixMetric) {
            case 'Trades':
              value = monthTrades.length
              break
            case 'Win rate':
              const wins = monthTrades.filter(t => getValue(t) > 0).length
              value = Number(((wins / monthTrades.length) * 100).toFixed(1))
              break
            case 'P&L':
              value = Number(monthTrades.reduce((sum, t) => sum + getValue(t), 0).toFixed(0))
              break
          }
        }
        
        monthlyData.push(value)
      }

      result[stat.item] = monthlyData
    })

    return result
  }
  
  const crossValues: Record<string, number[]> = useMemo(() => getCrossAnalysisData(), [subTab, matrixMetric])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#171717]">
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

            {/* Loading / Error */}
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse mb-4">Loading symbols data...</div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</div>
            )}
            {!loading && !error && !trades?.length && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">No trade data available. Please import your CSV data first.</div>
            )}

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
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[110px] justify-between"
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
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between"
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
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{bestPerforming?.item || '—'}</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{bestPerforming?.trades || 0} trades</div>
                <div className="mt-1 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">{formatCurrency(bestPerforming?.netPnL || 0)}</div>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Least performing {labels.singular}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{leastPerforming?.item || '—'}</div>
                  </div>
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{leastPerforming?.trades || 0} trades</div>
                <div className="mt-1 text-rose-600 dark:text-rose-400 text-sm font-semibold">{formatCurrency(leastPerforming?.netPnL || 0)}</div>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Most active {labels.singular}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{mostActive?.item || '—'}</div>
                  </div>
                  <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{mostActive?.trades || 0} trades</div>
                <div className="mt-1 text-gray-700 dark:text-gray-300 text-sm font-semibold">Avg daily vol {mostActive?.avgDailyVolume || 0}</div>
              </div>
              <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Best win rate</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{bestWinRate?.item || '—'}</div>
                  </div>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{bestWinRate?.trades || 0} trades</div>
                <div className="mt-1 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">{bestWinRate?.winRate || 0}%</div>
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
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
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
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
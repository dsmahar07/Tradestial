'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { OptimizedPerformanceChart } from '@/components/analytics/optimized-performance-chart'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAnalytics } from '@/hooks/use-analytics'
import { cn } from '@/lib/utils'
import { ChevronDown, TrendingUp, TrendingDown, Award, Activity } from 'lucide-react'
import type { PerformanceChart as ChartShape } from '@/types/performance'

export default function RiskPage() {
  usePageTitle('Analytics - Risk Report')
  
  // Get real trade data
  const { trades, loading, error } = useAnalytics()
  
  // Controls & UI state
  const [activeSubTab, setActiveSubTab] = useState<'volumes' | 'position-sizes' | 'r-multiples'>('volumes')
  
  // UI state for dropdowns
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [metricMenuOpen, setMetricMenuOpen] = useState(false)
  const [topN, setTopN] = useState(10)
  const [pnlMetric, setPnlMetric] = useState('NET P&L')
  const topMenuRef = useRef<HTMLDivElement>(null)
  const metricMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (topMenuRef.current && !topMenuRef.current.contains(target)) {
        setTopMenuOpen(false)
      }
      if (metricMenuRef.current && !metricMenuRef.current.contains(target)) {
        setMetricMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate categorical data based on active sub-tab
  const getCategoricalData = useMemo(() => {
    switch (activeSubTab) {
      case 'volumes':
        return {
          leftChart: [
            { date: '2024-01-01', value: 1890 }, // 1 to 4 volume
            { date: '2024-01-02', value: 800 },  // 5 to 9 volume  
            { date: '2024-01-03', value: 1200 }, // 10 to 19 volume
            { date: '2024-01-04', value: 950 },  // 20 to 49 volume
            { date: '2024-01-05', value: 600 },  // 50 to 99 volume
            { date: '2024-01-06', value: 400 }   // 100+ volume
          ],
          rightChart: [
            { date: '2024-01-01', value: 66.67 }, // 1 to 4 volume
            { date: '2024-01-02', value: 82.35 }, // 5 to 9 volume
            { date: '2024-01-03', value: 78.21 }, // 10 to 19 volume
            { date: '2024-01-04', value: 69.44 }, // 20 to 49 volume
            { date: '2024-01-05', value: 85.71 }, // 50 to 99 volume
            { date: '2024-01-06', value: 91.67 }  // 100+ volume
          ]
        }
      case 'position-sizes':
        return {
          leftChart: [
            { date: '2024-01-01', value: 4500 }, // $0-5k positions
            { date: '2024-01-02', value: 2300 }, // $5k-15k positions
            { date: '2024-01-03', value: 1800 }, // $15k-25k positions
            { date: '2024-01-04', value: 900 },  // $25k-50k positions
            { date: '2024-01-05', value: 600 }   // $50k+ positions
          ],
          rightChart: [
            { date: '2024-01-01', value: 72.22 }, // $0-5k positions
            { date: '2024-01-02', value: 68.97 }, // $5k-15k positions
            { date: '2024-01-03', value: 61.11 }, // $15k-25k positions
            { date: '2024-01-04', value: 83.33 }, // $25k-50k positions
            { date: '2024-01-05', value: 91.67 }  // $50k+ positions
          ]
        }
      case 'r-multiples':
        return {
          leftChart: [
            { date: '2024-01-01', value: 580 },   // -3R to -1R
            { date: '2024-01-02', value: 1200 },  // -1R to 0R
            { date: '2024-01-03', value: 2100 },  // 0R to 1R
            { date: '2024-01-04', value: 3800 },  // 1R to 3R
            { date: '2024-01-05', value: 2400 }   // 3R+
          ],
          rightChart: [
            { date: '2024-01-01', value: 0 },     // -3R to -1R (loss)
            { date: '2024-01-02', value: 8.33 },  // -1R to 0R 
            { date: '2024-01-03', value: 58.57 }, // 0R to 1R
            { date: '2024-01-04', value: 68.42 }, // 1R to 3R
            { date: '2024-01-05', value: 83.33 }  // 3R+
          ]
        }
      default:
        return { leftChart: [], rightChart: [] }
    }
  }, [activeSubTab])

  const leftChartData = useMemo(() => getCategoricalData.leftChart, [getCategoricalData])
  const rightChartData = useMemo(() => getCategoricalData.rightChart, [getCategoricalData])

  // Calculate real data based on active sub-tab and trades
  const currentTabData = useMemo(() => {
    if (!trades?.length) return []
    
    switch (activeSubTab) {
      case 'volumes': {
        // Group trades by volume ranges
        const volumeRanges = [
          { label: '1', min: 1, max: 1 },
          { label: '2-5', min: 2, max: 5 },
          { label: '6-10', min: 6, max: 10 },
          { label: '11-20', min: 11, max: 20 },
          { label: '20+', min: 21, max: Infinity }
        ]
        
        return volumeRanges.map(range => {
          const rangeTrades = trades.filter(trade => {
            const volume = trade.contractsTraded || 1
            return volume >= range.min && volume <= range.max
          })
          
          if (rangeTrades.length === 0) return null
          
          const wins = rangeTrades.filter(t => t.netPnl > 0)
          const losses = rangeTrades.filter(t => t.netPnl < 0)
          const totalPnL = rangeTrades.reduce((sum, t) => sum + t.netPnl, 0)
          const winRate = (wins.length / rangeTrades.length) * 100
          const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.netPnl, 0) / wins.length : 0
          const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.netPnl, 0)) / losses.length : 0
          const totalVolume = rangeTrades.reduce((sum, t) => sum + (t.contractsTraded || 1), 0)
          const uniqueDays = new Set(rangeTrades.map(t => t.openDate.split('T')[0])).size
          const avgDailyVolume = uniqueDays > 0 ? totalVolume / uniqueDays : 0
          
          return {
            item: range.label,
            winRate: Number(winRate.toFixed(2)),
            netPnL: Number(totalPnL.toFixed(2)),
            trades: rangeTrades.length,
            avgDailyVolume: Number(avgDailyVolume.toFixed(1)),
            avgWin: Number(avgWin.toFixed(2)),
            avgLoss: Number(avgLoss.toFixed(2))
          }
        }).filter(Boolean)
      }
      
      case 'position-sizes': {
        // Group trades by position size (price * quantity)
        const positionSizes = trades.map(trade => ({
          ...trade,
          positionSize: (trade.entryPrice || 0) * (trade.contractsTraded || 1)
        }))
        
        if (positionSizes.length === 0) return []
        
        // Create dynamic ranges based on actual data
        const sizes = positionSizes.map(t => t.positionSize).sort((a, b) => a - b)
        const min = sizes[0]
        const max = sizes[sizes.length - 1]
        const range = max - min
        const step = range / 4 // Create 4 ranges
        
        const sizeRanges = [
          { label: `$${min.toLocaleString()} to $${(min + step).toLocaleString()}`, min, max: min + step },
          { label: `$${(min + step).toLocaleString()} to $${(min + step * 2).toLocaleString()}`, min: min + step, max: min + step * 2 },
          { label: `$${(min + step * 2).toLocaleString()} to $${(min + step * 3).toLocaleString()}`, min: min + step * 2, max: min + step * 3 },
          { label: `$${(min + step * 3).toLocaleString()} and over`, min: min + step * 3, max: Infinity }
        ]
        
        return sizeRanges.map(range => {
          const rangeTrades = positionSizes.filter(trade => 
            trade.positionSize >= range.min && trade.positionSize < range.max
          )
          
          if (rangeTrades.length === 0) return null
          
          const wins = rangeTrades.filter(t => t.netPnl > 0)
          const losses = rangeTrades.filter(t => t.netPnl < 0)
          const totalPnL = rangeTrades.reduce((sum, t) => sum + t.netPnl, 0)
          const winRate = (wins.length / rangeTrades.length) * 100
          const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.netPnl, 0) / wins.length : 0
          const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.netPnl, 0)) / losses.length : 0
          const totalVolume = rangeTrades.reduce((sum, t) => sum + (t.contractsTraded || 1), 0)
          const uniqueDays = new Set(rangeTrades.map(t => t.openDate.split('T')[0])).size
          const avgDailyVolume = uniqueDays > 0 ? totalVolume / uniqueDays : 0
          
          return {
            item: range.label,
            winRate: Number(winRate.toFixed(2)),
            netPnL: Number(totalPnL.toFixed(2)),
            trades: rangeTrades.length,
            avgDailyVolume: Number(avgDailyVolume.toFixed(1)),
            avgWin: Number(avgWin.toFixed(2)),
            avgLoss: Number(avgLoss.toFixed(2))
          }
        }).filter(Boolean)
      }
      
      case 'r-multiples': {
        // R-Multiple analysis would require stop loss and take profit data
        // For now, return empty or basic analysis
        return [{
          item: 'R-Multiple Analysis',
          winRate: 0,
          netPnL: 0,
          trades: trades.length,
          avgDailyVolume: 0,
          avgWin: 0,
          avgLoss: 0
        }]
      }
      
      default:
        return []
    }
  }, [trades, activeSubTab])
  
  // Get best performers for cards
  const getBestPerformers = () => {
    if (!currentTabData.length) return { best: null, least: null, most: null, bestWinRate: null }
    
    return {
      best: currentTabData.reduce((a, b) => ((b?.netPnL ?? 0) > (a?.netPnL ?? 0) ? b : a), currentTabData[0]),
      least: currentTabData.reduce((a, b) => ((b?.netPnL ?? 0) < (a?.netPnL ?? 0) ? b : a), currentTabData[0]), 
      most: currentTabData.reduce((a, b) => ((b?.trades ?? 0) > (a?.trades ?? 0) ? b : a), currentTabData[0]),
      bestWinRate: currentTabData.reduce((a, b) => ((b?.winRate ?? 0) > (a?.winRate ?? 0) ? b : a), currentTabData[0])
    }
  }
  
  const performers = useMemo(() => getBestPerformers(), [getBestPerformers])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cumulativeChartData = useMemo(() => {
    let cumulative = 0
    return currentTabData.map((item, index) => {
      if (item) {
        cumulative += item.netPnL
      }
      return { date: `Day ${index + 1}`, value: cumulative }
    })
  }, [currentTabData])

  // Add loading and error states
  if (loading) {
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
              onTabChange={() => {}}
              onDropdownItemClick={() => {}}
            />
          </div>
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading risk analytics...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
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
              onTabChange={() => {}}
              onDropdownItemClick={() => {}}
            />
          </div>
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-red-500 mb-4">Error loading risk data</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!trades?.length) {
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
              onTabChange={() => {}}
              onDropdownItemClick={() => {}}
            />
          </div>
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No trading data available for risk analysis</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Import your CSV file to see risk metrics</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Mock series data for chart rendering (will be replaced with real data later)
  const mockSeries = [{ date: '2024-01-01', value: 0 }]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dailyNetSeries = mockSeries
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cumulativeNetSeries = mockSeries
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const drawdownSeries = mockSeries
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const volatilitySeries = mockSeries
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const avgPositionSizeSeries = mockSeries
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const winRateSeries = mockSeries
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tradeCountSeries = mockSeries

  // Charts: use categorical data for proper X-axis labeling
  const leftChart: ChartShape = {
    title: 'Net P&L',
    timeframe: 'Day' as const,
    data: leftChartData
  }

  const rightChart: ChartShape = {
    title: 'Win%',
    timeframe: 'Day' as const,
    data: rightChartData
  }

  const onDataRequest = (requestedData: unknown) => {
    console.log('Risk page data requested:', requestedData)
    // For now, return the cached data
    return {
      title: 'Risk Analysis',
      data: leftChart.data,
      color: leftChart.color,
      timeframe: leftChart.timeframe
    }
  }

  // Charts: use categorical data for proper X-axis labeling (these are already defined above)

  // Provide metric-specific series to PerformanceChart (duplicate removed, using the one defined above)

  // Helpers for JSX rendering
  // const lastCumVal = useMemo(() => (
  //   cumulativeNetSeries.length ? cumulativeNetSeries[cumulativeNetSeries.length - 1].value : 0
  // ), [cumulativeNetSeries])

  const handleTabChange = (tabId: string) => {
    console.log('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    console.log(`Selected ${itemId} from ${tabId} tab`)
  }

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
          <div className="w-full space-y-6">
            {/* Toolbar: sub-tabs (left) + controls (right) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex items-center rounded-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
                {([
                  { id: 'volumes', label: 'Volumes' },
                  { id: 'position-sizes', label: 'Position sizes' },
                  { id: 'r-multiples', label: 'R-multiples' }
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveSubTab(t.id)}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
                      'border-r border-gray-300 dark:border-gray-700 last:border-r-0',
                      activeSubTab === t.id
                        ? 'bg-indigo-100 text-indigo-700 font-semibold dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#0f0f0f] dark:text-gray-300 dark:hover:bg-gray-800/60'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {/* Top N dropdown */}
                <div className="relative" ref={topMenuRef}>
                  <button
                    onClick={() => setTopMenuOpen((o) => !o)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[120px] justify-between"
                    aria-label="Select Top N"
                    aria-expanded={topMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>Top {topN}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", topMenuOpen && "rotate-180")} />
                  </button>
                  {topMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[140px] overflow-hidden z-50">
                      {[5, 10, 20, 50].map((n) => (
                        <button
                          key={n}
                          onClick={() => { setTopN(n); setTopMenuOpen(false) }}
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
                {/* P&L metric dropdown */}
                <div className="relative" ref={metricMenuRef}>
                  <button
                    onClick={() => setMetricMenuOpen((o) => !o)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm border rounded-md transition-all duration-200 min-w-[140px] justify-between"
                    aria-label="Select P&L metric"
                    aria-expanded={metricMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>{pnlMetric}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", metricMenuOpen && "rotate-180")} />
                  </button>
                  {metricMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[160px] overflow-hidden z-50">
                      <button
                        onClick={() => { setPnlMetric('NET P&L'); setMetricMenuOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                        role="option"
                        aria-selected={pnlMetric === 'NET P&L'}
                      >
                        Net P&L
                      </button>
                      <button
                        onClick={() => { setPnlMetric('GROSS P&L'); setMetricMenuOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                        role="option"
                        aria-selected={pnlMetric === 'GROSS P&L'}
                      >
                        Gross P&L
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'best', label: `Best performing ${activeSubTab.replace('-', ' ')}`, icon: TrendingUp, color: 'text-[#10B981]' },
                { key: 'least', label: `Least performing ${activeSubTab.replace('-', ' ')}`, icon: TrendingDown, color: 'text-red-600' },
                { key: 'most', label: `Most active ${activeSubTab.slice(0, activeSubTab.length - (activeSubTab.endsWith('s') ? 1 : 0))}`.replace('position-size', 'position size'), icon: Activity, color: 'text-amber-500' },
                { key: 'win', label: 'Best win rate', icon: Award, color: 'text-violet-600' }
              ].map((m) => (
                <div key={m.key} className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#0f0f0f]">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <m.icon className={cn('w-4 h-4', m.color)} />
                    <span>{m.label}</span>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    {(() => {
                      switch (m.key) {
                        case 'best': return performers.best?.item || '—'
                        case 'least': return performers.least?.item || '—'
                        case 'most': return performers.most?.item || '—'
                        case 'win': return performers.bestWinRate?.item || '—'
                        default: return '—'
                      }
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      {(() => {
                        switch (m.key) {
                          case 'best': return performers.best ? `${performers.best.trades} trades` : 'No data'
                          case 'least': return performers.least ? `${performers.least.trades} trades` : 'No data'
                          case 'most': return performers.most ? `${performers.most.trades} trades` : 'No data'
                          case 'win': return performers.bestWinRate ? `${performers.bestWinRate.winRate}% • ${performers.bestWinRate.trades} trades` : 'No data'
                          default: return 'No data'
                        }
                      })()
                    }
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-semibold",
                      (() => {
                        const pnl = (() => {
                          switch (m.key) {
                            case 'best': return performers.best?.netPnL || 0
                            case 'least': return performers.least?.netPnL || 0
                            case 'most': return performers.most?.netPnL || 0
                            case 'win': return performers.bestWinRate?.netPnL || 0
                            default: return 0
                          }
                        })()
                        return pnl >= 0 ? 'bg-[#10B981]/10 text-[#10B981] dark:bg-[#10B981]/20 dark:text-[#10B981]' : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
                      })()
                    )}>
                      ${(() => {
                        switch (m.key) {
                          case 'best': return Math.abs(performers.best?.netPnL || 0).toLocaleString()
                          case 'least': return Math.abs(performers.least?.netPnL || 0).toLocaleString()
                          case 'most': return Math.abs(performers.most?.netPnL || 0).toLocaleString()
                          case 'win': return Math.abs(performers.bestWinRate?.netPnL || 0).toLocaleString()
                          default: return '0'
                        }
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading / Error Indicators */}
            {loading && (
              <div className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                Loading risk data...
              </div>
            )}
            {error && !loading && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Charts Section: using reusable PerformanceChart with computed datasets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OptimizedPerformanceChart 
                data={leftChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  subTab: activeSubTab,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (activeSubTab) {
                      case 'volumes':
                        const volumeRanges = ['1 to 4', '5 to 9', '10 to 19', '20 to 49', '50 to 99', '100+']
                        return volumeRanges[index] || `Volume ${index + 1}`
                      case 'position-sizes':
                        const positionRanges = ['<$1M', '$1M-$2M', '$2M-$3M', '$3M-$4M', '$4M-$5M', '>$5M']
                        return positionRanges[index] || `Position ${index + 1}`
                      case 'r-multiples':
                        const rMultipleRanges = ['<-2R', '-2R to -1R', '-1R to 0R', '0R to 1R', '1R to 2R', '>2R']
                        return rMultipleRanges[index] || `R-multiple ${index + 1}`
                      default:
                        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  }
                }}
              />
              <OptimizedPerformanceChart 
                data={rightChart} 
                onDataRequest={onDataRequest}
                contextInfo={{
                  subTab: activeSubTab,
                  getPeriodLabel: (date: string, index: number) => {
                    switch (activeSubTab) {
                      case 'volumes':
                        const volumeRanges = ['1 to 4', '5 to 9', '10 to 19', '20 to 49', '50 to 99', '100+']
                        return volumeRanges[index] || `Volume ${index + 1}`
                      case 'position-sizes':
                        const positionRanges = ['<$1M', '$1M-$2M', '$2M-$3M', '$3M-$4M', '$4M-$5M', '>$5M']
                        return positionRanges[index] || `Position ${index + 1}`
                      case 'r-multiples':
                        const rMultipleRanges = ['<-2R', '-2R to -1R', '-1R to 0R', '0R to 1R', '1R to 2R', '>2R']
                        return rMultipleRanges[index] || `R-multiple ${index + 1}`
                      default:
                        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {activeSubTab === 'volumes' ? 'Volumes' : activeSubTab === 'position-sizes' ? 'Position sizes' : 'R multiples'}
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Win %</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Net P&L</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Trade count</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg daily volume</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg win</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-400">Avg loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTabData.length === 0 ? (
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-6 px-6 text-sm text-gray-500 dark:text-gray-400" colSpan={7}>No data</td>
                      </tr>
                    ) : (
                      currentTabData.map((item, index) => (
                        <tr key={item?.item || index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300 font-medium">{item?.item}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{item?.winRate}%</td>
                          <td className={cn('py-4 px-6 text-sm font-medium', (item?.netPnL || 0) >= 0 ? 'text-[#10B981]' : 'text-red-600')}>
                            ${Math.abs(item?.netPnL || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{item?.trades}</td>
                          <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{item?.avgDailyVolume}</td>
                          <td className="py-4 px-6 text-sm text-[#10B981] dark:text-[#10B981]">
                            ${(item?.avgWin || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm text-red-600 dark:text-red-400">
                            ${Math.abs(item?.avgLoss || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
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
                      <option>Top 10 symbols</option>
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
                <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
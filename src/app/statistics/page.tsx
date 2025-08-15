'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { PnLTrendChart } from '@/components/ui/pnl-trend-chart'
import { HorizontalWinLossBar } from '@/components/ui/horizontal-win-loss-bar'
import { ProfitLossDonut } from '@/components/ui/profit-loss-donut'
import { SemicircularGauge } from '@/components/ui/semicircular-gauge'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, Cog6ToothIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { usePageTitle } from '@/hooks/use-page-title'
import { TradeDataService, Trade, TradeMetrics } from '@/services/trade-data.service'
import { themeColors } from '@/config/theme'
import { samplePnLTrendData, getChartColorScheme } from '@/config/chart-configs'
import { PageLoading } from '@/components/ui/loading-spinner'
import { useEffect } from 'react'

export default function TradesPage() {
  usePageTitle('Trades')
  const router = useRouter()
  const [selectedTrades, setSelectedTrades] = useState<string[]>([])
  const [tradesPerPage, setTradesPerPage] = useState(100)
  const [trades, setTrades] = useState<Trade[]>([])
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load trades and calculate metrics
  useEffect(() => {
    const loadTrades = async () => {
      try {
        setIsLoading(true)
        const tradesData = await TradeDataService.getAllTrades()
        const metricsData = TradeDataService.calculateMetrics(tradesData)
        setTrades(tradesData)
        setMetrics(metricsData)
      } catch (error) {
        console.error('Error loading trades:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTrades()
  }, [])

  // Early return if loading or no data
  if (isLoading || !metrics) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[var(--color-bg-dark,#1C1C1C)]">
            <PageLoading text="Loading trades..." />
          </main>
        </div>
      </div>
    )
  }
  
  const { totalTrades, netCumulativePnl, winningTrades, losingTrades, winRate, avgWinAmount, avgLossAmount, profitFactor } = metrics

  // Using centralized chart configuration
  const pnlTrendData = samplePnLTrendData
  const chartColorScheme = getChartColorScheme(netCumulativePnl)

  const handleSelectTrade = (tradeId: string) => {
    setSelectedTrades(prev => 
      prev.includes(tradeId) 
        ? prev.filter(id => id !== tradeId)
        : [...prev, tradeId]
    )
  }


  const handleSelectAll = () => {
    setSelectedTrades(
      selectedTrades.length === totalTrades 
        ? [] 
        : trades.map(trade => trade.id)
    )
  }

  const handleRowClick = () => {
    router.push(`/trades/tracker`)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[var(--color-bg-dark,#1C1C1C)]">
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Net Cumulative P&L */}
              <div className="bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Net cumulative P&L</h3>
                  <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  -${Math.abs(netCumulativePnl).toFixed(2)}
                </div>
                <div className="mt-1">
                  <PnLTrendChart 
                    data={pnlTrendData}
                    color={chartColorScheme.stroke}
                    height={32}
                  />
                </div>
              </div>

              {/* Profit Factor */}
              <div className="bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-lg p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit factor</h3>
                  <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {profitFactor.toFixed(2)}
                </div>
                <div className="mt-0 -mb-2 flex justify-center">
                  <ProfitLossDonut
                    profitPercentage={profitFactor > 0 ? Math.min(100, (avgWinAmount / (avgWinAmount + avgLossAmount || 1)) * 100) : 0}
                    size={70}
                  />
                </div>
              </div>

              {/* Trade Win % */}
              <div className="bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-lg p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Trade win %</h3>
                  <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {winRate.toFixed(0)}%
                </div>
                <div className="mt-0 -mb-3 flex justify-center">
                  <SemicircularGauge
                    data={[
                      { name: 'Wins', value: winningTrades, color: themeColors.status.win },
                      { name: 'Draws', value: 0, color: themeColors.status.neutral },
                      { name: 'Losses', value: losingTrades, color: themeColors.status.loss }
                    ]}
                    className="scale-75"
                  />
                </div>
              </div>

              {/* Avg Win/Loss Trade */}
              <div className="bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg win/loss trade</h3>
                  <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {profitFactor.toFixed(2)}
                </div>
                <div className="mt-1">
                  <HorizontalWinLossBar 
                    winAmount={avgWinAmount}
                    lossAmount={avgLossAmount}
                    height={8}
                  />
                </div>
              </div>
            </div>

            {/* Trades Table */}
              <div className="bg-white dark:bg-[var(--color-surface-dark,#171717)] rounded-lg">
              {/* Table Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center">
                    Bulk actions
                    <ChevronDownIcon className="w-4 h-4 ml-1 inline" />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white dark:bg-[var(--color-surface-dark,#171717)]">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTrades.length === totalTrades}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Open date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Close date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Entry price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exit price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Net P&L
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Net ROI
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Zella Insights
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Zella Scale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[var(--color-surface-dark,#171717)] divide-y divide-gray-200 dark:divide-gray-700">
                    {trades.map((trade) => (
                      <tr
                        key={trade.id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => handleRowClick()}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTrades.includes(trade.id)}
                            onChange={() => handleSelectTrade(trade.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {trade.openDate}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {trade.symbol}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            trade.status === 'WIN' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {trade.closeDate}
                        </td>
                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                           ${trade.entryPrice.toLocaleString()}
                         </td>
                         <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                           ${trade.exitPrice.toLocaleString()}
                         </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={trade.netPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            ${trade.netPnl >= 0 ? '' : '-'}${Math.abs(trade.netPnl).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={trade.netRoi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {(trade.netRoi * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {trade.zellaInsights && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-4 rounded-sm ${
                                  i < trade.zellaScale
                                    ? trade.status === 'WIN' 
                                      ? 'bg-green-500' 
                                      : 'bg-red-500'
                                    : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[var(--color-surface-dark,#171717)] border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Trades per page:</span>
                  <div className="w-24">
                    <CustomDropdown
                      value={tradesPerPage}
                      onChange={(value) => setTradesPerPage(Number(value))}
                      options={[
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' }
                      ]}
                      className="text-sm"
                    />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    1 - {Math.min(totalTrades, tradesPerPage)} of {totalTrades} trades
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    1 of 1 pages
                  </span>
                  <button
                    disabled
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
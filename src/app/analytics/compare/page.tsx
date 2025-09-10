'use client'

import { logger } from '@/lib/logger'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { Trade, TradeDataService } from '@/services/trade-data.service'

type SideFilter = 'ALL' | 'LONG' | 'SHORT'
type PnlMetric = 'NET' | 'GROSS'

interface FilterGroup {
  symbol: string
  tags: string // comma separated input for simplicity
  side: SideFilter
  pnlMetric: PnlMetric
  startDate: string // yyyy-mm-dd
  endDate: string // yyyy-mm-dd
}

interface Metrics {
  totalTrades: number
  totalPnl: number
  avgPnl: number
  winRate: number
  winners: number
  losers: number
  avgWin: number
  avgLoss: number
  profitFactor: number
}

const defaultGroup: FilterGroup = {
  symbol: '',
  tags: '',
  side: 'ALL',
  pnlMetric: 'NET',
  startDate: '',
  endDate: ''
}

export default function ComparePage() {
  usePageTitle('Analytics - Compare')

  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [group1, setGroup1] = useState<FilterGroup>({ ...defaultGroup })
  const [group2, setGroup2] = useState<FilterGroup>({ ...defaultGroup })

  const [metrics1, setMetrics1] = useState<Metrics | null>(null)
  const [metrics2, setMetrics2] = useState<Metrics | null>(null)

  // Load trades
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        const all = await TradeDataService.getAllTrades()
        if (!isMounted) return
        setTrades(all)
      } catch (e) {
        logger.error(e)
        if (isMounted) setError('Failed to load trades')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  // Suggestions
  const symbolOptions = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.symbol))).sort()
  }, [trades])

  const tagOptions = useMemo(() => {
    const set = new Set<string>()
    for (const t of trades) {
      ;(t.tags || []).forEach(tag => set.add(tag))
    }
    return Array.from(set).sort()
  }, [trades])

  // Helpers
  const parseDate = (s: string | undefined) => (s ? new Date(s) : null)

  const pickPnl = (t: Trade, metric: PnlMetric) => {
    const gross = t.grossPnl
    return metric === 'GROSS' ? (typeof gross === 'number' ? gross : t.netPnl) : t.netPnl
  }

  const filterTrades = (all: Trade[], g: FilterGroup): Trade[] => {
    const start = parseDate(g.startDate)
    const end = parseDate(g.endDate)
    const tags = g.tags
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.toLowerCase())

    return all.filter(t => {
      if (g.symbol && t.symbol !== g.symbol) return false
      if (g.side !== 'ALL' && (t.side || 'ALL') !== g.side) return false
      if (tags.length) {
        const ttags = (t.tags || []).map(x => x.toLowerCase())
        const hasAll = tags.every(x => ttags.includes(x))
        if (!hasAll) return false
      }
      if (start && new Date(t.openDate) < start) return false
      if (end && new Date(t.openDate) > end) return false
      return true
    })
  }

  const computeMetrics = (rows: Trade[], metric: PnlMetric): Metrics => {
    const pnls = rows.map(r => pickPnl(r, metric))
    const totalPnl = pnls.reduce((s, v) => s + v, 0)
    const totalTrades = rows.length
    const winners = rows.filter(r => pickPnl(r, metric) > 0).length
    const losers = rows.filter(r => pickPnl(r, metric) < 0).length
    const avgPnl = totalTrades ? totalPnl / totalTrades : 0
    const totalWinAmount = pnls.filter(v => v > 0).reduce((s, v) => s + v, 0)
    const totalLossAmount = Math.abs(pnls.filter(v => v < 0).reduce((s, v) => s + v, 0))
    const avgWin = winners ? totalWinAmount / winners : 0
    const avgLoss = losers ? totalLossAmount / losers : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0
    const winRate = totalTrades ? (winners / totalTrades) * 100 : 0
    return {
      totalTrades,
      totalPnl,
      avgPnl,
      winRate,
      winners,
      losers,
      avgWin,
      avgLoss,
      profitFactor
    }
  }

  const generateReport = () => {
    const rows1 = filterTrades(trades, group1)
    const rows2 = filterTrades(trades, group2)
    setMetrics1(computeMetrics(rows1, group1.pnlMetric))
    setMetrics2(computeMetrics(rows2, group2.pnlMetric))
  }

  const resetAll = () => {
    setGroup1({ ...defaultGroup })
    setGroup2({ ...defaultGroup })
    setMetrics1(null)
    setMetrics2(null)
  }

  const handleTabChange = (tabId: string) => {
    logger.debug('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    logger.debug(`Selected ${itemId} from ${tabId} tab`)
  }

  const Stat = ({ label, value, emphasize = false, red = false }: { label: string; value: string | number; emphasize?: boolean; red?: boolean }) => (
    <div className="flex flex-col">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={"text-sm font-semibold " + (emphasize ? 'text-zinc-900 dark:text-white' : 'text-zinc-800 dark:text-zinc-200') + (red ? ' text-red-600' : '')}>{value}</span>
    </div>
  )

  const formatCurrency = (n: number) => {
    const sign = n < 0 ? '-' : ''
    const v = Math.abs(n)
    if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(2)}M`
    if (v >= 1_000) return `${sign}$${(v / 1_000).toFixed(2)}k`
    return `${sign}$${v.toFixed(2)}`
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
              isActive: tab.id === 'compare'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compare</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Compare performance across different symbols, tags, sides, and date ranges
              </p>
            </div>

            <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-6">
              {loading ? (
                <div className="text-sm text-zinc-500">Loading trades...</div>
              ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : trades.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No trading data available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Import your CSV file to compare trading performance
                  </p>
                  <button 
                    onClick={() => window.location.href = '/import-data'}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Import Trading Data
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Group 1 */}
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Group #1</div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Symbol */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Symbol</label>
                          <input list="symbols" value={group1.symbol} onChange={e => setGroup1(g => ({ ...g, symbol: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="" />
                          <datalist id="symbols">
                            {symbolOptions.map(s => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </div>
                        {/* Tags */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Tags</label>
                          <input value={group1.tags} onChange={e => setGroup1(g => ({ ...g, tags: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="comma,separated" />
                          {tagOptions.length > 0 && (
                            <div className="mt-1 text-[11px] text-zinc-500">Suggestions: {tagOptions.slice(0, 6).join(', ')}{tagOptions.length > 6 ? '…' : ''}</div>
                          )}
                        </div>
                        {/* Side */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Side</label>
                          <select value={group1.side} onChange={e => setGroup1(g => ({ ...g, side: e.target.value as SideFilter }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            <option value="ALL">All</option>
                            <option value="LONG">Long</option>
                            <option value="SHORT">Short</option>
                          </select>
                        </div>
                        {/* Start date */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Start date</label>
                          <input type="date" value={group1.startDate} onChange={e => setGroup1(g => ({ ...g, startDate: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="MM/DD/YY" />
                        </div>
                        {/* Trade P&L */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Trade P&L</label>
                          <select value={group1.pnlMetric} onChange={e => setGroup1(g => ({ ...g, pnlMetric: e.target.value as PnlMetric }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            <option value="NET">Net P&L</option>
                            <option value="GROSS">Gross P&L</option>
                          </select>
                        </div>
                        {/* End date */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">End date</label>
                          <input type="date" value={group1.endDate} onChange={e => setGroup1(g => ({ ...g, endDate: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="MM/DD/YY" />
                        </div>
                      </div>
                    </div>

                    {/* Group 2 */}
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Group #2</div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Symbol */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Symbol</label>
                          <input list="symbols" value={group2.symbol} onChange={e => setGroup2(g => ({ ...g, symbol: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="" />
                        </div>
                        {/* Tags */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Tags</label>
                          <input value={group2.tags} onChange={e => setGroup2(g => ({ ...g, tags: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="comma,separated" />
                        </div>
                        {/* Side */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Side</label>
                          <select value={group2.side} onChange={e => setGroup2(g => ({ ...g, side: e.target.value as SideFilter }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            <option value="ALL">All</option>
                            <option value="LONG">Long</option>
                            <option value="SHORT">Short</option>
                          </select>
                        </div>
                        {/* Start date */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Start date</label>
                          <input type="date" value={group2.startDate} onChange={e => setGroup2(g => ({ ...g, startDate: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="MM/DD/YY" />
                        </div>
                        {/* Trade P&L */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Trade P&L</label>
                          <select value={group2.pnlMetric} onChange={e => setGroup2(g => ({ ...g, pnlMetric: e.target.value as PnlMetric }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            <option value="NET">Net P&L</option>
                            <option value="GROSS">Gross P&L</option>
                          </select>
                        </div>
                        {/* End date */}
                        <div className="col-span-1">
                          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">End date</label>
                          <input type="date" value={group2.endDate} onChange={e => setGroup2(g => ({ ...g, endDate: e.target.value }))} className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#141414] px-3 py-2 text-sm text-zinc-900 dark:text-white" placeholder="MM/DD/YY" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button onClick={resetAll} className="px-4 py-2 rounded-md text-xs font-semibold bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">RESET</button>
                    <button
                      onClick={generateReport}
                      className="relative px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#3559E9] hover:bg-[#2947d1] border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                    >
                      GENERATE REPORT
                    </button>
                  </div>

                  {/* Results */}
                  {(metrics1 || metrics2) && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Metrics 1 */}
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Group #1 Results</div>
                        {metrics1 ? (
                          <div className="grid grid-cols-2 gap-4">
                            <Stat label="Total trades" value={metrics1.totalTrades} />
                            <Stat label="Total P&L" value={formatCurrency(metrics1.totalPnl)} emphasize />
                            <Stat label="Avg trade P&L" value={formatCurrency(metrics1.avgPnl)} />
                            <Stat label="Win rate" value={`${metrics1.winRate.toFixed(1)}%`} />
                            <Stat label="Winners" value={metrics1.winners} />
                            <Stat label="Losers" value={metrics1.losers} red={metrics1.totalPnl < 0} />
                            <Stat label="Avg winner" value={formatCurrency(metrics1.avgWin)} />
                            <Stat label="Avg loser" value={formatCurrency(-metrics1.avgLoss)} red />
                            <Stat label="Profit factor" value={metrics1.profitFactor.toFixed(2)} />
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-500">No results yet</div>
                        )}
                      </div>

                      {/* Metrics 2 */}
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Group #2 Results</div>
                        {metrics2 ? (
                          <div className="grid grid-cols-2 gap-4">
                            <Stat label="Total trades" value={metrics2.totalTrades} />
                            <Stat label="Total P&L" value={formatCurrency(metrics2.totalPnl)} emphasize />
                            <Stat label="Avg trade P&L" value={formatCurrency(metrics2.avgPnl)} />
                            <Stat label="Win rate" value={`${metrics2.winRate.toFixed(1)}%`} />
                            <Stat label="Winners" value={metrics2.winners} />
                            <Stat label="Losers" value={metrics2.losers} red={metrics2.totalPnl < 0} />
                            <Stat label="Avg winner" value={formatCurrency(metrics2.avgWin)} />
                            <Stat label="Avg loser" value={formatCurrency(-metrics2.avgLoss)} red />
                            <Stat label="Profit factor" value={metrics2.profitFactor.toFixed(2)} />
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-500">No results yet</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
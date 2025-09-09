'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { NoteEditor } from '@/components/features/notes'
import type { Note } from '@/app/notes/page'
import { getImportedTrades, TradeRecord } from '@/components/modals/ImportTradesModal'
import { modelStatsService } from '@/services/model-stats.service'
import { DataStore } from '@/services/data-store.service'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ModelChart } from '@/components/ui/model-chart'
import { GripVertical, ChevronDown, Settings } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import * as Dialog from '@radix-ui/react-dialog'
import { TIMEZONE_REGIONS, formatTimezoneOffset, getCurrentTimezone } from '@/utils/timezones'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Frequency = 'Always' | 'Often' | 'Sometimes' | 'Rarely'

interface Rule { id: string; text: string; frequency: Frequency }
interface RuleGroup { id: string; title: string; rules: Rule[] }

interface AutoRulesConfig {
  maxLossPerTrade?: { enabled?: boolean; value?: number }
  maxTradesPerDay?: { enabled?: boolean; value?: number }
  session?: { enabled?: boolean; start?: string; end?: string; timezone?: string | number; applyIn?: 'local' | 'selected' }
  maxDailyLoss?: { enabled?: boolean; value?: number }
  allowedWeekdays?: { enabled?: boolean; value?: number[] }
}

interface StrategyModel {
  id: string
  name: string
  description?: string
  entryMode: 'ALL' | 'ANY'
  conditions: Array<{ id: string; field: string; operator: string; value: string }>
  customRules: string[]
  updatedAt: number
  ruleGroups?: RuleGroup[]
  emoji?: string
  emojiUnified?: string
  image?: string
  autoRules?: AutoRulesConfig
}

const STRATEGIES_KEY = 'tradestial:strategies'
const ASSIGNMENTS_KEY = 'tradestial:strategy-assignments'

function readStrategies(): StrategyModel[] {
  try {
    const raw = localStorage.getItem(STRATEGIES_KEY)
    const parsed: any[] = raw ? JSON.parse(raw) : []

    // Normalize any legacy ruleGroups (e.g., rules as strings) to structured Rule objects
    const normalized = parsed.map((s: any) => {
      // Ensure autoRules exists object-shape if present
      const withAuto = {
        ...s,
        autoRules: s?.autoRules && typeof s.autoRules === 'object' ? s.autoRules : undefined
      }
      if (!withAuto?.ruleGroups || !Array.isArray(withAuto.ruleGroups)) return withAuto
      return {
        ...withAuto,
        ruleGroups: withAuto.ruleGroups.map((g: any) => {
          const rulesArray = Array.isArray(g?.rules) ? g.rules : []
          const structuredRules = rulesArray.map((r: any) => {
            if (r && typeof r === 'object' && 'text' in r) return r
            const text = (typeof r === 'string' ? r : String(r || '')).trim()
            if (!text) return null
            return { id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`, text, frequency: 'Always' as const }
          }).filter(Boolean)
          return {
            id: g?.id || `group_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            title: (g?.title ?? '').toString(),
            rules: structuredRules
          }
        })
      }
    })

    return normalized
  } catch {
    return []
  }
}

function writeStrategies(next: StrategyModel[]) {
  try { localStorage.setItem(STRATEGIES_KEY, JSON.stringify(next)); window.dispatchEvent(new Event('tradestial:strategies-updated')) } catch {}
}

function readAssignments(): Record<string, string[]> {
  // Use the modelStatsService to get assignments instead of direct localStorage
  return modelStatsService.getAllAssignments()
}

function computeStats(trades: TradeRecord[]): { total: number; wins: number; losses: number; winRate: number; netPnL: number; avgWinner: number; avgLoser: number; profitFactor: number; expectancy: number } {
  const total = trades.length
  let wins = 0, losses = 0, sumWin = 0, sumLossAbs = 0, netPnL = 0
  for (const t of trades) { const pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat(String((t as any).pnl || 0)); netPnL += pnl; if (pnl > 0) { wins++; sumWin += pnl } else if (pnl < 0) { losses++; sumLossAbs += Math.abs(pnl) } }
  const winRate = total ? (wins / total) * 100 : 0
  const avgWinner = wins ? sumWin / wins : 0
  const avgLoser = losses ? -(sumLossAbs / losses) : 0
  const profitFactor = sumLossAbs > 0 ? sumWin / sumLossAbs : wins > 0 ? Infinity : 0
  const expectancy = total ? (wins / total) * avgWinner + (losses / total) * avgLoser : 0
  return { total, wins, losses, winRate, netPnL, avgWinner, avgLoser, profitFactor, expectancy }
}

export default function StrategyDetailPage() {
  const routeParams = useParams<{ id: string | string[] }>()
  const id = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id ?? '')
  const [strategies, setStrategies] = useState<StrategyModel[]>([])
  const strategy = useMemo(() => strategies.find(s => s.id === id) || null, [strategies, id])
  const [tab, setTab] = useState<'stats'|'rules'|'trades'|'backtesting'|'notes'>('stats')
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0)

  useEffect(() => {
    setStrategies(readStrategies())
    setAssignments(readAssignments())
    setTrades(DataStore.getAllTrades().map(trade => ({
      date: trade.closeDate || trade.openDate,
      pnl: trade.netPnl,
      ...trade
    })))
    const onUpdated = () => setStrategies(readStrategies())
    const onStatsUpdated = () => {
      // Force re-render to refresh stats
      setTrades(DataStore.getAllTrades().map(trade => ({
      date: trade.closeDate || trade.openDate,
      pnl: trade.netPnl,
      ...trade
    })))
      setAssignments(readAssignments())
      setStatsRefreshTrigger(prev => prev + 1)
    }
    window.addEventListener('tradestial:strategies-updated', onUpdated as EventListener)
    window.addEventListener('tradestial:model-stats-updated', onStatsUpdated as EventListener)
    window.addEventListener('storage', onUpdated)
    return () => { 
      window.removeEventListener('tradestial:strategies-updated', onUpdated as EventListener)
      window.removeEventListener('tradestial:model-stats-updated', onStatsUpdated as EventListener)
      window.removeEventListener('storage', onUpdated) 
    }
  }, [])

  const assignedTrades = useMemo(() => {
    // Get assigned trade IDs from the ModelStatsService instead of legacy assignments
    const assignedTradeIds = modelStatsService.getModelTrades(id)
    const ids = new Set(assignedTradeIds)
    return trades.filter(t => ids.has((t as any).id))
  }, [id, trades, assignments, statsRefreshTrigger])

  const stats = useMemo(() => {
    // Always compute fresh stats here to avoid any cache staleness
    // This ensures the KPIs update immediately after assignments change
    return modelStatsService.calculateModelStats(id, trades, false)
  }, [id, trades, statsRefreshTrigger])

  const currency = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(0)}`

  // Compute average hold time (in minutes) for assigned trades
  const avgHoldTimeMin = useMemo(() => {
    const withTimes = assignedTrades.filter((t: any) => t.entryTime && t.exitTime)
    if (withTimes.length === 0) return 0
    const durations = withTimes.map((t: any) => {
      const entry = new Date(`${t.openDate} ${t.entryTime}`)
      const exit = new Date(`${t.closeDate} ${t.exitTime}`)
      return Math.max(0, (exit.getTime() - entry.getTime()) / (1000 * 60))
    })
    const sum = durations.reduce((s: number, d: number) => s + d, 0)
    return sum / durations.length
  }, [assignedTrades])

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h}h ${m}m`
  }

  function updateStrategy(partial: Partial<StrategyModel>) {
    const next = strategies.map(s => s.id === id ? { ...s, ...partial, updatedAt: Date.now() } : s)
    setStrategies(next)
    writeStrategies(next)
  }

  if (!strategy) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#171717]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#171717] p-6">
            <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-500 dark:text-gray-400">
              Strategy not found. <Link href="/model" className="text-[#3559E9]">Back to list</Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#171717] p-6">
          <div className="w-full max-w-none mx-auto space-y-4">
          {/* Header card */}
          <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-8 min-h-64 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-40 w-72 rounded-lg overflow-hidden flex items-center justify-center">
                {strategy.image ? (
                  <div className="w-full h-full bg-gray-200 dark:bg-[#222] rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src={strategy.image} 
                      alt="Strategy avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : strategy.emojiUnified ? (
                  <img 
                    src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${strategy.emojiUnified}.png`}
                    alt="Strategy emoji"
                    className="w-16 h-16"
                    onError={(e) => {
                      // Fallback to Unicode emoji if Apple image fails to load using safe DOM ops
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const span = document.createElement('span')
                        span.className = 'text-3xl'
                        span.textContent = strategy.emoji || '📘'
                        parent.appendChild(span)
                      }
                    }}
                  />
                ) : (
                  <span className="text-3xl">{strategy.emoji || '📘'}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-2xl md:text-3xl leading-tight truncate">{strategy.name}</div>
                {strategy.description ? (
                  <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-gray-300 truncate">{strategy.description}</p>
                ) : null}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mt-6 pt-4 border-t border-gray-200 dark:border-[#2a2a2a] text-sm">
                  <Metric label="Win rate" value={`${stats.winRate.toFixed(0)}%`} />
                  <Metric label="Trades" value={`${stats.total}`} />
                  <Metric label="Profit factor" value={`${Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}`} />
                  <Metric label="Daily win rate" value={`${stats.winRate.toFixed(0)}%`} />
                  <Metric label="Avg trade duration" value={`${formatDuration(avgHoldTimeMin)}`} />
                  <Metric label="Win/Loss" value={`${stats.wins}/${stats.losses}`} />
                </div>
              </div>
              <div className="self-start ml-auto">
                <Button size="sm" className="bg-[#3559E9] hover:bg-[#2947d1] text-white">Actions</Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
            <div className="px-4 pt-3 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div className="flex gap-4 text-sm">
                {(['stats','rules','trades','backtesting','notes'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`pb-3 -mb-px border-b-2 font-semibold ${tab===t?'border-[#6366f1] text-gray-900 dark:text-white':'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {tab === 'stats' && (
                <ModelStatsAnalytics modelId={id} modelName={strategy.name} stats={stats} assignedTrades={assignedTrades} />
              )}

              {tab === 'rules' && (
                <RulesEditor strategy={strategy} onChange={updateStrategy} assignedTrades={assignedTrades} />
              )}

              {tab === 'trades' && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {assignedTrades.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">No trades assigned.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 dark:text-gray-300">
                            <th className="px-2 py-2">ID</th>
                            <th className="px-2 py-2">Symbol</th>
                            <th className="px-2 py-2">PnL</th>
                            <th className="px-2 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedTrades.map((t:any) => {
                            const rawPnL = typeof t.netPnl === 'number'
                              ? t.netPnl
                              : (typeof t.pnl === 'number' ? t.pnl : parseFloat(String((t.pnl ?? t.netPnl ?? 0))))
                            const pnl = Number.isFinite(rawPnL) ? rawPnL : 0
                            const pnlClass = pnl >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'
                            return (
                              <tr key={t.id} className="border-t border-gray-100 dark:border-[#2a2a2a]">
                                <td className="px-2 py-2">{t.id}</td>
                                <td className="px-2 py-2 font-semibold text-gray-500/80 dark:text-gray-400/70">{t.symbol || '-'}</td>
                                <td className={`px-2 py-2 font-semibold ${pnlClass}`}>{currency(pnl)}</td>
                                <td className="px-2 py-2 font-semibold text-gray-500/80 dark:text-gray-400/70">{(t.openDate || t.closeDate) ? new Date(t.openDate || t.closeDate).toLocaleDateString() : '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'backtesting' && (
                <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">Backtesting coming soon</div>
              )}

              {tab === 'notes' && (
                <StrategyNotes strategyId={id} />
              )}
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 leading-snug">{label}</div>
      <div className="text-lg md:text-xl text-gray-900 dark:text-white font-semibold leading-tight">{value}</div>
    </div>
  )
}

function ModelStatsAnalytics({ 
  modelId, 
  modelName, 
  stats, 
  assignedTrades 
}: { 
  modelId: string
  modelName: string
  stats: any
  assignedTrades: any[]
}) {
  const currency = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(0)}`
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h}h ${m}m`
  }
  const avgHoldTimeMin = (() => {
    const withTimes = assignedTrades.filter((t: any) => t.entryTime && t.exitTime)
    if (withTimes.length === 0) return 0
    const durations = withTimes.map((t: any) => {
      const entry = new Date(`${t.openDate} ${t.entryTime}`)
      const exit = new Date(`${t.closeDate} ${t.exitTime}`)
      return Math.max(0, (exit.getTime() - entry.getTime()) / (1000 * 60))
    })
    const sum = durations.reduce((s: number, d: number) => s + d, 0)
    return sum / durations.length
  })()
  
  // Calculate additional analytics
  const bestTrade = assignedTrades.reduce((best, trade) => {
    const pnl = typeof trade.pnl === 'number' ? trade.pnl : parseFloat(String(trade.pnl || 0))
    const bestPnl = typeof best?.pnl === 'number' ? best.pnl : parseFloat(String(best?.pnl || 0))
    return pnl > bestPnl ? trade : best
  }, assignedTrades[0])

  const worstTrade = assignedTrades.reduce((worst, trade) => {
    const pnl = typeof trade.pnl === 'number' ? trade.pnl : parseFloat(String(trade.pnl || 0))
    const worstPnl = typeof worst?.pnl === 'number' ? worst.pnl : parseFloat(String(worst?.pnl || 0))
    return pnl < worstPnl ? trade : worst
  }, assignedTrades[0])

  // Show debug info - but ONLY show "no trades" if we actually have no assigned trades
  if (assignedTrades.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Trades Assigned</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Assign trades to this model from the tracker page to see analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Cumulative P&L Chart */}
      <ModelChart trades={assignedTrades} height={480} />

      {/* Simple Metrics Grid - 4 columns by 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:[&>*]:border-l lg:[&>*]:border-gray-200 lg:dark:[&>*]:border-[#2a2a2a] lg:[&>*:first-child]:border-l-0 [&_h3]:font-semibold">
        {/* Row 1 */}
        <div className="p-4 min-h-32">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Net P&L</h3>
          </div>
          <p className={`text-2xl font-bold ${stats.netPnL >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'}`}>
            {currency(stats.netPnL)}
          </p>
          <p className="text-sm text-gray-500">({stats.netPnL >= 0 ? '+' : ''}{((stats.netPnL / Math.abs(stats.netPnL || 1)) * 100 || 0).toFixed(2)}%)</p>
        </div>

        <div className="p-4 min-h-32">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Profit factor</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
          </p>
          <p className="text-sm text-gray-500">
            ({currency(stats.avgWinner * stats.wins)}/{currency(Math.abs(stats.avgLoser * stats.losses))})
          </p>
        </div>

        <div className="p-4 min-h-32">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Avg net trade P&L</h3>
          </div>
          {(() => {
            const avgNetPerTrade = stats.total ? stats.netPnL / stats.total : 0
            const cls = avgNetPerTrade >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'
            return (
              <p className={`text-2xl font-bold ${cls}`}>{currency(avgNetPerTrade)}</p>
            )
          })()}
        </div>

        <div className="p-4 min-h-32">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Max daily net drawdown</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$0</p>
        </div>

        {/* Row 2 */}
        <div className="p-4 min-h-32 lg:!border-l-0">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Win %</h3>
          </div>
          <p className="text-2xl font-bold text-gray-500/80 dark:text-gray-400/70">{stats.winRate.toFixed(0)}%</p>
          <p className="text-sm text-gray-500">({stats.wins}/{stats.losses})</p>
        </div>

        <div className="p-4 min-h-32">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Trade expectancy</h3>
          </div>
          <p className={`text-2xl font-bold ${stats.expectancy >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'}`}>{currency(stats.expectancy)}</p>
        </div>

        <div className="p-4 min-h-32">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Avg hold time</h3>
          </div>
          <p className="text-2xl font-bold text-gray-500/80 dark:text-gray-400/70">{formatDuration(avgHoldTimeMin)}</p>
        </div>

        <div className="p-4 min-h-32">
          <div className="flex items-center mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-300">Avg daily net drawdown</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$0</p>
        </div>
      </div>
    </div>
  )
}


function StrategyNotes({ strategyId }: { strategyId: string }) {
  // Multi-note system scoped to a strategy
  const KEY = `tradestial:strategy-notes:${strategyId}`
  const LEGACY_KEY = `tradestial:strategy-note:${strategyId}`
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string>('')

  // Load notes (and migrate legacy single-note if found)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      let parsed: Note[] = raw ? JSON.parse(raw) : []
      if (!parsed.length) {
        const legacy = localStorage.getItem(LEGACY_KEY)
        if (legacy) {
          const one = JSON.parse(legacy)
          parsed = [{
            id: one.id || `${strategyId}-note-1`,
            title: one.title || 'Untitled',
            content: one.content || '',
            createdAt: one.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            folder: 'Strategy',
            tags: one.tags || [],
            color: one.color || '#3b82f6'
          }]
          localStorage.setItem(KEY, JSON.stringify(parsed))
        }
      }
      setNotes(parsed)
      if (parsed.length) setSelectedId(parsed[0].id)
    } catch {}
  }, [KEY, LEGACY_KEY, strategyId])

  const persist = (next: Note[]) => {
    setNotes(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  }

  const addNote = () => {
    const now = new Date().toISOString()
    const newNote: Note = { 
      id: `${strategyId}-${Date.now()}`, 
      title: 'Untitled', 
      content: '', 
      createdAt: now, 
      updatedAt: now, 
      folder: 'Strategy', 
      tags: [],
      color: '#3b82f6' // Default color for strategy notes
    }
    const next = [newNote, ...notes]
    persist(next)
    setSelectedId(newNote.id)
  }

  const updateNote = (id: string, content: string, title?: string, color?: string, tags?: string[]) => {
    const next = notes.map(n => n.id === id ? { 
      ...n, 
      content, 
      title: title ?? n.title, 
      color: color ?? n.color,
      tags: tags ?? n.tags,
      updatedAt: new Date().toISOString() 
    } : n)
    persist(next)
  }

  const deleteNote = (id: string) => {
    const next = notes.filter(n => n.id !== id)
    persist(next)
    if (selectedId === id) setSelectedId(next[0]?.id || '')
  }

  const selected = notes.find(n => n.id === selectedId) || null

  return (
    <div className="flex h-[72vh] bg-white dark:bg-[#0f0f0f] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 border-r border-gray-200 dark:border-[#2a2a2a] p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</div>
          <Button size="sm" className="h-7 px-2 text-xs bg-[#3559E9] hover:bg-[#2947d1] text-white" onClick={addNote}>Add note</Button>
        </div>
        <div className="flex-1 overflow-auto space-y-1 pr-1">
          {notes.map(n => (
            <button key={n.id} onClick={() => setSelectedId(n.id)} className={`w-full text-left px-2 py-2 rounded-md text-sm truncate ${selectedId===n.id? 'bg-[#eef2ff] dark:bg-[#1f243a] text-gray-900 dark:text-white':'hover:bg-gray-100 dark:hover:bg-[#171717] text-gray-700 dark:text-gray-300'}`}>
              {n.title || 'Untitled'}
            </button>
          ))}
          {!notes.length && (
            <div className="text-xs text-gray-500 dark:text-gray-400">No notes yet.</div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        <div className="p-4 h-full overflow-hidden">
          <NoteEditor
            note={selected}
            onUpdateNote={updateNote}
            onDeleteNote={(id: string, title: string) => deleteNote(id)}
            hideNetPnlSection
          />
        </div>
      </div>
    </div>
  )
}

function RulesEditor({ strategy, onChange, assignedTrades }: { strategy: StrategyModel; onChange: (partial: Partial<StrategyModel>) => void; assignedTrades: any[] }) {
  const groups = strategy.ruleGroups || []
  const autoRules = strategy.autoRules || {}
  const addGroup = () => onChange({ ruleGroups: [...groups, { id: `group_${Date.now()}`, title: '', rules: [{ id: `rule_${Date.now()}`, text: '', frequency: 'Always' }] }] })
  const removeGroup = (gid: string) => onChange({ ruleGroups: groups.filter(g => g.id !== gid) })
  const setGroupTitle = (gid: string, title: string) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, title}:g) })
  const addRule = (gid: string) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, rules: [...g.rules, { id: `rule_${Date.now()}`, text: '', frequency: 'Always' }]}:g) })
  const setRule = (gid: string, rid: string, partial: Partial<Rule>) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, rules: g.rules.map(r => r.id===rid?{...r, ...partial}:r)}:g) })
  const removeRule = (gid: string, rid: string) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, rules: g.rules.filter(r => r.id!==rid)}:g) })

  // Load per-trade rule checks and recompute when updated
  const [tradeMeta, setTradeMeta] = useState<Record<string, any>>({})
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('tradestial:trade-metadata')
        setTradeMeta(raw ? JSON.parse(raw) : {})
      } catch { setTradeMeta({}) }
    }
    load()
    const refresh = () => load()
    window.addEventListener('tradestial:trade-rules-updated', refresh as EventListener)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('tradestial:trade-rules-updated', refresh as EventListener)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const currency = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(0)}`

  // Compute metrics for a single rule over assigned trades
  const getRuleMetrics = (ruleId: string) => {
    const total = assignedTrades.length || 0
    if (total === 0) {
      return { followRate: 0, netPnL: 0, profitFactor: 0, winRate: 0 }
    }
    const followed = assignedTrades.filter((t: any) => !!(tradeMeta?.[t.id]?.ruleChecks?.[ruleId]))
    const count = followed.length
    const followRate = (count / total) * 100
    let wins = 0, losses = 0, sumWin = 0, sumLossAbs = 0
    for (const t of followed) {
      const raw = typeof t.netPnl === 'number' ? t.netPnl : (typeof t.pnl === 'number' ? t.pnl : parseFloat(String(t.pnl || 0)))
      const pnl = Number.isFinite(raw) ? raw : 0
      if (pnl > 0) { wins++; sumWin += pnl } else if (pnl < 0) { losses++; sumLossAbs += Math.abs(pnl) }
    }
    const netPnL = sumWin - sumLossAbs
    const profitFactor = sumLossAbs > 0 ? sumWin / sumLossAbs : wins > 0 ? Infinity : 0
    const winRate = count ? (wins / count) * 100 : 0
    return { followRate, netPnL, profitFactor, winRate }
  }

  // ---------- Auto Rules Evaluation (local to RulesEditor) ----------
  function parseTimeToMinutesLocal(t?: string) {
    if (!t || typeof t !== 'string') return null
    const m = t.match(/^(\d{1,2}):(\d{2})$/)
    if (!m) return null
    const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)))
    const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)))
    return hh * 60 + mm
  }

  function resolveTradeDate(t: any): Date {
    const raw = (typeof t.openDate === 'string' && t.openDate) || (typeof t.date === 'string' && t.date) || (typeof t.closeDate === 'string' && t.closeDate)
    if (raw) return new Date(raw)
    return new Date()
  }

  function getZonedFields(date: Date, timeZone?: string | number): { dayKey: string; weekday: number; minutes: number } {
    try {
      if (typeof timeZone === 'number' && Number.isFinite(timeZone)) {
        // Interpret as offset minutes from UTC (same as import UI). Create a shifted time.
        const shifted = new Date(date.getTime() + (timeZone * 60 * 1000))
        // Use UTC getters on shifted date to avoid double-applying environment TZ
        const year = shifted.getUTCFullYear()
        const month = String(shifted.getUTCMonth() + 1).padStart(2, '0')
        const day = String(shifted.getUTCDate()).padStart(2, '0')
        const hour = shifted.getUTCHours()
        const minute = shifted.getUTCMinutes()
        const dayKey = `${year}-${month}-${day}`
        const minutes = Math.min(23, hour) * 60 + Math.min(59, minute)
        const weekday = shifted.getUTCDay() // 0-6 Sun-Sat
        return { dayKey, weekday, minutes }
      }

      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: (timeZone as string) || undefined, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' })
      const parts = fmt.formatToParts(date)
      const obj: any = {}
      for (const p of parts) obj[p.type] = p.value
      // obj: year, month, day, hour, minute, weekday
      const dayKey = `${obj.year}-${obj.month}-${obj.day}`
      const minutes = Math.min(23, parseInt(obj.hour || '0', 10)) * 60 + Math.min(59, parseInt(obj.minute || '0', 10))
      // Map short weekday to 0-6 Sun-Sat
      const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
      const weekday = map[obj.weekday] ?? date.getUTCDay()
      return { dayKey, weekday, minutes }
    } catch {
      // Fallback to local
      const dayKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const minutes = date.getHours()*60 + date.getMinutes()
      const weekday = date.getDay()
      return { dayKey, weekday, minutes }
    }
  }

  const autoSummary = useMemo(() => {
    const cfg = autoRules
    const totalTrades = assignedTrades.length
    if (totalTrades === 0) return { totalTrades: 0, withinMaxLoss: 0, withinSession: 0, onAllowedDays: 0, daysWithinMaxTrades: 0 }

    // Per-trade checks
    let okMaxLoss = 0
    let okSession = 0
    let okWeekday = 0

    const startMin = cfg.session?.start ? parseTimeToMinutesLocal(cfg.session.start) : null
    const endMin = cfg.session?.end ? parseTimeToMinutesLocal(cfg.session.end) : null
    const hasSession = startMin !== null && endMin !== null
    const allowedDays = Array.isArray(cfg.allowedWeekdays?.value)
      ? new Set(cfg.allowedWeekdays.value)
      : (Array.isArray((cfg as any).allowedWeekdays) ? new Set((cfg as any).allowedWeekdays as number[]) : undefined)

    // Group by day for per-day checks
    const perDay: Record<string, { count: number; pnl: number }> = {}

    for (const t of assignedTrades) {
      const rawP = typeof t.netPnl === 'number' ? t.netPnl : (typeof t.pnl === 'number' ? t.pnl : parseFloat(String(t.pnl || 0)))
      const pnl = Number.isFinite(rawP) ? rawP : 0
      const dt = resolveTradeDate(t)
      const tz = (cfg.session?.applyIn === 'local') ? undefined : cfg.session?.timezone
      const { dayKey, minutes, weekday } = getZonedFields(dt, tz)
      perDay[dayKey] = perDay[dayKey] || { count: 0, pnl: 0 }
      perDay[dayKey].count += 1
      perDay[dayKey].pnl += pnl

      // session window check (treat as enabled if start/end exist and no explicit flag)
      const sessionEnabled = (cfg.session?.enabled ?? hasSession) && hasSession
      if (sessionEnabled) {
        if (minutes >= startMin && minutes <= endMin) okSession++
      } else {
        okSession++ // not enabled or configured -> treat as pass
      }

      // max loss per trade (support legacy number)
      if (cfg.maxLossPerTrade?.enabled && typeof cfg.maxLossPerTrade?.value === 'number') {
        if (pnl >= -Math.abs(cfg.maxLossPerTrade.value)) okMaxLoss++
      } else if (typeof (cfg as any).maxLossPerTrade === 'number') {
        if (pnl >= -Math.abs((cfg as any).maxLossPerTrade as number)) okMaxLoss++
      } else {
        okMaxLoss++ // not enabled or configured -> treat as pass
      }

      // weekday check (support legacy array)
      if ((cfg.allowedWeekdays?.enabled || Array.isArray((cfg as any).allowedWeekdays)) && allowedDays) {
        const wd = getZonedFields(dt, tz).weekday // 0-6 Sun-Sat
        if (allowedDays.has(wd)) okWeekday++
      } else {
        okWeekday++
      }
    }

    // Per-day checks (separate counters)
    let daysOkTrades = 0
    let daysOkDailyLoss = 0
    const dayKeys = Object.keys(perDay)
    for (const [_dayKey, { count, pnl }] of Object.entries(perDay)) {
      // Max trades per day (support legacy number)
      if (cfg.maxTradesPerDay?.enabled && typeof cfg.maxTradesPerDay?.value === 'number') {
        if (count <= cfg.maxTradesPerDay.value) daysOkTrades++
      } else if (typeof (cfg as any).maxTradesPerDay === 'number') {
        if (count <= ((cfg as any).maxTradesPerDay as number)) daysOkTrades++
      } else {
        daysOkTrades++ // not enabled or configured -> treat as pass
      }

      // Max daily loss (support legacy number)
      if (cfg.maxDailyLoss?.enabled && typeof cfg.maxDailyLoss?.value === 'number') {
        if (pnl >= -Math.abs(cfg.maxDailyLoss.value)) daysOkDailyLoss++
      } else if (typeof (cfg as any).maxDailyLoss === 'number') {
        if (pnl >= -Math.abs(((cfg as any).maxDailyLoss as number))) daysOkDailyLoss++
      } else {
        daysOkDailyLoss++ // not enabled or configured -> treat as pass
      }
    }

    return {
      totalTrades,
      withinMaxLoss: Math.round((okMaxLoss / Math.max(1, totalTrades)) * 100),
      withinSession: Math.round((okSession / Math.max(1, totalTrades)) * 100),
      onAllowedDays: Math.round((okWeekday / Math.max(1, totalTrades)) * 100),
      daysWithinMaxTrades: Math.round((daysOkTrades / Math.max(1, dayKeys.length)) * 100),
      daysWithinMaxDailyLoss: Math.round((daysOkDailyLoss / Math.max(1, dayKeys.length)) * 100)
    }
  }, [assignedTrades, autoRules])

  // Drag handlers (local to this editor, updating via onChange)
  function onGroupsDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = groups.findIndex(g => (g.id || '') === active.id)
    const newIndex = groups.findIndex(g => (g.id || '') === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const moved = arrayMove(groups, oldIndex, newIndex)
    onChange({ ruleGroups: moved })
  }

  function onRulesDragEnd(groupId: string) {
    return (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const gi = groups.findIndex(g => g.id === groupId)
      if (gi === -1) return
      const rules = groups[gi].rules
      const oldIndex = rules.findIndex(r => (r.id || '') === active.id)
      const newIndex = rules.findIndex(r => (r.id || '') === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const updatedGroups = [...groups]
      updatedGroups[gi] = { ...groups[gi], rules: arrayMove(rules, oldIndex, newIndex) }
      onChange({ ruleGroups: updatedGroups })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Rules</div>
        <div className="flex items-center gap-2">
          {/* Auto Rules Config Dialog */}
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button variant="outline" className="h-8 px-3 text-xs flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                Auto Rules
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[200]" />
              <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-xl z-[201] w-[500px] max-h-[80vh] overflow-auto">
                <div className="p-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Auto Rules Configuration
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Set automatic constraints and session rules for this strategy model.
                  </Dialog.Description>
                  
                  <div className="space-y-6">
                    {/* Trade Constraints */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Trade Constraints</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={autoRules.maxLossPerTrade?.enabled ?? false}
                                onChange={(e) => onChange({ autoRules: { ...autoRules, maxLossPerTrade: { ...autoRules.maxLossPerTrade, enabled: e.target.checked } } })}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                            <label className="text-sm text-gray-700 dark:text-gray-300">Max loss per trade ($)</label>
                          </div>
                          <input type="number" inputMode="decimal" className="w-32 h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            disabled={!(autoRules.maxLossPerTrade?.enabled ?? false)}
                            value={autoRules.maxLossPerTrade?.value ?? ''}
                            onChange={(e)=> onChange({ autoRules: { ...autoRules, maxLossPerTrade: { ...autoRules.maxLossPerTrade, value: e.target.value === '' ? undefined : Number(e.target.value) } } })}
                            placeholder="No limit"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={autoRules.maxTradesPerDay?.enabled ?? false}
                                onChange={(e) => onChange({ autoRules: { ...autoRules, maxTradesPerDay: { ...autoRules.maxTradesPerDay, enabled: e.target.checked } } })}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                            <label className="text-sm text-gray-700 dark:text-gray-300">Max trades per day</label>
                          </div>
                          <input type="number" inputMode="numeric" className="w-32 h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            disabled={!(autoRules.maxTradesPerDay?.enabled ?? false)}
                            value={autoRules.maxTradesPerDay?.value ?? ''}
                            onChange={(e)=> onChange({ autoRules: { ...autoRules, maxTradesPerDay: { ...autoRules.maxTradesPerDay, value: e.target.value === '' ? undefined : Number(e.target.value) } } })}
                            placeholder="No limit"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={autoRules.maxDailyLoss?.enabled ?? false}
                                onChange={(e) => onChange({ autoRules: { ...autoRules, maxDailyLoss: { ...autoRules.maxDailyLoss, enabled: e.target.checked } } })}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                            <label className="text-sm text-gray-700 dark:text-gray-300">Max daily loss ($)</label>
                          </div>
                          <input type="number" inputMode="decimal" className="w-32 h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            disabled={!(autoRules.maxDailyLoss?.enabled ?? false)}
                            value={autoRules.maxDailyLoss?.value ?? ''}
                            onChange={(e)=> onChange({ autoRules: { ...autoRules, maxDailyLoss: { ...autoRules.maxDailyLoss, value: e.target.value === '' ? undefined : Number(e.target.value) } } })}
                            placeholder="No limit"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Session Rules */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoRules.session?.enabled ?? false}
                            onChange={(e) => onChange({ autoRules: { ...autoRules, session: { ...autoRules.session, enabled: e.target.checked } } })}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Session Rules</h3>
                      </div>
                      <div className={`space-y-4 ${!(autoRules.session?.enabled ?? false) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Session start</label>
                            {(() => {
                              const startTime = autoRules.session?.start ?? ''
                              const [startHour, startMinute] = startTime ? startTime.split(':') : ['', '']
                              
                              return (
                                <div className="flex gap-2">
                                  <Select.Root value={startHour} onValueChange={(hour) => {
                                    const minute = startMinute || '00'
                                    onChange({ autoRules: { ...autoRules, session: { ...(autoRules.session||{}), start: `${hour}:${minute}` } } })
                                  }}>
                                    <Select.Trigger className="flex-1 h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between">
                                      <Select.Value placeholder="Hour">
                                        {startHour || 'Hour'}
                                      </Select.Value>
                                      <Select.Icon>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                      </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                      <Select.Content position="popper" side="bottom" align="start" sideOffset={4} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[300] w-[100px]">
                                        <Select.ScrollUpButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▲</Select.ScrollUpButton>
                                        <Select.Viewport className="p-1 max-h-[200px] overflow-auto">
                                          {Array.from({length: 24}, (_, i) => {
                                            const hour = i.toString().padStart(2, '0')
                                            return (
                                              <Select.Item key={hour} value={hour} className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                                <Select.ItemText>{hour}</Select.ItemText>
                                              </Select.Item>
                                            )
                                          })}
                                        </Select.Viewport>
                                        <Select.ScrollDownButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▼</Select.ScrollDownButton>
                                      </Select.Content>
                                    </Select.Portal>
                                  </Select.Root>
                                  
                                  <Select.Root value={startMinute} onValueChange={(minute) => {
                                    const hour = startHour || '00'
                                    onChange({ autoRules: { ...autoRules, session: { ...(autoRules.session||{}), start: `${hour}:${minute}` } } })
                                  }}>
                                    <Select.Trigger className="flex-1 h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between">
                                      <Select.Value placeholder="Min">
                                        {startMinute || 'Min'}
                                      </Select.Value>
                                      <Select.Icon>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                      </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                      <Select.Content position="popper" side="bottom" align="start" sideOffset={4} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[300] w-[100px]">
                                        <Select.ScrollUpButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▲</Select.ScrollUpButton>
                                        <Select.Viewport className="p-1 max-h-[200px] overflow-auto">
                                          {['00', '15', '30', '45'].map((minute) => (
                                            <Select.Item key={minute} value={minute} className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                              <Select.ItemText>{minute}</Select.ItemText>
                                            </Select.Item>
                                          ))}
                                        </Select.Viewport>
                                        <Select.ScrollDownButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▼</Select.ScrollDownButton>
                                      </Select.Content>
                                    </Select.Portal>
                                  </Select.Root>
                                </div>
                              )
                            })()}
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Session end</label>
                            {(() => {
                              const endTime = autoRules.session?.end ?? ''
                              const [endHour, endMinute] = endTime ? endTime.split(':') : ['', '']
                              
                              return (
                                <div className="flex gap-2">
                                  <Select.Root value={endHour} onValueChange={(hour) => {
                                    const minute = endMinute || '00'
                                    onChange({ autoRules: { ...autoRules, session: { ...(autoRules.session||{}), end: `${hour}:${minute}` } } })
                                  }}>
                                    <Select.Trigger className="flex-1 h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between">
                                      <Select.Value placeholder="Hour">
                                        {endHour || 'Hour'}
                                      </Select.Value>
                                      <Select.Icon>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                      </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                      <Select.Content position="popper" side="bottom" align="start" sideOffset={4} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[300] w-[100px]">
                                        <Select.ScrollUpButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▲</Select.ScrollUpButton>
                                        <Select.Viewport className="p-1 max-h-[200px] overflow-auto">
                                          {Array.from({length: 24}, (_, i) => {
                                            const hour = i.toString().padStart(2, '0')
                                            return (
                                              <Select.Item key={hour} value={hour} className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                                <Select.ItemText>{hour}</Select.ItemText>
                                              </Select.Item>
                                            )
                                          })}
                                        </Select.Viewport>
                                        <Select.ScrollDownButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▼</Select.ScrollDownButton>
                                      </Select.Content>
                                    </Select.Portal>
                                  </Select.Root>
                                  
                                  <Select.Root value={endMinute} onValueChange={(minute) => {
                                    const hour = endHour || '00'
                                    onChange({ autoRules: { ...autoRules, session: { ...(autoRules.session||{}), end: `${hour}:${minute}` } } })
                                  }}>
                                    <Select.Trigger className="flex-1 h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between">
                                      <Select.Value placeholder="Min">
                                        {endMinute || 'Min'}
                                      </Select.Value>
                                      <Select.Icon>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                      </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                      <Select.Content position="popper" side="bottom" align="start" sideOffset={4} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[300] w-[100px]">
                                        <Select.ScrollUpButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▲</Select.ScrollUpButton>
                                        <Select.Viewport className="p-1 max-h-[200px] overflow-auto">
                                          {['00', '15', '30', '45'].map((minute) => (
                                            <Select.Item key={minute} value={minute} className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                              <Select.ItemText>{minute}</Select.ItemText>
                                            </Select.Item>
                                          ))}
                                        </Select.Viewport>
                                        <Select.ScrollDownButton className="flex items-center justify-center h-6 text-xs text-gray-500 dark:text-gray-400">▼</Select.ScrollDownButton>
                                      </Select.Content>
                                    </Select.Portal>
                                  </Select.Root>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Apply rules in</label>
                          <Select.Root value={autoRules.session?.applyIn ?? 'selected'} onValueChange={(val) => {
                            const v = (val === 'local' ? 'local' : 'selected') as 'local'|'selected'
                            onChange({ autoRules: { ...autoRules, session: { ...(autoRules.session||{}), applyIn: v } } })
                          }}>
                            <Select.Trigger className="w-full h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between">
                              <Select.Value>
                                {(autoRules.session?.applyIn ?? 'selected') === 'local' ? 'Local timezone' : 'Selected timezone'}
                              </Select.Value>
                              <Select.Icon>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                              <Select.Content position="popper" side="bottom" align="start" sideOffset={4} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[300] w-[220px]">
                                <Select.Viewport className="p-1">
                                  <Select.Item value="local" className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                    <Select.ItemText>Local timezone</Select.ItemText>
                                  </Select.Item>
                                  <Select.Item value="selected" className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none">
                                    <Select.ItemText>Selected timezone</Select.ItemText>
                                  </Select.Item>
                                </Select.Viewport>
                              </Select.Content>
                            </Select.Portal>
                          </Select.Root>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                          {(() => {
                            const tzValue = autoRules.session?.timezone
                            const selected = typeof tzValue === 'number'
                              ? Object.values(TIMEZONE_REGIONS).flat().find(t => t.value === tzValue)
                              : undefined
                            return (
                              <Select.Root value={typeof tzValue === 'number' ? String(tzValue) : ''} onValueChange={(val) => {
                                const num = parseInt(val)
                                onChange({ autoRules: { ...autoRules, session: { ...(autoRules.session || {}), timezone: Number.isFinite(num) ? num : undefined } } })
                              }}>
                                <Select.Trigger disabled={(autoRules.session?.applyIn ?? 'selected') === 'local'} className="w-full h-8 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
                                  <Select.Value>
                                    {selected ? (
                                      `${selected.label} ${formatTimezoneOffset(selected.value)}`
                                    ) : (
                                      (typeof tzValue === 'string' && tzValue) ? `Custom: ${tzValue}` : 'Select timezone'
                                    )}
                                  </Select.Value>
                                  <Select.Icon>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                  <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-md shadow-lg z-[300] min-w-[250px] max-h-[300px] overflow-auto">
                                    <Select.Viewport className="p-1">
                                      {Object.entries(TIMEZONE_REGIONS).map(([regionName, timezones]) => (
                                        <Select.Group key={regionName}>
                                          <Select.Label className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {regionName}
                                          </Select.Label>
                                          {timezones.map((timezone) => (
                                            <Select.Item
                                              key={`${timezone.label}-${timezone.value}`}
                                              value={String(timezone.value)}
                                              className="px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer outline-none"
                                            >
                                              <Select.ItemText>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{timezone.label}</span>
                                                  <span className="text-xs text-gray-500">
                                                    {formatTimezoneOffset(timezone.value)}
                                                  </span>
                                                </div>
                                              </Select.ItemText>
                                            </Select.Item>
                                          ))}
                                        </Select.Group>
                                      ))}
                                    </Select.Viewport>
                                  </Select.Content>
                                </Select.Portal>
                              </Select.Root>
                            )
                          })()}
                          {(() => {
                            const local = getCurrentTimezone()
                            return (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Your local timezone: <span className="font-medium text-gray-600 dark:text-gray-300">{local.label}</span> {formatTimezoneOffset(local.value)}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Allowed Weekdays */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoRules.allowedWeekdays?.enabled ?? false}
                            onChange={(e) => onChange({ autoRules: { ...autoRules, allowedWeekdays: { ...autoRules.allowedWeekdays, enabled: e.target.checked } } })}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Allowed Weekdays</h3>
                      </div>
                      <div className={`grid grid-cols-7 gap-2 ${!(autoRules.allowedWeekdays?.enabled ?? false) ? 'opacity-50 pointer-events-none' : ''}`}>
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((lbl, idx)=>{
                          const list = new Set(autoRules.allowedWeekdays?.value || [])
                          const checked = list.has(idx)
                          return (
                            <label key={idx} className={`h-10 flex items-center justify-center text-xs font-medium rounded border transition-colors cursor-pointer ${
                              checked 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                                : 'border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}>
                              <input type="checkbox" className="hidden" checked={checked} onChange={(e)=>{
                                const newSet = new Set(autoRules.allowedWeekdays?.value || [])
                                if (e.target.checked) newSet.add(idx)
                                else newSet.delete(idx)
                                onChange({ autoRules: { ...autoRules, allowedWeekdays: { ...autoRules.allowedWeekdays, value: Array.from(newSet) } } })
                              }} />
                              {lbl}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Dialog.Close asChild>
                      <Button className="px-4 py-2 text-sm">Done</Button>
                    </Dialog.Close>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Button onClick={addGroup} className="bg-[#7c3aed] hover:bg-[#6b21a8] text-white h-8 px-3 text-xs">Create group</Button>
        </div>
      </div>

      {/* Auto rules summary - only show enabled rules */}
      {(autoRules.maxLossPerTrade?.enabled || autoRules.maxTradesPerDay?.enabled || autoRules.maxDailyLoss?.enabled || autoRules.session?.enabled || autoRules.allowedWeekdays?.enabled) && (
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          {autoRules.maxLossPerTrade?.enabled && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300">Max loss OK: {autoSummary.withinMaxLoss}%</span>}
          {autoRules.session?.enabled && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300">Session OK: {autoSummary.withinSession}%</span>}
          {autoRules.allowedWeekdays?.enabled && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300">Weekdays OK: {autoSummary.onAllowedDays}%</span>}
          {autoRules.maxTradesPerDay?.enabled && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300">Days within max trades: {autoSummary.daysWithinMaxTrades}%</span>}
          {autoRules.maxDailyLoss?.enabled && <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#171717] text-gray-700 dark:text-gray-300">Days within max daily loss: {autoSummary.daysWithinMaxDailyLoss}%</span>}
        </div>
      )}
      {groups.length === 0 && (
        <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No Playbook Rules</div>
      )}
      <DndContext onDragEnd={onGroupsDragEnd}>
        <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {groups.map((group, groupIndex) => (
              <SortableGroup key={group.id} id={group.id}>
                {({ setNodeRef, style, attributes, listeners }) => (
                <div ref={setNodeRef} style={style} {...attributes}> 
                  {/* Group header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span {...listeners} className="flex items-center justify-center text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <input value={group.title} onChange={(e)=>setGroupTitle(group.id, e.target.value)} placeholder="Entry criteria" className="flex-1 h-9 bg-transparent dark:bg-transparent text-gray-900 dark:text-white px-0 border-0 border-b border-transparent focus:border-gray-300 dark:focus:border-[#2a2a2a] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 font-semibold text-[0.95rem]" />
                    </div>
                    {/* Metrics header labels */}
                    <div className="hidden md:grid grid-cols-4 gap-4 w-[480px] max-w-[55%] justify-items-center text-xs text-gray-500 dark:text-gray-400">
                      <div className="text-center">Follow rate</div>
                      <div className="text-center">Net profit/loss</div>
                      <div className="text-center">Profit factor</div>
                      <div className="text-center">Win rate</div>
                    </div>
                    <button onClick={()=>removeGroup(group.id)} className="ml-3 text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">×</button>
                  </div>

                  {/* Rules list (full-bleed rows) */}
                  <DndContext onDragEnd={onRulesDragEnd(group.id)}>
                    <SortableContext items={group.rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      <div className="mt-2 divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                        {group.rules.map((rule, ruleIndex) => (
                          <SortableRule key={rule.id} id={rule.id}>
                            {({ setNodeRef: setRuleRef, style: ruleStyle, attributes: ruleAttrs, listeners: ruleListeners }) => (
                            <div ref={setRuleRef} style={ruleStyle} {...ruleAttrs} className="flex items-center justify-between px-1 py-2 hover:bg-gray-50 dark:hover:bg-[#171717]">
                              {/* Left: drag + rule text + delete */}
                              <div className="flex items-center gap-2 flex-1 pr-4 min-w-0">
                                <span {...ruleListeners} className="flex items-center justify-center text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>
                                <input
                                  value={rule.text}
                                  onChange={(e)=>setRule(group.id, rule.id, { text: e.target.value })}
                                  placeholder="Clear stop defined"
                                  className="w-full h-8 bg-transparent dark:bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-transparent text-sm"
                                />
                                <button onClick={()=>removeRule(group.id, rule.id)} className="text-xs text-gray-500 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a]">×</button>
                              </div>
                              {/* Right: exactly 4 metric columns */}
                              <div className="hidden md:grid grid-cols-4 gap-4 w-[480px] max-w-[55%] justify-items-center">
                                {(() => {
                                  const rid = rule.id
                                  const m = getRuleMetrics(rid)
                                  return (
                                    <>
                                      <div className="text-xs text-center text-gray-700 dark:text-gray-300">{m.followRate.toFixed(0)}%</div>
                                      <div className={`text-xs text-center ${m.netPnL >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'}`}>{currency(m.netPnL)}</div>
                                      <div className="text-xs text-center text-gray-700 dark:text-gray-300">{Number.isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : '∞'}</div>
                                      <div className="text-xs text-center text-gray-700 dark:text-gray-300">{m.winRate.toFixed(0)}%</div>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                            )}
                          </SortableRule>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <button onClick={()=>addRule(group.id)} className="mt-2 text-xs text-[#3559E9] hover:text-[#2947d1]">+ Add rule</button>
                </div>
                )}
              </SortableGroup>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}


// Sortable wrappers
type SortableRenderArgs = {
  setNodeRef: (el: HTMLElement | null) => void
  style: React.CSSProperties
  attributes: Record<string, any>
  listeners: Record<string, any>
}

function SortableGroup({ id, children }: { id: string; children: (args: SortableRenderArgs) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : undefined
  } as React.CSSProperties
  return (
    <>
      {children({ setNodeRef, style, attributes: attributes ?? {}, listeners: listeners ?? {} })}
    </>
  )
}

function SortableRule({ id, children }: { id: string; children: (args: SortableRenderArgs) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : undefined
  } as React.CSSProperties
  return (
    <>
      {children({ setNodeRef, style, attributes: attributes ?? {}, listeners: listeners ?? {} })}
    </>
  )
}


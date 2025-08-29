'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { CleanSelect } from '@/components/ui/select'
import { NotebookEditor } from '@/components/features/notes/NotebookEditor'
import type { Note } from '@/app/notes/page'
import { getImportedTrades, TradeRecord } from '@/components/modals/ImportTradesModal'
import { modelStatsService } from '@/services/model-stats.service'
import { DataStore } from '@/services/data-store.service'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ModelChart } from '@/components/ui/model-chart'

type Frequency = 'Always' | 'Often' | 'Sometimes' | 'Rarely'

interface Rule { id: string; text: string; frequency: Frequency }
interface RuleGroup { id: string; title: string; rules: Rule[] }

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
}

const STRATEGIES_KEY = 'tradestial:strategies'
const ASSIGNMENTS_KEY = 'tradestial:strategy-assignments'

function readStrategies(): StrategyModel[] {
  try { const raw = localStorage.getItem(STRATEGIES_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
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
    setTrades(DataStore.getAllTrades())
    const onUpdated = () => setStrategies(readStrategies())
    const onStatsUpdated = () => {
      // Force re-render to refresh stats
      setTrades(DataStore.getAllTrades())
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
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#1C1C1C]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#1C1C1C] p-6">
            <div className="bg-white dark:bg-[#171717] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-500 dark:text-gray-400">
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
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1C1C1C] p-6">
          <div className="w-full max-w-none mx-auto space-y-4">
          {/* Header card */}
          <div className="bg-white dark:bg-[#171717] rounded-xl p-8 min-h-64 shadow-sm">
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
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
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
                <RulesEditor strategy={strategy} onChange={updateStrategy} />
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
    <div className="flex h-[72vh] bg-white dark:bg-[#171717] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 border-r border-gray-200 dark:border-[#2a2a2a] p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</div>
          <Button size="sm" className="h-7 px-2 text-xs bg-[#3559E9] hover:bg-[#2947d1] text-white" onClick={addNote}>Add note</Button>
        </div>
        <div className="flex-1 overflow-auto space-y-1 pr-1">
          {notes.map(n => (
            <button key={n.id} onClick={() => setSelectedId(n.id)} className={`w-full text-left px-2 py-2 rounded-md text-sm truncate ${selectedId===n.id? 'bg-[#eef2ff] dark:bg-[#1f243a] text-gray-900 dark:text-white':'hover:bg-gray-100 dark:hover:bg-[#1f1f1f] text-gray-700 dark:text-gray-300'}`}>
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
          <NotebookEditor
            note={selected}
            onUpdateNote={updateNote}
            onDeleteNote={(id, title) => deleteNote(id)}
            hideNetPnl
          />
        </div>
      </div>
    </div>
  )
}

function RulesEditor({ strategy, onChange }: { strategy: StrategyModel; onChange: (partial: Partial<StrategyModel>) => void }) {
  const groups = strategy.ruleGroups || []
  const addGroup = () => onChange({ ruleGroups: [...groups, { id: `group_${Date.now()}`, title: '', rules: [{ id: `rule_${Date.now()}`, text: '', frequency: 'Always' }] }] })
  const removeGroup = (gid: string) => onChange({ ruleGroups: groups.filter(g => g.id !== gid) })
  const setGroupTitle = (gid: string, title: string) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, title}:g) })
  const addRule = (gid: string) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, rules: [...g.rules, { id: `rule_${Date.now()}`, text: '', frequency: 'Always' }]}:g) })
  const setRule = (gid: string, rid: string, partial: Partial<Rule>) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, rules: g.rules.map(r => r.id===rid?{...r, ...partial}:r)}:g) })
  const removeRule = (gid: string, rid: string) => onChange({ ruleGroups: groups.map(g => g.id===gid?{...g, rules: g.rules.filter(r => r.id!==rid)}:g) })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Rules</div>
        <Button onClick={addGroup} className="bg-[#7c3aed] hover:bg-[#6b21a8] text-white h-8 px-3 text-xs">Create group</Button>
      </div>
      {groups.length === 0 && (
        <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No Playbook Rules</div>
      )}
      <div className="space-y-3">
        {groups.map((group, groupIndex) => (
          <div key={group.id || `group-${groupIndex}`} className="rounded-lg p-3 bg-gray-50 dark:bg-[#121212]">
            <div className="flex items-center gap-2 mb-2">
              <input value={group.title} onChange={(e)=>setGroupTitle(group.id, e.target.value)} placeholder="E.g. Entry criteria" className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white px-3 border border-transparent outline-none focus:ring-0" />
              <button onClick={()=>removeGroup(group.id)} className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-gray-200/60 dark:hover:bg-[#2a2a2a]">×</button>
            </div>
            <div className="space-y-2">
              {group.rules.map((rule, ruleIndex) => (
                <div key={rule.id || `rule-${ruleIndex}`} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-9">
                    <input value={rule.text} onChange={(e)=>setRule(group.id, rule.id, { text: e.target.value })} placeholder="E.g. Trading above VWAP" className="w-full h-9 rounded-lg bg-white dark:bg-[#121212] text-gray-900 dark:text-white px-3 border border-transparent outline-none focus:ring-0" />
                  </div>
                  <div className="col-span-2">
                    <CleanSelect value={rule.frequency} onChange={(e)=>setRule(group.id, rule.id, { frequency: e.target.value as Frequency })} className="w-full">
                      <option value="Always">Always</option>
                      <option value="Often">Often</option>
                      <option value="Sometimes">Sometimes</option>
                      <option value="Rarely">Rarely</option>
                    </CleanSelect>
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={()=>removeRule(group.id, rule.id)} className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-gray-200/60 dark:hover:bg-[#2a2a2a]">×</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>addRule(group.id)} className="mt-2 text-xs text-[#3559E9] hover:text-[#2947d1]">+ Add rule</button>
          </div>
        ))}
      </div>
    </div>
  )
}



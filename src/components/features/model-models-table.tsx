'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getImportedTrades, TradeRecord } from '@/components/modals/ImportTradesModal'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal, ArrowUpDown, Edit, Copy, Share, Trash2 } from 'lucide-react'
import { ShareStrategyDialog } from './share-strategy-dialog'

type Strategy = {
  id: string
  name: string
  emoji?: string
  emojiUnified?: string
  image?: string
  updatedAt: number
}

type StrategyStats = {
  total: number
  wins: number
  losses: number
  winRate: number
  netPnL: number
  avgWinner: number
  avgLoser: number
  profitFactor: number
  expectancy: number
}

const STRATEGIES_KEY = 'tradestial:strategies'
const ASSIGNMENTS_KEY = 'tradestial:strategy-assignments'

function readStrategies(): Strategy[] {
  try {
    const raw = localStorage.getItem(STRATEGIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readAssignments(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function computeStats(trades: TradeRecord[], tradeIds: string[] | undefined): StrategyStats {
  const assigned = new Set(tradeIds || [])
  const subset = trades.filter(t => assigned.has((t as any).id))
  const total = subset.length
  let wins = 0
  let losses = 0
  let sumWin = 0
  let sumLossAbs = 0
  let netPnL = 0

  for (const t of subset) {
    const pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat(String((t as any).pnl || 0))
    netPnL += pnl
    if (pnl > 0) {
      wins += 1
      sumWin += pnl
    } else if (pnl < 0) {
      losses += 1
      sumLossAbs += Math.abs(pnl)
    }
  }

  const winRate = total ? (wins / total) * 100 : 0
  const avgWinner = wins ? sumWin / wins : 0
  const avgLoser = losses ? -(sumLossAbs / losses) : 0
  const profitFactor = sumLossAbs > 0 ? sumWin / sumLossAbs : wins > 0 ? Infinity : 0
  const expectancy = total ? (wins / total) * avgWinner + (losses / total) * avgLoser : 0

  return { total, wins, losses, winRate, netPnL, avgWinner, avgLoser, profitFactor, expectancy }
}

export function ModelModelsTable() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<{ strategy: Strategy; stats: StrategyStats } | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleShare = (strategy: Strategy, stats: StrategyStats) => {
    setSelectedStrategy({ strategy, stats })
    setShareDialogOpen(true)
  }

  const handleDelete = (strategyId: string) => {
    if (isDev) console.debug('Delete function called with ID:', strategyId)
    if (isDev) console.debug('Current strategies before delete:', strategies)
    
    if (confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      try {
        // Get current data from localStorage to ensure we have the latest
        const currentStrategiesRaw = localStorage.getItem(STRATEGIES_KEY)
        const currentStrategies = currentStrategiesRaw ? JSON.parse(currentStrategiesRaw) : []
        if (isDev) console.debug('Current strategies from localStorage:', currentStrategies)
        
        // Remove strategy from strategies list
        const updatedStrategies = currentStrategies.filter((s: Strategy) => s.id !== strategyId)
        if (isDev) console.debug('Filtered strategies:', updatedStrategies)
        
        localStorage.setItem(STRATEGIES_KEY, JSON.stringify(updatedStrategies))
        if (isDev) console.debug('Saved updated strategies to localStorage')
        
        // Remove strategy assignments
        const updatedAssignments = { ...assignments }
        delete updatedAssignments[strategyId]
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updatedAssignments))
        
        // Clean up associated notes
        localStorage.removeItem(`tradestial:strategy-notes:${strategyId}`)
        localStorage.removeItem(`tradestial:strategy-note:${strategyId}`) // Legacy key
        
        // Update state
        setStrategies(updatedStrategies)
        setAssignments(updatedAssignments)
        
        if (isDev) console.debug('State updated, dispatching refresh event')
        
        // Trigger refresh event
        window.dispatchEvent(new CustomEvent('tradestial:strategies-updated'))
        
        // Force a page refresh if the event doesn't work
        setTimeout(() => {
          window.location.reload()
        }, 100)
        
        if (isDev) console.debug('Delete completed successfully')
      } catch (error) {
        if (isDev) console.error('Failed to delete strategy:', error)
        alert('Failed to delete model. Please try again.')
      }
    }
  }

  const handleDuplicate = (strategy: Strategy) => {
    try {
      const newStrategy: Strategy = {
        ...strategy,
        id: `strategy_${Date.now()}`,
        name: `${strategy.name} (Copy)`,
        updatedAt: Date.now()
      }
      
      const updatedStrategies = [newStrategy, ...strategies]
      localStorage.setItem(STRATEGIES_KEY, JSON.stringify(updatedStrategies))
      setStrategies(updatedStrategies)
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tradestial:strategies-updated'))
    } catch (error) {
      console.error('Failed to duplicate strategy:', error)
      alert('Failed to duplicate model. Please try again.')
    }
  }

  const handleEdit = (strategyId: string) => {
    if (isDev) console.debug('Edit function called with ID:', strategyId)
    // Navigate to the strategy detail page for editing
    try {
      router.push(`/model/${strategyId}`)
    } catch (error) {
      if (isDev) console.error('Failed to navigate:', error)
      // Fallback to window.location
      window.location.href = `/model/${strategyId}`
    }
  }

  useEffect(() => {
    setMounted(true)
    setStrategies(readStrategies())
    setAssignments(readAssignments())
    setTrades(getImportedTrades() || [])

    const refresh = () => {
      setStrategies(readStrategies())
      setAssignments(readAssignments())
    }
    window.addEventListener('tradestial:strategies-updated', refresh as EventListener)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('tradestial:strategies-updated', refresh as EventListener)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null)
    }

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])


  const rows = useMemo(() => {
    const mapped = strategies.map(s => ({
      strategy: s,
      stats: computeStats(trades, assignments[s.id])
    }))
    
    if (!sortField) return mapped
    
    return mapped.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortField) {
        case 'title':
          aVal = a.strategy.name.toLowerCase()
          bVal = b.strategy.name.toLowerCase()
          break
        case 'missedTrades':
          aVal = 0 // Not implemented
          bVal = 0
          break
        case 'averageLoser':
          aVal = Math.abs(a.stats.avgLoser)
          bVal = Math.abs(b.stats.avgLoser)
          break
        case 'averageWinner':
          aVal = a.stats.avgWinner
          bVal = b.stats.avgWinner
          break
        case 'totalNetPL':
          aVal = a.stats.netPnL
          bVal = b.stats.netPnL
          break
        case 'profitFactor':
          aVal = Number.isFinite(a.stats.profitFactor) ? a.stats.profitFactor : 0
          bVal = Number.isFinite(b.stats.profitFactor) ? b.stats.profitFactor : 0
          break
        case 'trades':
          aVal = a.stats.total
          bVal = b.stats.total
          break
        case 'expectancy':
          aVal = a.stats.expectancy
          bVal = b.stats.expectancy
          break
        case 'winRate':
          aVal = a.stats.winRate
          bVal = b.stats.winRate
          break
        default:
          return 0
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [strategies, assignments, trades, sortField, sortDirection])

  if (strategies.length === 0) {
    return (
      <div className="bg-white dark:bg-[#171717] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-500 dark:text-gray-400">
        No models yet. Create one to see stats.
      </div>
    )
  }

  const currency = (n: number) => {
    const sign = n < 0 ? '-' : ''
    const v = Math.abs(n)
    return `${sign}$${v.toFixed(0)}`
  }

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#1f1f1f] text-gray-600 dark:text-gray-300">
              <th className="text-left font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                >
                  Title
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3">Missed trades</th>
              <th className="text-right font-semibold px-4 py-3">Shared models</th>
              <th className="text-right font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('averageLoser')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ml-auto"
                >
                  Average loser
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('averageWinner')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ml-auto"
                >
                  Average winner
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('totalNetPL')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ml-auto"
                >
                  Total net P&L
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('profitFactor')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ml-auto"
                >
                  Profit factor
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('trades')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ml-auto"
                >
                  Trades
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('expectancy')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ml-auto"
                >
                  Expectancy
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3">
                <button 
                  onClick={() => handleSort('winRate')}
                  className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ml-auto"
                >
                  Win rate
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right font-semibold px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ strategy, stats }) => (
              <tr
                key={strategy.id}
                className="border-t border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1b1b1b] cursor-pointer"
                onClick={() => window.location.href = `/model/${strategy.id}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 group">
                    <div className="h-6 w-6 rounded-md bg-gray-100 dark:bg-[#1f1f1f] flex items-center justify-center">
                      {strategy.image ? (
                        <img 
                          src={strategy.image} 
                          alt="Strategy avatar" 
                          className="w-5 h-5 rounded object-cover"
                        />
                      ) : strategy.emojiUnified ? (
                        <img 
                          src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${strategy.emojiUnified}.png`}
                          alt="Strategy emoji"
                          className="w-4 h-4"
                          onError={(e) => {
                            // Fallback to Unicode emoji if Apple image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-base">${strategy.emoji || '😊'}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-base">{strategy.emoji || '😊'}</span>
                      )}
                    </div>
                    <div className="text-gray-900 dark:text-white font-medium group-hover:underline">{strategy.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">0</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">-</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">${Math.abs(stats.avgLoser).toFixed(0)}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">${stats.avgWinner.toFixed(0)}</td>
                <td className={"px-4 py-3 text-right font-medium " + (stats.netPnL >= 0 ? 'text-cyan-400' : 'text-red-600')}>{currency(stats.netPnL)}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(1) : '0.0'}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{stats.total}</td>
                <td className={"px-4 py-3 text-right font-medium " + (stats.expectancy >= 0 ? 'text-cyan-400' : 'text-red-600')}>{currency(stats.expectancy)}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{stats.winRate.toFixed(0)}%</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {/* Three dots button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isDev) console.debug('Three dots clicked for:', strategy.id)
                      
                      const rect = e.currentTarget.getBoundingClientRect()
                      setDropdownPosition({
                        top: rect.bottom + 8,
                        right: window.innerWidth - rect.right
                      })
                      setOpenDropdownId(openDropdownId === strategy.id ? null : strategy.id)
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <ShareStrategyDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        strategy={selectedStrategy?.strategy || null}
        stats={selectedStrategy?.stats || null}
      />
      
      {/* Portal Dropdown */}
      {mounted && openDropdownId && dropdownPosition && createPortal(
        <div 
          className="fixed min-w-[160px] bg-white dark:bg-[#171717] rounded-lg p-1 shadow-2xl border border-gray-200 dark:border-[#2a2a2a]"
          style={{
            zIndex: 999999,
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {strategies.find(s => s.id === openDropdownId) && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isDev) console.debug('Edit clicked for:', openDropdownId)
                  router.push(`/model/${openDropdownId}`)
                  setOpenDropdownId(null)
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit model
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isDev) console.debug('Duplicate clicked for:', openDropdownId)
                  const strategy = strategies.find(s => s.id === openDropdownId)
                  if (strategy) handleDuplicate(strategy)
                  setOpenDropdownId(null)
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Copy className="w-4 h-4 mr-3" />
                Duplicate
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isDev) console.debug('Share clicked for:', openDropdownId)
                  const strategy = strategies.find(s => s.id === openDropdownId)
                  const stats = strategy ? computeStats(trades, assignments[strategy.id]) : null
                  if (strategy && stats) handleShare(strategy, stats)
                  setOpenDropdownId(null)
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Share className="w-4 h-4 mr-3" />
                Share
              </button>
              
              <div className="h-px bg-gray-200 my-1" />
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isDev) {
                    console.debug('=== DELETE DEBUGGING ===')
                    console.debug('Delete clicked for ID:', openDropdownId)
                    console.debug('Current strategies in state:', strategies)
                    console.debug('Strategies from localStorage:', localStorage.getItem('tradestial:strategies'))
                    console.debug('All localStorage keys:', Object.keys(localStorage))
                  }
                  
                  // Get fresh data from localStorage
                  const rawData = localStorage.getItem('tradestial:strategies')
                  if (isDev) console.debug('Raw localStorage data:', rawData)
                  
                  const currentStrategies = rawData ? JSON.parse(rawData) : []
                  if (isDev) console.debug('Parsed localStorage strategies:', currentStrategies)
                  
                  const updatedStrategies = currentStrategies.filter((s: Strategy) => {
                    if (isDev) console.debug(`Comparing strategy ID "${s.id}" with target ID "${openDropdownId}"`)
                    return s.id !== openDropdownId
                  })
                  
                  if (isDev) console.debug('Updated strategies after filter:', updatedStrategies)
                  if (isDev) console.debug('Strategies removed:', currentStrategies.length - updatedStrategies.length)
                  
                  // Save back to localStorage
                  localStorage.setItem('tradestial:strategies', JSON.stringify(updatedStrategies))
                  if (isDev) console.debug('Saved to localStorage, verifying...')
                  if (isDev) console.debug('Verification - localStorage now contains:', localStorage.getItem('tradestial:strategies'))
                  
                  // Update React state
                  setStrategies(updatedStrategies)
                  if (isDev) console.debug('React state updated')
                  
                  // Also update assignments to clean up
                  const updatedAssignments = { ...assignments }
                  delete updatedAssignments[openDropdownId]
                  setAssignments(updatedAssignments)
                  localStorage.setItem('tradestial:strategy-assignments', JSON.stringify(updatedAssignments))
                  
                  // Trigger refresh event for other components
                  window.dispatchEvent(new CustomEvent('tradestial:strategies-updated'))
                  if (isDev) console.debug('Delete completed without reload')
                  setOpenDropdownId(null)
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}



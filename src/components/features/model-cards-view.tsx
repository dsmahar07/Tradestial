'use client'

import { logger } from '@/lib/logger'

import { useEffect, useMemo, useState } from 'react'
import { modelStatsService } from '@/services/model-stats.service'
import { DataStore } from '@/services/data-store.service'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Copy, Share, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { ShareStrategyDialog } from './share-strategy-dialog'
import { createPortal } from 'react-dom'

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
  return modelStatsService.getAllAssignments()
}

export function ModelCardsView() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})
  const [trades, setTrades] = useState<any[]>([])
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<{ strategy: Strategy; stats: StrategyStats } | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

  const handleShare = (strategy: Strategy, stats: StrategyStats) => {
    setSelectedStrategy({ strategy, stats })
    setShareDialogOpen(true)
  }

  const handleDelete = (strategyId: string) => {
    if (confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      try {
        const currentStrategiesRaw = localStorage.getItem(STRATEGIES_KEY)
        const currentStrategies = currentStrategiesRaw ? JSON.parse(currentStrategiesRaw) : []
        
        const updatedStrategies = currentStrategies.filter((s: Strategy) => s.id !== strategyId)
        localStorage.setItem(STRATEGIES_KEY, JSON.stringify(updatedStrategies))
        
        const updatedAssignments = { ...assignments }
        delete updatedAssignments[strategyId]
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updatedAssignments))
        
        localStorage.removeItem(`tradestial:strategy-notes:${strategyId}`)
        localStorage.removeItem(`tradestial:strategy-note:${strategyId}`)
        
        setStrategies(updatedStrategies)
        setAssignments(updatedAssignments)
        
        window.dispatchEvent(new CustomEvent('tradestial:strategies-updated'))
      } catch (error) {
        logger.error('Failed to delete strategy:', error)
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
      
      window.dispatchEvent(new CustomEvent('tradestial:strategies-updated'))
    } catch (error) {
      logger.error('Failed to duplicate strategy:', error)
      alert('Failed to duplicate model. Please try again.')
    }
  }

  const handleEdit = (strategyId: string) => {
    try {
      router.push(`/model/${strategyId}`)
    } catch (error) {
      window.location.href = `/model/${strategyId}`
    }
  }

  useEffect(() => {
    setMounted(true)
    setStrategies(readStrategies())
    setAssignments(readAssignments())
    setTrades(DataStore.getAllTrades().map(trade => ({
      ...trade,
      date: trade.openDate,
      pnl: trade.netPnl
    })))

    const refresh = () => {
      setStrategies(readStrategies())
      setAssignments(readAssignments())
    }
    
    const refreshStats = () => {
      setTrades(DataStore.getAllTrades().map(trade => ({
        ...trade,
        date: trade.openDate,
        pnl: trade.netPnl
      })))
      setStrategies(prev => [...prev])
    }
    
    window.addEventListener('tradestial:strategies-updated', refresh as EventListener)
    window.addEventListener('tradestial:model-stats-updated', refreshStats as EventListener)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('tradestial:strategies-updated', refresh as EventListener)
      window.removeEventListener('tradestial:model-stats-updated', refreshStats as EventListener)
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
    return strategies.map(s => ({
      strategy: s,
      stats: modelStatsService.calculateModelStats(s.id, trades, false)
    }))
  }, [strategies, assignments, trades])

  if (strategies.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-500 dark:text-gray-400">
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map(({ strategy, stats }) => (
          <div
            key={strategy.id}
            role="button"
            tabIndex={0}
            aria-label={`Open model ${strategy.name}`}
            className="group relative w-full rounded-[32px] bg-[#fafcff] dark:bg-[#171717] ring-1 ring-gray-200 dark:ring-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-visible cursor-pointer transform transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(93,60,210,0.18)] hover:ring-[#c7b8ff] dark:hover:ring-[#5d3cd2] active:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#c7b8ff] dark:focus:ring-[#5d3cd2]"
            onClick={() => window.location.href = `/model/${strategy.id}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = `/model/${strategy.id}`
              }
            }}
          >
            {/* Card Header */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      {strategy.image ? (
                        <img 
                          src={strategy.image} 
                          alt="Strategy avatar" 
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : strategy.emojiUnified ? (
                        <img 
                          src={`https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${strategy.emojiUnified}.png`}
                          alt="Strategy emoji"
                          className="w-5 h-5"
                          onError={(e) => {
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
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {strategy.name}
                    </span>
                  </div>
                  <div 
                    className="text-lg font-semibold"
                    style={{
                      color: stats.netPnL >= 0 ? '#10b981' : '#ef4444'
                    }}
                  >
                    Net P&L {currency(stats.netPnL)}
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
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
              </div>
            </div>
            
            {/* Inner container for stats content */}
            <div className="mb-0 rounded-[32px] bg-white dark:bg-[#0f0f0f] shadow-sm transition-colors duration-200">
              {/* Stats Section */}
              <div className="px-6 py-3">
                <div className="space-y-4">
                  {/* First Row */}
                  <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-[#2a2a2a]">
                    <div className="pr-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Win rate</div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stats.winRate.toFixed(0)}%
                        </div>
                        {/* Circular Progress Chart */}
                        <div className="relative w-6 h-6">
                          <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                            {/* Background circle */}
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-200 dark:text-gray-600"
                            />
                            {/* Progress circle */}
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 10}`}
                              strokeDashoffset={`${2 * Math.PI * 10 * (1 - stats.winRate / 100)}`}
                              className={stats.winRate >= 50 ? "text-green-500" : "text-red-500"}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="px-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Trades</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stats.total}
                      </div>
                    </div>
                    <div className="pl-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit factor</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Second Row */}
                  <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-[#2a2a2a]">
                    <div className="pr-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Daily win rate</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        33%
                      </div>
                    </div>
                    <div className="px-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg trade duration</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        4m
                      </div>
                    </div>
                    <div className="pl-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Win/Loss</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stats.wins > 0 && stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
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
          className="fixed min-w-[160px] bg-white dark:bg-[#0f0f0f] rounded-lg p-1 shadow-2xl border border-gray-200 dark:border-[#2a2a2a]"
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
                  const strategy = strategies.find(s => s.id === openDropdownId)
                  const stats = strategy ? modelStatsService.calculateModelStats(strategy.id, trades, false) : null
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
                  handleDelete(openDropdownId)
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

"use client"

import { logger } from '@/lib/logger'

import * as React from "react"
import { useState, useEffect } from "react"
import * as Tooltip from "@radix-ui/react-tooltip"
import * as Separator from "@radix-ui/react-separator"
import { Trade, RunningPnlPoint } from "@/services/trade-data.service"
import { modelStatsService } from "@/services/model-stats.service"
import { RuleTrackingService } from "@/services/rule-tracking.service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import ReactECharts from 'echarts-for-react'
import { PencilIcon, SwatchIcon, TrashIcon } from '@heroicons/react/24/outline'
import { chartColorPalette } from '@/config/theme'

export type StrategyCardProps = {
  title: string
  subtitle?: string
  trade: Trade | null
  highlight?: boolean
  runningPnlData?: RunningPnlPoint[]
  categories?: Array<{ id: string; name: string; color: string }>
  tags?: Record<string, string[]>
  profitTarget?: string
  stopLoss?: string
  rating?: number
  onProfitTargetChange?: (value: string) => void
  onStopLossChange?: (value: string) => void
  onRatingChange?: (rating: number) => void
  onAddTag?: (categoryId: string, tag: string) => void
  onRemoveTag?: (categoryId: string, tag: string) => void
  onUpdateCategory?: (categoryId: string, updates: { name?: string; color?: string }) => void
  onShowColorPicker?: (categoryId: 'mistakes' | 'custom' | null) => void
}

function formatMoney(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "$0"
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function parseCurrency(value: any): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return parseFloat(value.replace(/[$,]/g, ""))
  return NaN
}

export function StrategyCard({ 
  title, 
  subtitle, 
  trade, 
  highlight,
  runningPnlData = [],
  categories = [],
  tags = {},
  profitTarget,
  stopLoss,
  rating,
  onProfitTargetChange,
  onStopLossChange,
  onRatingChange,
  onAddTag,
  onRemoveTag,
  onUpdateCategory,
  onShowColorPicker,
}: StrategyCardProps) {
  const [renderKey, setRenderKey] = useState(0)
  
  useEffect(() => {
    setRenderKey(prev => prev + 1)
  }, [trade?.id, trade?.side, trade?.netPnl])

  const [strategies, setStrategies] = React.useState<Array<{ id: string; name: string }>>([])
  const [selectedStrategyId, setSelectedStrategyId] = React.useState<string>("")
  const [ruleChecks, setRuleChecks] = React.useState<Record<string, boolean>>({})
  const [isModelMenuOpen, setIsModelMenuOpen] = React.useState(false)
  const [showChecklist, setShowChecklist] = React.useState(false)
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [selectedMistakesTag, setSelectedMistakesTag] = React.useState('')
  const [selectedCustomTag, setSelectedCustomTag] = React.useState('')
  const [currentRating, setCurrentRating] = React.useState<number | undefined>(rating)
  const [hoverRating, setHoverRating] = React.useState<number | null>(null)

  // Update currentRating when rating prop changes (for different trades)
  useEffect(() => {
    setCurrentRating(rating)
  }, [rating])

  // Retrieve full selected strategy object (with ruleGroups) from localStorage
  const selectedStrategy = (() => {
    if (typeof window === 'undefined') return null as any
    try {
      const raw = localStorage.getItem('tradestial:strategies')
      const list = raw ? JSON.parse(raw) : []
      return list.find((s: any) => String(s.id) === String(selectedStrategyId)) || null
    } catch {
      return null as any
    }
  })()

  // Sync local rating state with prop changes
  React.useEffect(() => {
    setCurrentRating(rating)
  }, [rating])

  React.useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(isDark)
    }
    
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  // Load per-trade rule checks when trade or model changes
  React.useEffect(() => {
    if (!trade?.id) { setRuleChecks({}); return }
    try {
      const raw = localStorage.getItem(`tradestial:rule-checks:${trade.id}`)
      const checks = raw ? JSON.parse(raw) : {}
      setRuleChecks(checks)
    } catch {
      setRuleChecks({})
    }
  }, [trade?.id, selectedStrategyId])

  const persistRuleCheck = (ruleId: string, checked: boolean) => {
    if (!trade?.id) return
    const updated = { ...ruleChecks, [ruleId]: checked }
    setRuleChecks(updated)
    try {
      localStorage.setItem(`tradestial:rule-checks:${trade.id}`, JSON.stringify(updated))
    } catch (e) {
      logger.warn('Failed to persist rule check:', e)
    }
  }

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("tradestial:strategies")
      const list = raw ? JSON.parse(raw) : []
      if (Array.isArray(list)) {
        setStrategies(list.map((s: any) => ({ id: String(s.id), name: String(s.name || "Untitled") })))
      } else {
        setStrategies([])
      }
    } catch {
      setStrategies([])
    }
  }, [])

  React.useEffect(() => {
    if (!trade?.id) { setSelectedStrategyId(""); return }
    const assignedModelId = modelStatsService.getTradeModel(trade.id)
    if (assignedModelId) setSelectedStrategyId(String(assignedModelId))
  }, [trade?.id])

  const pnl = trade?.netPnl ?? 0
  const entry = parseCurrency(trade?.entryPrice)
  const exit = parseCurrency(trade?.exitPrice)
  const points = trade ? Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)) : 0

  // Debug logging
  logger.debug('🎯 TradeStatsCard - Received props:', {
    title,
    subtitle,
    trade: trade ? {
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      sideType: typeof trade.side,
      sideUpperCase: trade.side?.toUpperCase(),
      netPnl: trade.netPnl,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      fullTradeObject: trade
    } : null,
    pnl,
    entry,
    exit,
    points
  })
  
  logger.debug('🔍 Raw trade.side value:', trade?.side)
  logger.debug('🔍 Badge will show:', trade?.side?.toUpperCase() || 'UNKNOWN')

  return (
    <div className="relative w-full">
      {/* Glow background - blended with page background */}
      <div className="absolute -inset-4 rounded-[32px] bg-white dark:bg-[#0f0f0f] pointer-events-none" />

      {/* Main card */}
      <div className="relative rounded-[44px] bg-[#fafcff] dark:bg-[#171717] ring-1 ring-gray-200 dark:ring-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-visible">
        {/* Top chip and badge */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717] text-gray-600 dark:text-gray-300 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            </div>
            <div className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-600">
              {trade?.side?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>

          <h3 className="mt-6 text-2xl"><span className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">{title}</span></h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Price-like headline */}
        <div className="px-6 mt-6 flex items-baseline gap-1">
          <div className="text-5xl font-bold" style={{ color: pnl >= 0 ? '#10B981' : '#ef4444' }}>
            {formatMoney(pnl)}
          </div>
          <div className="text-gray-500 text-lg">Net</div>
          <div className="ml-auto text-sm text-gray-400">
            {trade ? `${formatMoney(trade.entryPrice)} - ${formatMoney(trade.exitPrice)}` : '--'}
          </div>
        </div>

        {/* Full Stats Section from StatsWidget */}
        <div className="px-2 py-6 mt-6">
          <div className="relative z-30 bg-white dark:bg-[#0f0f0f] rounded-[32px] p-6 shadow-[0_8px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
            {/* Trade Metrics */}
            <div className="space-y-2 text-sm">

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Contracts traded</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">
                  {trade?.contractsTraded || 0}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Points</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">
                  {trade ? Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)).toFixed(2) : '0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Ticks</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">
                  {trade ? (Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)) * 4).toFixed(1) : '0.0'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Ticks Per Contract</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">
                  {trade && trade.contractsTraded ? ((Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)) * 4) / trade.contractsTraded).toFixed(1) : '0.0'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Commissions & Fees</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">
                  ${trade?.commissions?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Net ROI</span>
                <span 
                  className="font-bold dark:text-gray-300"
                  style={{
                    color: trade && trade.netRoi >= 0 ? '#10b981' : '#ef4444'
                  }}
                >
                  {trade ? `${trade.netRoi >= 0 ? '+' : ''}${trade.netRoi.toFixed(2)}%` : '0.00%'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Gross P&L</span>
                <span 
                  className="font-bold dark:text-gray-300"
                  style={{
                    color: (trade ? (trade.grossPnl ?? 0) : 0) >= 0 ? '#10b981' : '#ef4444'
                  }}
                >
                  {(() => {
                    const gp = trade ? (trade.grossPnl ?? trade.netPnl ?? 0) : 0
                    const sign = gp >= 0 ? '+' : ''
                    return `${sign}$${Math.abs(gp).toFixed(2)}`
                  })()}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Adjusted Cost</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">
                  ${trade ? ((trade.entryPrice || 0) * (trade.contractsTraded || 1)).toFixed(0) : '0'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Model</span>
                <DropdownMenu open={isModelMenuOpen} onOpenChange={(o) => { setIsModelMenuOpen(o); if (!o) setShowChecklist(false) }}>
                  <DropdownMenuTrigger asChild>
                    <button className="text-xs font-medium hover:underline transition-colors" style={{color: '#7F85AF'}}>
                      {(() => {
                        const current = strategies.find(s => s.id === selectedStrategyId)
                        return current ? current.name : 'Add model'
                      })()}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto p-1">
                    {selectedStrategyId ? (
                      <>
                        <DropdownMenuItem
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                          onClick={() => {
                            if (trade && trade.id && selectedStrategyId) {
                              modelStatsService.removeTradeFromModel(trade.id, selectedStrategyId)
                              setSelectedStrategyId('')
                              setShowChecklist(false)
                              window.dispatchEvent(new CustomEvent('tradestial:model-stats-updated'))
                            }
                          }}
                        >
                          <span className="text-red-500">❌</span>
                          Remove Assignment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : null}

                    {strategies.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">No models found</div>
                    ) : (
                      strategies.map((s) => (
                        s.id === selectedStrategyId && showChecklist ? (
                          <DropdownMenuSub key={s.id}>
                            <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2 text-sm rounded-md">
                              <span className={`inline-block h-2 w-2 rounded-full bg-[#3559E9]`} />
                              <span className="truncate">{s.name}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-72 max-h-80 overflow-y-auto">
                              <div className="px-1 py-1">
                                <div className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2 px-2">Rules Checklist</div>
                                {(() => {
                                  const groups = (selectedStrategy?.ruleGroups || []) as Array<{ id: string; title?: string; rules?: any[] }>
                                  if (!groups.length) {
                                    return <div className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-2">No rules defined for this model</div>
                                  }
                                  return (
                                    <div className="space-y-2 px-2 pb-2">
                                      {groups.map((g) => {
                                        const rules = Array.isArray(g?.rules) ? g.rules : []
                                        return (
                                          <div key={g.id || Math.random().toString(36)}>
                                            {g?.title ? (
                                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{g.title}</div>
                                            ) : null}
                                            <div className="space-y-1">
                                              {rules.map((r: any, idx: number) => {
                                                const rid = String(r?.id || `${(typeof r === 'string' ? r : (r?.text ?? ''))}`)
                                                const label = typeof r === 'string' ? r : (r?.text ?? '')
                                                if (!label) return null
                                                const checked = !!ruleChecks[rid]
                                                return (
                                                  <label key={rid || idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                                    <input
                                                      type="checkbox"
                                                      className="mt-0.5 h-3.5 w-3.5"
                                                      checked={checked}
                                                      onChange={(e) => persistRuleCheck(rid, e.currentTarget.checked)}
                                                    />
                                                    <span className="leading-4">{label}</span>
                                                  </label>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}
                                <div className="mt-2 px-2">
                                  <button
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    onClick={() => { window.location.href = `/model/${selectedStrategyId}` }}
                                  >
                                    Open Model
                                  </button>
                                </div>
                              </div>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        ) : (
                          <DropdownMenuItem
                            key={s.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                            onClick={(e) => {
                              if (s.id === selectedStrategyId) {
                                e.preventDefault()
                                setShowChecklist(true)
                                return
                              }
                              if (trade && trade.id) {
                                modelStatsService.assignTradeToModel(trade.id, s.id)
                                setSelectedStrategyId(s.id)
                                setShowChecklist(true)
                                RuleTrackingService.trackModelSelection(trade.id, s.name)
                                window.dispatchEvent(new CustomEvent('tradestial:model-stats-updated'))
                              }
                            }}
                          >
                            <span className={`inline-block h-2 w-2 rounded-full ${s.id === selectedStrategyId ? 'bg-[#3559E9]' : 'bg-gray-300'}`} />
                            <span className="truncate">{s.name}</span>
                          </DropdownMenuItem>
                        )
                      ))
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                      onClick={() => { window.location.href = '/model' }}
                    >
                      <span className="text-gray-500">➕</span>
                      Create New Model
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Scale Bar with Tooltip */}
              <div className="flex justify-between items-center py-1 group relative">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Scale</span>
                <div className="relative h-2 w-24 bg-gray-200 dark:bg-neutral-800 rounded-full cursor-pointer">
                  <div 
                    className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]"
                    style={{ 
                      width: `${(() => {
                        if (!trade || !profitTarget || !stopLoss) return '50%'
                        const entryPrice = parseCurrency(trade.entryPrice || 0)
                        const targetPrice = parseFloat(profitTarget)
                        const stopPrice = parseFloat(stopLoss)
                        const realizedPnl = parseCurrency(trade.netPnl || 0)
                        
                        if (isNaN(entryPrice) || isNaN(targetPrice) || isNaN(stopPrice)) return '50%'
                        
                        const maxProfit = Math.abs(targetPrice - entryPrice)
                        const maxLoss = Math.abs(entryPrice - stopPrice)
                        const totalRange = maxLoss + maxProfit
                        
                        if (totalRange === 0) return '50%'
                        const position = (maxLoss + realizedPnl) / totalRange
                        const markerPos = Math.max(1, Math.min(99, position * 100))
                        return `${markerPos}%`
                      })()}`
                    }}
                  ></div>
                  {/* Marker */}
                  <span
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 block h-3 w-3 rounded-full border-2 bg-white"
                    style={{ 
                      left: `${(() => {
                        if (!trade || !profitTarget || !stopLoss) return '50%'
                        const entryPrice = parseCurrency(trade.entryPrice || 0)
                        const targetPrice = parseFloat(profitTarget)
                        const stopPrice = parseFloat(stopLoss)
                        const realizedPnl = parseCurrency(trade.netPnl || 0)
                        
                        if (isNaN(entryPrice) || isNaN(targetPrice) || isNaN(stopPrice)) return '50%'
                        
                        const maxProfit = Math.abs(targetPrice - entryPrice)
                        const maxLoss = Math.abs(entryPrice - stopPrice)
                        const totalRange = maxLoss + maxProfit
                        
                        if (totalRange === 0) return '50%'
                        const position = (maxLoss + realizedPnl) / totalRange
                        return `${Math.max(1, Math.min(99, position * 100))}%`
                      })()}`,
                      borderColor: '#693EE0'
                    }}
                  />
                </div>
                
                {/* Hover Tooltip with Chart */}
                <div className="absolute right-0 top-8 w-72 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl p-4 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-visible" style={{ zIndex: 9999 }}>
                  
                  {/* Trade Performance Chart */}
                  <div className="h-48 mb-4 relative overflow-visible">
                    <ReactECharts
                      option={{
                        backgroundColor: 'transparent',
                        tooltip: {
                          trigger: 'item',
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                          textStyle: { color: isDarkMode ? '#f9fafb' : '#111827' }
                        },
                        legend: { show: false },
                        series: [
                          {
                            type: 'pie',
                            radius: ['40%', '70%'],
                            center: ['50%', '50%'],
                            data: (() => {
                              if (!trade || !profitTarget || !stopLoss) return []
                              
                              const entryPrice = parseCurrency(trade.entryPrice || 0)
                              const targetPrice = parseFloat(profitTarget)
                              const stopPrice = parseFloat(stopLoss)
                              const realizedPnl = parseCurrency(trade.netPnl || 0)
                              
                              if (isNaN(entryPrice) || isNaN(targetPrice) || isNaN(stopPrice)) return []
                              
                              const maxLoss = Math.abs(entryPrice - stopPrice)
                              const maxProfit = Math.abs(targetPrice - entryPrice)
                              
                              // Create chart data based on realized P&L
                              const data = []
                              
                              if (realizedPnl >= 0) {
                                // Profitable trade
                                data.push({
                                  value: maxLoss,
                                  name: 'Max Loss Risk',
                                  itemStyle: { color: '#fecaca' }
                                })
                                data.push({
                                  value: realizedPnl,
                                  name: 'Realized Profit',
                                  itemStyle: { color: '#10b981' }
                                })
                                if (maxProfit > realizedPnl) {
                                  data.push({
                                    value: maxProfit - realizedPnl,
                                    name: 'Missed Profit',
                                    itemStyle: { color: '#dcfce7' }
                                  })
                                }
                              } else {
                                // Loss trade
                                const lossAmount = Math.abs(realizedPnl)
                                data.push({
                                  value: lossAmount,
                                  name: 'Realized Loss',
                                  itemStyle: { color: '#ef4444' }
                                })
                                if (maxLoss > lossAmount) {
                                  data.push({
                                    value: maxLoss - lossAmount,
                                    name: 'Remaining Risk',
                                    itemStyle: { color: '#fecaca' }
                                  })
                                }
                                data.push({
                                  value: maxProfit,
                                  name: 'Max Profit',
                                  itemStyle: { color: '#dcfce7' }
                                })
                              }
                              
                              return data.filter(item => item.value > 0)
                            })()
                          }
                        ]
                      }}
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'canvas' }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Max Loss</span>
                      <span className="font-bold text-red-600">
                        {(() => {
                          if (!trade || !stopLoss) return '--'
                          const entryPrice = parseCurrency(trade.entryPrice || 0)
                          const stopPrice = parseFloat(stopLoss)
                          if (isNaN(entryPrice) || isNaN(stopPrice)) return '--'
                          return `$${Math.abs(entryPrice - stopPrice).toFixed(0)}`
                        })()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Max Profit</span>
                      <span className="font-bold text-green-600">
                        {(() => {
                          if (!trade || !profitTarget) return '--'
                          const entryPrice = parseCurrency(trade.entryPrice || 0)
                          const targetPrice = parseFloat(profitTarget)
                          if (isNaN(entryPrice) || isNaN(targetPrice)) return '--'
                          return `$${Math.abs(targetPrice - entryPrice).toFixed(0)}`
                        })()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Realized P&L</span>
                      <span 
                        className="font-bold"
                        style={{
                          color: trade && parseCurrency(trade.netPnl || 0) >= 0 ? '#10B981' : '#ef4444'
                        }}
                      >
                        {trade ? `$${parseCurrency(trade.netPnl || 0).toFixed(0)}` : '--'}
                      </span>
                    </div>

                    {/* Performance Indicator */}
                    <div className="text-center mt-3">
                      <div 
                        className="text-sm font-bold"
                        style={{
                          color: trade && parseCurrency(trade.netPnl || 0) >= 0 ? '#10B981' : '#ef4444'
                        }}
                      >
                        {(() => {
                          if (!trade || !profitTarget || !stopLoss) return ''
                          const entryPrice = parseCurrency(trade.entryPrice || 0)
                          const targetPrice = parseFloat(profitTarget)
                          const stopPrice = parseFloat(stopLoss)
                          const realizedPnl = parseCurrency(trade.netPnl || 0)
                          
                          if (isNaN(entryPrice) || isNaN(targetPrice) || isNaN(stopPrice)) return ''
                          
                          if (realizedPnl >= 0) {
                            const maxProfit = Math.abs(targetPrice - entryPrice)
                            const percentage = maxProfit > 0 ? (realizedPnl / maxProfit) * 100 : 0
                            return `${percentage.toFixed(1)}% of Target Achieved`
                          } else {
                            const maxLoss = Math.abs(entryPrice - stopPrice)
                            const percentage = maxLoss > 0 ? (Math.abs(realizedPnl) / maxLoss) * 100 : 0
                            return `${percentage.toFixed(1)}% of Risk Taken`
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Running P&L Mini Chart */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Running P&L</span>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      const raw = (runningPnlData || []).slice(-12)
                      const data = raw.map((d, i) => ({ 
                        idx: i, 
                        value: Number(d.value || 0),
                        pos: Number(d.value || 0) > 0 ? Number(d.value || 0) : null,
                        neg: Number(d.value || 0) < 0 ? Number(d.value || 0) : null,
                      }))

                      return (
                        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="miniPnlPosGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="miniPnlNegGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="pos"
                            stroke="#14b8a6"
                            strokeWidth={1}
                            fill="url(#miniPnlPosGradient)"
                            connectNulls={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="neg"
                            stroke="#ef4444"
                            strokeWidth={1}
                            fill="url(#miniPnlNegGradient)"
                            connectNulls={false}
                          />
                        </AreaChart>
                      )
                    })()}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Price MAE / MFE */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Price MAE / MFE</span>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span className="text-red-600 dark:text-red-400 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg">
                    {trade ? `$${((trade.entryPrice || 0) - Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)) * 0.3).toFixed(0)}` : '$0'}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg" style={{color: '#14b8a6'}}>
                    {trade ? `$${((trade.entryPrice || 0) + Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)) * 0.5).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Trade Rating */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Trade Rating</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starNumber = i + 1
                    const displayRating = hoverRating !== null ? hoverRating : (currentRating || 0)
                    const isFullActive = starNumber <= displayRating
                    const isHalfActive = starNumber - 0.5 <= displayRating && displayRating < starNumber
                    
                    // Color and glow based on rating level
                    const getStarColor = (isActive: boolean) => {
                      if (!isActive) return '#d1d5db' // Gray for inactive
                      const rating = currentRating || 0
                      if (rating <= 2) return '#ef4444' // Red for low rating
                      if (rating === 3) return '#f59e0b' // Yellow for medium rating
                      if (rating === 4) return '#10b981' // Green for good rating
                      return '#fbbf24' // Golden for excellent rating
                    }
                    
                    const getStarGlow = (isActive: boolean) => {
                      if (!isActive) return 'none'
                      const rating = currentRating || 0
                      if (rating <= 2) return '0 0 12px rgba(239, 68, 68, 0.8)' // Red glow
                      if (rating === 3) return '0 0 12px rgba(245, 158, 11, 0.8)' // Yellow glow
                      if (rating === 4) return '0 0 12px rgba(16, 185, 129, 0.8)' // Green glow
                      return '0 0 16px rgba(251, 191, 36, 1)' // Golden glow for 5 stars
                    }
                    
                    return (
                      <div key={i} className="relative">
                        <svg 
                          className="w-6 h-6 cursor-pointer transition-all duration-300 ease-out transform hover:scale-110" 
                          style={{ 
                            color: '#d1d5db',
                            stroke: '#d1d5db',
                            strokeWidth: 1
                          }}
                          fill="transparent"
                          viewBox="0 0 24 24"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const isLeftHalf = x < rect.width / 2
                            const hoverValue = isLeftHalf ? starNumber - 0.5 : starNumber
                            setHoverRating(hoverValue)
                          }}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const isLeftHalf = x < rect.width / 2
                            const hoverValue = isLeftHalf ? starNumber - 0.5 : starNumber
                            if (hoverRating !== hoverValue) {
                              setHoverRating(hoverValue)
                            }
                          }}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const isLeftHalf = x < rect.width / 2
                            const newRating = isLeftHalf ? starNumber - 0.5 : starNumber
                            setCurrentRating(newRating)
                            onRatingChange?.(newRating)
                          }}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        
                        {/* Half star fill */}
                        {isHalfActive && (
                          <svg 
                            className="absolute inset-0 w-6 h-6 pointer-events-none transition-all duration-500 ease-out" 
                            style={{ 
                              color: getStarColor(true)
                            }}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <defs>
                              <clipPath id={`half-${i}`}>
                                <rect x="0" y="0" width="12" height="24" />
                              </clipPath>
                            </defs>
                            <path 
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                              clipPath={`url(#half-${i})`}
                            />
                          </svg>
                        )}
                        
                        {/* Full star fill */}
                        {isFullActive && (
                          <svg 
                            className="absolute inset-0 w-6 h-6 pointer-events-none transition-all duration-500 ease-out" 
                            style={{ 
                              color: getStarColor(true)
                            }}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Profit Target */}
              <div className="flex justify-between items-center py-1">
                <label className="font-semibold" style={{color: '#7F85AF'}}>Profit Target</label>
                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs w-32 focus-within:border-[#5B2CC9] focus-within:ring-1 focus-within:ring-[#5B2CC9] transition-all duration-200">
                  <span className="mr-1 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    value={profitTarget}
                    onChange={(e) => onProfitTargetChange?.(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent outline-none font-bold text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Stop Loss */}
              <div className="flex justify-between items-center py-1">
                <label className="font-semibold" style={{color: '#7F85AF'}}>Stop Loss</label>
                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs w-32 focus-within:border-[#5B2CC9] focus-within:ring-1 focus-within:ring-[#5B2CC9] transition-all duration-200">
                  <span className="mr-1 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => {
                      const value = e.target.value
                      onStopLossChange?.(value)
                    }}
                    placeholder="0.00"
                    className="flex-1 bg-transparent outline-none font-bold text-gray-600 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Additional metrics */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                {(() => {
                  // Calculate trading metrics
                  const calculateTradingMetrics = () => {
                    if (!trade || !profitTarget || !stopLoss) {
                      return {
                        initialTarget: '--',
                        tradeRisk: '--',
                        plannedRMultiple: '--',
                        realizedRMultiple: '--'
                      }
                    }

                    const avgEntry = parseCurrency(trade.entryPrice || 0)
                    const targetPrice = parseFloat(profitTarget)
                    const stopPrice = parseFloat(stopLoss)
                    const netPnl = parseCurrency(trade.netPnl || 0)

                    if (isNaN(avgEntry) || isNaN(targetPrice) || isNaN(stopPrice)) {
                      return {
                        initialTarget: '--',
                        tradeRisk: '--',
                        plannedRMultiple: '--',
                        realizedRMultiple: '--'
                      }
                    }

                    // Initial Target = Profit Target - Average Entry
                    const initialTarget = targetPrice - avgEntry

                    // Trade Risk = Average Entry - Stop Loss  
                    const tradeRisk = avgEntry - stopPrice

                    // Planned R-Multiple = Initial Target / Trade Risk
                    const plannedRMultiple = tradeRisk !== 0 ? initialTarget / tradeRisk : 0

                    // Realized R-Multiple = Net P&L / Trade Risk
                    const realizedRMultiple = tradeRisk !== 0 && !isNaN(netPnl) ? netPnl / Math.abs(tradeRisk) : 0

                    return {
                      initialTarget: initialTarget >= 0 ? `$${initialTarget.toFixed(2)}` : `-$${Math.abs(initialTarget).toFixed(2)}`,
                      tradeRisk: `$${Math.abs(tradeRisk).toFixed(2)}`,
                      plannedRMultiple: `${plannedRMultiple.toFixed(2)}R`,
                      realizedRMultiple: `${realizedRMultiple.toFixed(2)}R`
                    }
                  }

                  const tradingMetrics = calculateTradingMetrics()

                  return (
                    <>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold" style={{color: '#7F85AF'}}>Initial Target</span>
                        <span 
                          className="font-bold dark:text-gray-300"
                          style={{
                            color: tradingMetrics.initialTarget === '--' ? '#9ca3af' : tradingMetrics.initialTarget.startsWith('-') ? '#ef4444' : '#10B981'
                          }}
                        >
                          {tradingMetrics.initialTarget}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold" style={{color: '#7F85AF'}}>Trade Risk</span>
                        <span className={`font-bold ${tradingMetrics.tradeRisk === '--' ? 'text-gray-400' : 'text-red-600'} dark:text-gray-300`}>
                          {tradingMetrics.tradeRisk}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold" style={{color: '#7F85AF'}}>Planned R-Multiple</span>
                        <span 
                          className="font-bold dark:text-gray-300"
                          style={{
                            color: tradingMetrics.plannedRMultiple === '--' ? '#9ca3af' : parseFloat(tradingMetrics.plannedRMultiple) >= 0 ? '#10B981' : '#ef4444'
                          }}
                        >
                          {tradingMetrics.plannedRMultiple}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold" style={{color: '#7F85AF'}}>Realized R-Multiple</span>
                        <span 
                          className="font-bold dark:text-gray-300"
                          style={{
                            color: tradingMetrics.realizedRMultiple === '--' ? '#9ca3af' : parseFloat(tradingMetrics.realizedRMultiple) >= 0 ? '#10B981' : '#ef4444'
                          }}
                        >
                          {tradingMetrics.realizedRMultiple}
                        </span>
                      </div>
                      
                      
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold" style={{color: '#7F85AF'}}>Entry Time</span>
                        <span className="font-bold text-gray-600 dark:text-gray-300">
                          {trade?.entryTime || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold" style={{color: '#7F85AF'}}>Exit Time</span>
                        <span className="font-bold text-gray-600 dark:text-gray-300">
                          {trade?.exitTime || 'N/A'}
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>


              {/* Tags Section */}
              <div className="pt-3 space-y-2">
                {/* Mistakes Section */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4" style={{color: categories.find(c => c.id === 'mistakes')?.color || '#ef4444'}} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 11.5L12 15l7.5-7.5L18 6l-6 6-2.5-2.5L8.5 11.5z" opacity="0.3"/>
                    </svg>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{categories.find(c => c.id === 'mistakes')?.name || 'Mistakes'}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ml-auto transition-colors">
                          <span className="text-base font-bold">⋯</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1">
                        <DropdownMenuItem 
                          onClick={() => {
                            const currentCategory = categories.find(c => c.id === 'mistakes')
                            const newName = prompt('Enter new name:', currentCategory?.name || 'Mistakes')
                            if (newName) onUpdateCategory?.('mistakes', { name: newName })
                          }}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-500" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onShowColorPicker?.('mistakes')}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                        >
                          <SwatchIcon className="w-4 h-4 text-gray-500" />
                          Change Color
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md cursor-pointer text-red-600 dark:text-red-400">
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="relative">
                    <input
                      list="mistakes-tags"
                      type="text"
                      value={selectedMistakesTag}
                      onChange={(e) => setSelectedMistakesTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          if (selectedMistakesTag.trim()) {
                            onAddTag?.('mistakes', selectedMistakesTag.trim())
                            setSelectedMistakesTag('')
                          }
                        }
                      }}
                      placeholder="Select tag"
                      className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-500 dark:text-gray-400 focus:border-[#5B2CC9] focus:ring-1 focus:ring-[#5B2CC9] transition-all duration-200"
                    />
                    <datalist id="mistakes-tags">
                      {(tags['mistakes'] || []).map((tag) => (
                        <option key={tag} value={tag} />
                      ))}
                    </datalist>
                    {(tags['mistakes'] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(tags['mistakes'] || []).map((tag, index) => {
                          const tagColor = chartColorPalette[index % chartColorPalette.length]
                          
                          return (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md text-white font-medium shadow-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                              style={{ backgroundColor: tagColor }}
                            >
                              <span className="relative z-10">{tag}</span>
                              <button
                                onClick={() => onRemoveTag?.('mistakes', tag)}
                                className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors relative z-10"
                              >
                                <span className="text-xs">×</span>
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* All Categories Section */}
                {categories.filter(category => 
                  category.id !== 'mistakes' && 
                  !category.id.toLowerCase().includes('review') &&
                  category.id !== 'reviewed'
                ).map((category) => {
                  return (
                    <div key={category.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4" style={{color: category.color}} viewBox="0 0 24 24" fill="currentColor">
                          {category.id === 'custom' ? (
                            <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2l-4.37.84zM12 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM6 15.5v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1H6z"/>
                          ) : (
                            <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                          )}
                        </svg>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{category.name}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ml-auto transition-colors">
                              <span className="text-base font-bold">⋯</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1">
                            <DropdownMenuItem 
                              onClick={() => {
                                const newName = prompt('Enter new name:', category.name)
                                if (newName) onUpdateCategory?.(category.id, { name: newName })
                              }}
                              className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4 text-gray-500" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onShowColorPicker?.(category.id as 'mistakes' | 'custom')}
                              className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                            >
                              <SwatchIcon className="w-4 h-4 text-gray-500" />
                              Change Color
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md cursor-pointer text-red-600 dark:text-red-400">
                              <TrashIcon className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="relative">
                        <input
                          list={`${category.id}-tags`}
                          type="text"
                          value={category.id === 'custom' ? selectedCustomTag : ''}
                          onChange={(e) => {
                            if (category.id === 'custom') setSelectedCustomTag(e.target.value)
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = (e.target as HTMLInputElement).value
                              if (value.trim()) {
                                onAddTag?.(category.id, value.trim())
                                if (category.id === 'custom') setSelectedCustomTag('')
                              }
                            }
                          }}
                          placeholder="Select tag"
                          className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-500 dark:text-gray-400 focus:border-[#5B2CC9] focus:ring-1 focus:ring-[#5B2CC9] transition-all duration-200"
                        />
                        <datalist id={`${category.id}-tags`}>
                          {(tags[category.id] || []).map((tag) => (
                            <option key={tag} value={tag} />
                          ))}
                        </datalist>
                        {(tags[category.id] || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(tags[category.id] || []).map((tag, index) => {
                              const tagColor = chartColorPalette[index % chartColorPalette.length]
                              
                              return (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md text-white font-medium shadow-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                                  style={{ backgroundColor: tagColor }}
                                >
                                  <span className="relative z-10">{tag}</span>
                                  <button
                                    onClick={() => onRemoveTag?.(category.id, tag)}
                                    className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors relative z-10"
                                  >
                                    <span className="text-xs">×</span>
                                  </button>
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Footer Links */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <button className="text-blue-600 dark:text-blue-400 hover:underline">Add new category</button>
                  <button className="text-gray-500 dark:text-gray-400 hover:underline">Manage tags</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StrategyCard

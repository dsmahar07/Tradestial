'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, Dot, Tooltip } from 'recharts'
import ReactECharts from 'echarts-for-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { PencilIcon, SwatchIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Trade, RunningPnlPoint } from '@/services/trade-data.service'
import { chartColorPalette } from '@/config/theme'
import { modelStatsService } from '@/services/model-stats.service'
import { RuleTrackingService } from '@/services/rule-tracking.service'

interface StatsWidgetProps {
  trade: Trade | null
  runningPnlData: RunningPnlPoint[]
  categories: Array<{ id: string; name: string; color: string }>
  tags: Record<string, string[]>
  profitTarget: string
  stopLoss: string
  rating: number
  onProfitTargetChange: (value: string) => void
  onStopLossChange: (value: string) => void
  onRatingChange: (rating: number) => void
  onAddTag: (categoryId: string, tag: string) => void
  onRemoveTag: (categoryId: string, tag: string) => void
  onUpdateCategory: (categoryId: string, updates: { name?: string; color?: string }) => void
  onShowColorPicker: (categoryId: 'mistakes' | 'custom' | null) => void
}

export function StatsWidget({
  trade,
  runningPnlData,
  categories,
  tags,
  profitTarget,
  stopLoss,
  rating,
  onProfitTargetChange,
  onStopLossChange,
  onRatingChange,
  onAddTag,
  onRemoveTag,
  onUpdateCategory,
  onShowColorPicker
}: StatsWidgetProps) {
  const [selectedMistakesTag, setSelectedMistakesTag] = useState('')
  const [selectedCustomTag, setSelectedCustomTag] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [strategies, setStrategies] = useState<Array<{ id: string; name: string }>>([])
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('')

  useEffect(() => {
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

  // Load strategies and get assigned model for current trade
  useEffect(() => {
    const STRATEGIES_KEY = 'tradestial:strategies'

    const readStrategies = () => {
      try {
        const raw = localStorage.getItem(STRATEGIES_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        if (Array.isArray(parsed)) {
          setStrategies(parsed.map((s: any) => ({ id: String(s.id), name: String(s.name || 'Untitled') })))
          return parsed as Array<{ id: string; name: string }>
        }
      } catch {}
      setStrategies([])
      return [] as Array<{ id: string; name: string }>
    }

    const init = () => {
      const list = readStrategies()
      
      // Always check if current trade is assigned to a model
      if (trade && trade.id) {
        const assignedModelId = modelStatsService.getTradeModel(trade.id)
        if (assignedModelId && list.find(s => s.id === assignedModelId)) {
          setSelectedStrategyId(assignedModelId)
        } else {
          // No model assigned to this trade
          setSelectedStrategyId('')
        }
      } else {
        setSelectedStrategyId('')
      }
    }

    init()

    const refresh = () => init()
    window.addEventListener('tradestial:strategies-updated', refresh as EventListener)
    window.addEventListener('tradestial:model-stats-updated', refresh as EventListener)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('tradestial:strategies-updated', refresh as EventListener)
      window.removeEventListener('tradestial:model-stats-updated', refresh as EventListener)
      window.removeEventListener('storage', refresh)
    }
  }, [trade?.id])

  // Helper function to safely parse currency values
  const parseCurrency = (value: any): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[$,]/g, ''))
    }
    return NaN
  }

  // Calculate trading metrics based on profit target and stop loss
  const calculateTradingMetrics = () => {
    if (!trade || !profitTarget || !stopLoss) {
      return {
        initialTarget: '--',
        tradeRisk: '--',
        plannedRMultiple: '--',
        realizedRMultiple: '--'
      }
    }

    const avgEntry = parseCurrency(trade.entryPrice)
    const targetPrice = parseFloat(profitTarget)
    const stopPrice = parseFloat(stopLoss)
    const avgExit = parseCurrency(trade.exitPrice)
    const netPnl = parseCurrency(trade.netPnl)

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

  const addMistakesTag = (tag: string) => {
    if (tag.trim()) {
      onAddTag('mistakes', tag.trim())
      setSelectedMistakesTag('')
    }
  }

  const addCustomTag = (tag: string) => {
    if (tag.trim()) {
      onAddTag('custom', tag.trim())
      setSelectedCustomTag('')
    }
  }

  return (
    <>
      {/* Net P&L with dynamic color left border */}
      <div className="mb-6 relative">
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
          style={{
            backgroundColor: trade && trade.netPnl >= 0 ? '#10b981' : '#ef4444'
          }}
        ></div>
        <div className="pl-4 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net P&L</div>
          <div 
            className="text-2xl font-bold"
            style={{
              color: trade && trade.netPnl >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            {trade ? `${trade.netPnl >= 0 ? '+' : ''}$${Math.abs(trade.netPnl).toFixed(2)}` : '$0.00'}
          </div>
        </div>
      </div>

      {/* Divider between header and main content (full-bleed) */}
      <div className="-mx-4 border-t border-gray-200 dark:border-gray-700 mb-4" />

      {/* Trade Metrics */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-1">
          <span className="font-semibold" style={{color: '#7F85AF'}}>Side</span>
          <span 
            className="font-bold dark:text-gray-300"
            style={{
              color: trade?.side === 'LONG' ? '#10b981' : trade?.side === 'SHORT' ? '#ef4444' : '#6b7280'
            }}
          >
            {trade?.side || 'UNKNOWN'}
          </span>
        </div>

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
              return `$${sign}${Math.abs(gp).toFixed(2)}`
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-xs font-medium hover:underline transition-colors" style={{color: '#7F85AF'}}>
                {(() => {
                  const current = strategies.find(s => s.id === selectedStrategyId)
                  return current ? current.name : 'Add model'
                })()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1">
              {selectedStrategyId && (
                <>
                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                    onClick={() => {
                      window.location.href = `/model/${selectedStrategyId}`
                    }}
                  >
                    <span className="text-blue-500">🔗</span>
                    View Model Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                    onClick={() => {
                      if (trade && trade.id && selectedStrategyId) {
                        modelStatsService.removeTradeFromModel(trade.id, selectedStrategyId)
                        setSelectedStrategyId('')
                        console.log(`Removed trade ${trade.id} from model`)
                        
                        // Notify others that model stats have been updated
                        try { window.dispatchEvent(new Event('tradestial:model-stats-updated')) } catch {}
                      }
                    }}
                  >
                    <span className="text-red-500">❌</span>
                    Remove Assignment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {strategies.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">No models found</div>
              ) : (
                strategies.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                    onClick={() => {
                      if (trade && trade.id) {
                        modelStatsService.assignTradeToModel(trade.id, s.id)
                        setSelectedStrategyId(s.id)
                        console.log(`Assigned trade ${trade.id} to model ${s.name}`)
                        
                        // Track model selection for rule completion
                        RuleTrackingService.trackModelSelection(trade.id, s.name)
                        
                        // Dispatch event to notify other components
                        window.dispatchEvent(new CustomEvent('tradestial:model-stats-updated'))
                      }
                    }}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full ${selectedStrategyId===s.id?'bg-[#3559E9]':'bg-gray-300'}`} />
                    <span className="truncate">{s.name}</span>
                  </DropdownMenuItem>
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

        {/* Zella Scale */}
        <div className="flex justify-between items-center py-1 group relative">
          <span className="font-semibold" style={{color: '#7F85AF'}}>Scale</span>
          <div className="relative h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer">
            <div 
              className="absolute left-0 top-0 h-full bg-teal-500 rounded-full"
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
                  return `${Math.max(5, Math.min(95, position * 100))}%`
                })()}`
              }}
            ></div>
          </div>
          
          {/* Hover Tooltip */}
          <div className="absolute right-0 top-8 w-72 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-4 z-[9999] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-visible" style={{ zIndex: 9999 }}>
            
            {/* Trade Performance Chart */}
            <div className="h-48 mb-4 relative overflow-visible">
              <ReactECharts
                option={{
                  backgroundColor: 'transparent',
                  tooltip: {
                    trigger: 'item',
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                    borderWidth: 1,
                    borderRadius: 6,
                    textStyle: {
                      color: isDarkMode ? '#f9fafb' : '#1f2937',
                      fontSize: 12,
                      fontFamily: 'Inter, system-ui, sans-serif'
                    },
                    formatter: (params: any) => {
                      return `<div style="font-weight: 600;">${params.name}</div><div style="margin-top: 2px;">$${params.value.toLocaleString()} (${params.percent.toFixed(1)}%)</div>`
                    },
                    confine: false,
                    appendToBody: true
                  },
                  series: [
                    {
                      name: 'Trade Performance',
                      type: 'pie',
                      radius: ['45%', '75%'],
                      center: ['50%', '50%'],
                      avoidLabelOverlap: false,
                      padAngle: 2,
                      itemStyle: {
                        borderRadius: 8,
                        borderWidth: 0
                      },
                      label: {
                        show: false
                      },
                      emphasis: {
                        label: {
                          show: true,
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: '#374151'
                        },
                        scale: true,
                        scaleSize: 5
                      },
                      labelLine: {
                        show: false
                      },
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
                <span className={`font-bold ${
                  trade && parseCurrency(trade.netPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trade ? `$${parseCurrency(trade.netPnl || 0).toFixed(0)}` : '--'}
                </span>
              </div>

              {/* Performance Indicator */}
              <div className="text-center mt-3">
                <div className={`text-sm font-bold ${
                  trade && parseCurrency(trade.netPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
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

        {/* Price MAE / MFE */}
        <div className="flex justify-between items-center py-1">
          <span className="font-semibold" style={{color: '#7F85AF'}}>Price MAE / MFE</span>
          <div className="flex items-center gap-1 text-xs font-bold">
            <span className="text-red-600 dark:text-red-400">
              {trade ? `$${((trade.entryPrice || 0) - Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)) * 0.3).toFixed(0)}` : '$0'}
            </span>
            <span className="text-gray-400">/</span>
            <span style={{color: '#14b8a6'}}>
              {trade ? `$${((trade.entryPrice || 0) + Math.abs((trade.exitPrice || 0) - (trade.entryPrice || 0)) * 0.5).toFixed(2)}` : '$0.00'}
            </span>
          </div>
        </div>

        {/* Running P&L */}
        <div className="flex justify-between items-center py-1">
          <span className="font-semibold" style={{color: '#7F85AF'}}>Running P&L</span>
          <div className="h-8 w-24">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                // Map to numeric X-axis with zero-crossing insertion and split pos/neg fills
                const raw = (runningPnlData || []).slice(-12) // show last ~12 points for mini chart
                const base = raw.map((d, i) => ({ idx: i, label: d.time ?? String(i), value: Number(d.value || 0) }))

                // Insert zero-crossing points to avoid gradient bleed
                const expanded: Array<{ idx: number; label: string; value: number }> = []
                for (let i = 0; i < base.length; i++) {
                  const cur = base[i]
                  const prev = i > 0 ? base[i - 1] : undefined
                  if (prev) {
                    const s1 = Math.sign(prev.value)
                    const s2 = Math.sign(cur.value)
                    if (s1 !== 0 && s2 !== 0 && s1 !== s2) {
                      // Linear interpolate crossing at zero between prev.idx and cur.idx
                      const dv = cur.value - prev.value
                      const di = cur.idx - prev.idx || 1
                      const t = Math.abs(prev.value) / Math.abs(dv)
                      const xi = prev.idx + t * di
                      expanded.push({ idx: xi, label: cur.label, value: 0 })
                    }
                  }
                  expanded.push(cur)
                }

                const data = expanded
                  .sort((a, b) => a.idx - b.idx)
                  // Use null for inactive series so Recharts doesn't create a second tooltip/dot at 0
                  .map(p => ({
                    ...p,
                    pos: p.value > 0 ? p.value : (null as unknown as number),
                    neg: p.value < 0 ? p.value : (null as unknown as number),
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
                    <XAxis type="number" dataKey="idx" domain={["dataMin", "dataMax"]} hide />
                    <YAxis type="number" domain={["auto", "auto"]} hide />
                    <Tooltip
                      isAnimationActive
                      cursor={{ stroke: '#9ca3af', strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const main: any = payload.find((p: any) => p.dataKey === 'value') || payload[0]
                          const v = Number(main?.payload?.value ?? 0)
                          const lbl = String(main?.payload?.label ?? '')
                          const isPos = v >= 0
                          return (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow p-1.5 text-[10px]">
                              <div className="font-semibold text-gray-900 dark:text-white">{lbl}</div>
                              <div className={isPos ? 'text-green-600' : 'text-red-600'}>
                                ${isPos ? '+' : ''}{v.toFixed(2)}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    {/* Stroke line */}
                    <Area type="linear" dataKey="value" stroke="#4C25A7" strokeWidth={1.25} fillOpacity={0} baseValue={0 as any} activeDot={{ r: 2.5 }} dot={false} />
                    {/* Positive fill */}
                    <Area type="linear" dataKey="pos" strokeOpacity={0} fill="url(#miniPnlPosGradient)" baseValue={0 as any} activeDot={false} dot={false} />
                    {/* Negative fill */}
                    <Area type="linear" dataKey="neg" strokeOpacity={0} fill="url(#miniPnlNegGradient)" baseValue={0 as any} activeDot={false} dot={false} />
                  </AreaChart>
                )
              })()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade Rating */}
        <div className="flex justify-between items-center py-1">
          <span className="font-semibold" style={{color: '#7F85AF'}}>Trade Rating</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const starNumber = i + 1
              const isFullActive = starNumber <= rating
              const isHalfActive = starNumber - 0.5 <= rating && rating < starNumber
              
              // Color and glow based on rating level
              const getStarColor = (isActive: boolean) => {
                if (!isActive) return '#d1d5db' // Gray for inactive
                if (rating <= 2) return '#ef4444' // Red for low rating
                if (rating === 3) return '#f59e0b' // Yellow for medium rating
                if (rating === 4) return '#10b981' // Green for good rating
                return '#fbbf24' // Golden for excellent rating
              }
              
              const getStarGlow = (isActive: boolean) => {
                if (!isActive) return 'none'
                if (rating <= 2) return '0 0 12px rgba(239, 68, 68, 0.8)' // Red glow
                if (rating === 3) return '0 0 12px rgba(245, 158, 11, 0.8)' // Yellow glow
                if (rating === 4) return '0 0 12px rgba(16, 185, 129, 0.8)' // Green glow
                return '0 0 16px rgba(251, 191, 36, 1)' // Golden glow for 5 stars
              }
              
              return (
                <div key={i} className="relative">
                  <svg 
                    className="w-6 h-6 cursor-pointer transition-all duration-500 ease-out transform hover:scale-110" 
                    style={{ 
                      color: '#d1d5db',
                      stroke: '#d1d5db',
                      strokeWidth: 1
                    }}
                    fill="transparent"
                    viewBox="0 0 24 24"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const isLeftHalf = x < rect.width / 2
                      onRatingChange(isLeftHalf ? starNumber - 0.5 : starNumber)
                    }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  
                  {/* Half star fill */}
                  {isHalfActive && (
                    <svg 
                      className="absolute inset-0 w-6 h-6 pointer-events-none transition-all duration-500 ease-out" 
                      style={{ 
                        color: getStarColor(true),
                        filter: `drop-shadow(${getStarGlow(true)})`
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
                        color: getStarColor(true),
                        filter: `drop-shadow(${getStarGlow(true)})`
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
            <span className="mr-1 text-gray-500">$</span>
            <input
              value={profitTarget}
              onChange={(e) => onProfitTargetChange(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none font-bold text-gray-600 dark:text-gray-300 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Stop Loss */}
        <div className="flex justify-between items-center py-1">
          <label className="font-semibold" style={{color: '#7F85AF'}}>Stop Loss</label>
          <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs w-32 focus-within:border-[#5B2CC9] focus-within:ring-1 focus-within:ring-[#5B2CC9] transition-all duration-200">
            <span className="mr-1 text-gray-500">$</span>
            <input
              value={stopLoss}
              onChange={(e) => {
                const newValue = e.target.value
                onStopLossChange(newValue)
                
                // Track stop loss input for rule completion
                if (trade && trade.id && newValue.trim() !== '') {
                  RuleTrackingService.trackStopLossInput(trade.id, newValue)
                }
              }}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none font-bold text-gray-600 dark:text-gray-300 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Additional metrics */}
        <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold" style={{color: '#7F85AF'}}>Initial Target</span>
            <span className={`font-bold ${tradingMetrics.initialTarget === '--' ? 'text-gray-400' : tradingMetrics.initialTarget.startsWith('-') ? 'text-red-600' : 'text-green-600'} dark:text-gray-300`}>
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
            <span className={`font-bold ${tradingMetrics.plannedRMultiple === '--' ? 'text-gray-400' : parseFloat(tradingMetrics.plannedRMultiple) >= 0 ? 'text-green-600' : 'text-red-600'} dark:text-gray-300`}>
              {tradingMetrics.plannedRMultiple}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold" style={{color: '#7F85AF'}}>Realized R-Multiple</span>
            <span className={`font-bold ${tradingMetrics.realizedRMultiple === '--' ? 'text-gray-400' : parseFloat(tradingMetrics.realizedRMultiple) >= 0 ? 'text-green-600' : 'text-red-600'} dark:text-gray-300`}>
              {tradingMetrics.realizedRMultiple}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold" style={{color: '#7F85AF'}}>Average Entry</span>
            <span className="font-bold text-gray-600 dark:text-gray-300">
              ${trade?.entryPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold" style={{color: '#7F85AF'}}>Average Exit</span>
            <span className="font-bold text-gray-600 dark:text-gray-300">
              ${trade?.exitPrice?.toFixed(2) || '0.00'}
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
                      if (newName) onUpdateCategory('mistakes', { name: newName })
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-500" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onShowColorPicker('mistakes')}
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
                    addMistakesTag(selectedMistakesTag)
                  }
                }}
                placeholder="Select tag"
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 focus:border-[#5B2CC9] focus:ring-1 focus:ring-[#5B2CC9] transition-all duration-200"
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
                          onClick={() => onRemoveTag('mistakes', tag)}
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
                          if (newName) onUpdateCategory(category.id, { name: newName })
                        }}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4 text-gray-500" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onShowColorPicker(category.id as 'mistakes' | 'custom')}
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
                          onAddTag(category.id, value.trim())
                          if (category.id === 'custom') setSelectedCustomTag('')
                        }
                      }
                    }}
                    placeholder="Select tag"
                    className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 focus:border-[#5B2CC9] focus:ring-1 focus:ring-[#5B2CC9] transition-all duration-200"
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
                              onClick={() => onRemoveTag(category.id, tag)}
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
    </>
  )
}
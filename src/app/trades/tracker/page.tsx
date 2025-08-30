'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, useId } from 'react'
import { 
  ArrowLeftIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import { RichTextEditor } from '@/components/trade/rich-text-editor'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { PencilIcon, SwatchIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { TradeDataService, Trade, RunningPnlPoint } from '@/services/trade-data.service'
import { DataStore } from '@/services/data-store.service'
import { chartColorPalette } from '@/config/theme'
import { useTagData } from '@/hooks/use-tag-data'
import { useTradeMetadata } from '@/hooks/use-trade-metadata'
import { StatsWidget } from '@/components/ui/stats-widget'

// Old hardcoded data removed - now using TradeDataService

// Process data like dashboard - add zero crossing points

// Running P&L data now loaded dynamically from service

// Execution data will be generated dynamically from trade data

export default function TrackerPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { categories, tags, addTag, removeTag, updateCategory } = useTagData()
  const { getTradeMetadata, setTradeMetadata, setTradeRating, setTradeLevels, addTradeTag, removeTradeTag, setTradeNotes } = useTradeMetadata()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [runningPnlData, setRunningPnlData] = useState<RunningPnlPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMainTab, setActiveMainTab] = useState('stats')
  const [activeContentTab, setActiveContentTab] = useState('notes')
  const [activeNotesTab, setActiveNotesTab] = useState('trade-note')
  const [rating, setRating] = useState(5)
  const [profitTarget, setProfitTarget] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  
  // Function to clean trade object from review properties
  const cleanTradeObject = (tradeObj: Trade) => {
    const cleanTrade = { ...tradeObj }
    
    // Remove all properties that contain "review" in the name (case insensitive)
    Object.keys(cleanTrade).forEach(key => {
      if (key.toLowerCase().includes('review')) {
        delete (cleanTrade as any)[key]
      }
    })
    
    return cleanTrade
  }

  // Generate mock running P&L data based on actual trade data
  const generateMockRunningPnl = (trade: Trade): RunningPnlPoint[] => {
    if (!trade || !trade.entryTime || !trade.exitTime) {
      return []
    }

    const entryPrice = trade.entryPrice || 0
    const exitPrice = trade.exitPrice || 0
    const netPnl = trade.netPnl || 0
    const contractsTraded = trade.contractsTraded || 1

    // Create time points between entry and exit
    const data: RunningPnlPoint[] = []
    const totalPoints = 20 // Number of data points

    for (let i = 0; i <= totalPoints; i++) {
      const progress = i / totalPoints
      
      // Create realistic price movement
      const priceRange = Math.abs(exitPrice - entryPrice)
      const volatility = priceRange * 0.3 // Add some volatility
      const randomMovement = (Math.random() - 0.5) * volatility
      
      // Progressive movement towards exit price with some noise
      const currentPrice = entryPrice + (progress * (exitPrice - entryPrice)) + randomMovement
      
      // Calculate P&L at this point
      const currentPnl = (currentPrice - entryPrice) * contractsTraded * (trade.side === 'SHORT' ? -1 : 1)
      
      // Create time string (simplified)
      const timeLabel = `${9 + Math.floor(progress * 7)}:${Math.floor((progress * 60) % 60).toString().padStart(2, '0')}`
      
      data.push({
        time: timeLabel,
        value: Math.round(currentPnl * 100) / 100,
        price: Math.round(currentPrice * 100) / 100
      })
    }

    // Ensure the last point matches the actual final P&L
    if (data.length > 0) {
      data[data.length - 1].value = netPnl
    }

    return data
  }

  // Generate execution data based on the trade
  const generateExecutionData = (trade: Trade | null) => {
    if (!trade) return []

    const executions = []
    const entryDate = trade.openDate
    const exitDate = trade.closeDate || trade.openDate
    
    // Entry execution
    executions.push({
      dateTime: `${entryDate} ${trade.entryTime || '09:30:00'}`,
      price: `$${trade.entryPrice?.toFixed(2) || '0.00'}`,
      quantity: trade.contractsTraded || 1,
      grossPnl: '$0'
    })

    // Exit execution
    executions.push({
      dateTime: `${exitDate} ${trade.exitTime || '10:30:00'}`,
      price: `$${trade.exitPrice?.toFixed(2) || '0.00'}`,
      quantity: -(trade.contractsTraded || 1),
      grossPnl: trade.netPnl >= 0 ? `+$${Math.abs(trade.netPnl).toFixed(2)}` : `-$${Math.abs(trade.netPnl).toFixed(2)}`
    })

    return executions
  }

  // Load trade data on mount and when metadata changes
  useEffect(() => {
    const loadTrade = async () => {
      try {
        // Get trades from DataStore (real CSV data)
        const trades = DataStore.getAllTrades()
        console.log('🔍 Tracker - Available trades:', trades.length)
        
        // Get trade ID from URL params or search params
        const tradeId = params.id || params.tradeId || searchParams.get('trade')
        console.log('🔍 Tracker - Looking for trade ID:', tradeId)
        
        if (!trades.length) {
          console.warn('⚠️ Tracker - No trades available in DataStore')
          setIsLoading(false)
          return
        }
        
        // Find specific trade if ID provided, otherwise use first trade
        let selectedTrade = null
        if (tradeId) {
          selectedTrade = trades.find(t => t.id === tradeId)
          if (!selectedTrade) {
            console.warn(`⚠️ Tracker - Trade with ID ${tradeId} not found, using first trade`)
            selectedTrade = trades[0]
          } else {
            console.log('✅ Tracker - Found specific trade:', selectedTrade.id, selectedTrade.symbol)
          }
        } else {
          selectedTrade = trades[0]
          console.log('✅ Tracker - Using first trade:', selectedTrade.id, selectedTrade.symbol)
        }
        
        // Generate mock running P&L data based on the trade
        const mockRunningPnlData = generateMockRunningPnl(selectedTrade)
        
        // Clean the trade object of any review properties
        const cleanTrade = cleanTradeObject(selectedTrade)
        
        setTrade(cleanTrade)
        setRunningPnlData(mockRunningPnlData)
        console.log('✅ Tracker - Trade loaded successfully')
      } catch (error) {
        console.error('❌ Tracker - Error loading trade:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTrade()
  }, [params, searchParams])

  // Load metadata when trade changes or metadata updates
  useEffect(() => {
    if (!trade) return

    const metadata = getTradeMetadata(trade.id)
    console.log(`🔍 Tracker - Loading metadata for trade ${trade.id}:`, metadata)
    
    if (metadata) {
      setRating(metadata.rating || 5)
      setProfitTarget(metadata.profitTarget || '')
      setStopLoss(metadata.stopLoss || '')
      console.log(`✅ Tracker - Restored SL/TP for trade ${trade.id}: PT=${metadata.profitTarget}, SL=${metadata.stopLoss}`)
    } else {
      // Only reset to defaults if no metadata exists AND current values are empty
      // This prevents overwriting user input when switching between trades
      if (!profitTarget && !stopLoss && rating === 5) {
        setRating(5)
        setProfitTarget('')
        setStopLoss('')
        console.log(`🔧 Tracker - Set defaults for new trade ${trade.id}`)
      }
    }
  }, [trade, getTradeMetadata])

  // Create handlers that save to metadata service
  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    if (trade) {
      setTradeRating(trade.id, newRating)
      console.log(`Saved rating ${newRating} for trade ${trade.id}`)
    }
  }

  const handleProfitTargetChange = (newTarget: string) => {
    setProfitTarget(newTarget)
    if (trade) {
      setTradeLevels(trade.id, newTarget, stopLoss)
      console.log(`Saved profit target ${newTarget} for trade ${trade.id}`)
    }
  }

  const handleStopLossChange = (newStopLoss: string) => {
    setStopLoss(newStopLoss)
    if (trade) {
      setTradeLevels(trade.id, profitTarget, newStopLoss)
      console.log(`Saved stop loss ${newStopLoss} for trade ${trade.id}`)
    }
  }

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

    console.log('Trade data:', {
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      netPnl: trade.netPnl,
      parsedEntry: avgEntry,
      parsedExit: avgExit,
      parsedPnl: netPnl
    })

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
  const [tradeNoteContent, setTradeNoteContent] = useState('')
  const [dailyJournalContent, setDailyJournalContent] = useState('')
  const [showColorPicker, setShowColorPicker] = useState<'mistakes' | 'custom' | null>(null)
  const [attachments, setAttachments] = useState<Array<{id: string, name: string, type: string, size: number, url: string}>>([])
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [draggedOver, setDraggedOver] = useState<string | null>(null)

  usePageTitle('Tracker')

  const mainTabs = [
    { id: 'stats', label: 'Stats' },
    { id: 'executions', label: 'Executions' },
    { id: 'attachments', label: 'Attachments' }
  ]

  const contentTabs = [
    { id: 'notes', label: 'Notes' },
    { id: 'running-pnl', label: 'Running P&L' }
  ]

  const templates = [
    'Intra-day Check-in',
    'Pre-Market Prep', 
    'Daily Game Plan',
    '+ Add template'
  ]

  const formatCurrency = (amount: number) => {
    if (amount === undefined || Number.isNaN(amount)) return '--'
    const sign = amount < 0 ? '-' : ''
    const absolute = Math.abs(amount)
    return `${sign}$${absolute.toLocaleString()}`
  }

  const formatPercent = (value: number) => {
    if (value === undefined || Number.isNaN(value)) return '--'
    return `${(value * 100).toFixed(2)}%`
  }

  const handleBack = () => {
    router.back()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newAttachment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type,
            size: file.size,
            url: e.target?.result as string
          }
          setAttachments(prev => [...prev, newAttachment])
        }
        reader.readAsDataURL(file)
      })
    }
    event.target.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, attachmentId: string) => {
    setDraggedItem(attachmentId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, attachmentId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOver(attachmentId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedOver(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null)
      setDraggedOver(null)
      return
    }

    const draggedIndex = attachments.findIndex(item => item.id === draggedItem)
    const targetIndex = attachments.findIndex(item => item.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null)
      setDraggedOver(null)
      return
    }

    const newAttachments = [...attachments]
    const [draggedAttachment] = newAttachments.splice(draggedIndex, 1)
    newAttachments.splice(targetIndex, 0, draggedAttachment)
    
    setAttachments(newAttachments)
    setDraggedItem(null)
    setDraggedOver(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDraggedOver(null)
  }

  const colorPalette = [
    '#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#6366f1', '#8b5cf6',
    '#14b8a6', '#f43f5e', '#a855f7', '#0ea5e9', '#22c55e', '#f97316'
  ]

  const ColorPicker = ({ type, currentColor, onColorSelect, onClose }: {
    type: 'mistakes' | 'custom'
    currentColor: string
    onColorSelect: (color: string) => void
    onClose: () => void
  }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-[#171717] rounded-lg p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose Color</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <span className="text-xl">×</span>
          </button>
        </div>
        <div className="grid grid-cols-6 gap-3 mb-4">
          {colorPalette.map((color) => (
            <button
              key={color}
              onClick={() => {
                onColorSelect(color)
                onClose()
              }}
              className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                currentColor === color ? 'border-gray-800 dark:border-white scale-110' : 'border-gray-200 dark:border-[#2a2a2a]'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Custom:</span>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorSelect(e.target.value)}
            className="w-10 h-8 border border-gray-300 dark:border-[#2a2a2a] rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  )

  // Build chart-ready data for Running P&L with numeric X-axis, zero-crossings and split pos/neg
  const runningChartData = useMemo(() => {
    if (!runningPnlData || runningPnlData.length === 0) return [] as Array<{ idx: number; label: string; value: number; pos: number | null; neg: number | null }>
    const base = runningPnlData.map((d, i) => {
      let v = Number((d as any).value || 0)
      if (Object.is(v, -0)) v = 0
      return { idx: i, label: (d as any).time ?? String(i), value: v }
    })
    const expanded: Array<{ idx: number; label: string; value: number }> = []
    for (let i = 0; i < base.length; i++) {
      const cur = base[i]
      const prev = i > 0 ? base[i - 1] : undefined
      if (prev) {
        const s1 = Math.sign(prev.value)
        const s2 = Math.sign(cur.value)
        if (s1 !== 0 && s2 !== 0 && s1 !== s2) {
          const dv = cur.value - prev.value
          const di = cur.idx - prev.idx || 1
          const t = Math.abs(prev.value) / Math.abs(dv)
          const xi = prev.idx + t * di
          expanded.push({ idx: xi, label: cur.label, value: 0 })
        }
      }
      expanded.push(cur)
    }
    return expanded
      .sort((a, b) => a.idx - b.idx)
      .map(p => {
        if (p.value === 0) return { ...p, pos: 0 as number, neg: 0 as number }
        return { ...p, pos: p.value > 0 ? p.value : (null as unknown as number), neg: p.value < 0 ? p.value : (null as unknown as number) }
      })
  }, [runningPnlData])

  // Unique gradient IDs per chart instance to avoid collisions
  const chartUid = useId()
  const posGradId = `tracker-pos-${chartUid}`
  const negGradId = `tracker-neg-${chartUid}`

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 bg-gray-50 dark:bg-[#1C1C1C] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ☰
              </button>
              
              <div className="flex items-center space-x-2">
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {trade?.symbol || 'NQ'}
                </h1>
                <span className="text-gray-500 dark:text-gray-400">{trade ? new Date(trade.openDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Tue, Aug 12, 2025'}</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <Button size="sm" className="bg-[#6366f1] hover:bg-[#5856eb] text-white">
                Replay
              </Button>

              <Button variant="outline" size="sm">
                <ShareIcon className="w-4 h-4 mr-1" />
                Share
              </Button>

              <Button variant="ghost" size="sm">
                <EllipsisVerticalIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="px-6">
          <div className="flex space-x-8">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeMainTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 p-6 gap-6 bg-gray-50 dark:bg-[#1C1C1C]">
        {/* Left Sidebar - Dynamic Content */}
        <div className="bg-white dark:bg-[#171717] rounded-lg flex-shrink-0 h-fit" style={{width: '376px'}}>
          <div className="p-4">
            {activeMainTab === 'stats' && (
              <StatsWidget
                trade={trade}
                runningPnlData={runningPnlData}
                categories={categories}
                tags={tags}
                profitTarget={profitTarget}
                stopLoss={stopLoss}
                rating={rating}
                onProfitTargetChange={handleProfitTargetChange}
                onStopLossChange={handleStopLossChange}
                onRatingChange={handleRatingChange}
                onAddTag={addTag}
                onRemoveTag={removeTag}
                onUpdateCategory={updateCategory}
                onShowColorPicker={setShowColorPicker}
              />
            )}

            {activeMainTab === 'attachments' && (
              <div className="space-y-6">
                {/* Attachments Header */}
                <div className="border-b border-gray-200 dark:border-[#2a2a2a] pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Attachments</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add files, images, and documents to this trade</p>
                </div>

                {/* Attachments List - Show first if any exist */}
                {attachments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Uploaded Files ({attachments.length})</h4>
                    <div className="space-y-3">
                      {attachments.map((attachment) => {
                        const isDragging = draggedItem === attachment.id
                        const isDraggedOver = draggedOver === attachment.id
                        
                        return (
                          <div 
                            key={attachment.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, attachment.id)}
                            onDragOver={(e) => handleDragOver(e, attachment.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, attachment.id)}
                            onDragEnd={handleDragEnd}
                            className={`transition-all duration-200 ${
                              isDragging ? 'opacity-50 scale-95' : ''
                            } ${
                              isDraggedOver ? 'transform scale-105' : ''
                            }`}
                          >
                            {/* Image Preview */}
                            {attachment.type.startsWith('image/') ? (
                              <div className={`relative group bg-white dark:bg-[#171717] rounded-lg border p-3 transition-all duration-200 ${
                                isDraggedOver 
                                  ? 'border-blue-400 dark:border-blue-500 shadow-lg' 
                                  : 'border-gray-200 dark:border-[#2a2a2a]'
                              } ${
                                isDragging ? 'cursor-grabbing' : 'cursor-grab'
                              }`}>
                                {/* Drag handle indicator */}
                                <div className="absolute top-2 left-2 opacity-60 hover:opacity-100 transition-opacity">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                </div>
                                
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  onClick={() => setViewingImage(attachment.url)}
                                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                />
                                
                                {/* Action buttons overlay */}
                                <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button className="w-8 h-8 bg-white dark:bg-[#171717] rounded-full shadow-sm border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeAttachment(attachment.id)
                                    }}
                                    className="w-8 h-8 bg-white dark:bg-[#171717] rounded-full shadow-sm border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Non-image files */
                              <div className={`flex items-center gap-3 p-3 bg-white dark:bg-[#171717] rounded-lg border transition-all duration-200 ${
                                isDraggedOver 
                                  ? 'border-blue-400 dark:border-blue-500 shadow-lg' 
                                  : 'border-gray-200 dark:border-[#2a2a2a]'
                              } ${
                                isDragging ? 'cursor-grabbing' : 'cursor-grab'
                              }`}>
                                {/* Drag handle */}
                                <div className="opacity-60 hover:opacity-100 transition-opacity">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                </div>
                                
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{attachment.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(attachment.size)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => removeAttachment(attachment.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                  </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* File Upload Area - Separate section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add New Files</h4>
                  <div className="border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="*/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center text-center"
                    >
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Drop files here</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">or click to browse</p>
                      <p className="text-xs text-gray-400">PNG, JPG, PDF, DOC up to 10MB</p>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white dark:bg-[#171717] rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
            {/* Content Tabs */}
            <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-6">
              <div className="flex space-x-8">
                {contentTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveContentTab(tab.id)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeContentTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="flex-1"></div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
            {activeContentTab === 'notes' && (
              <div className="h-full flex flex-col">
                {/* Notes Header */}
                <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <button
                      onClick={() => setActiveNotesTab('trade-note')}
                      className={`px-3 py-1 text-sm font-medium rounded-lg ${
                        activeNotesTab === 'trade-note'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Trade note
                    </button>
                    <button
                      onClick={() => setActiveNotesTab('daily-journal')}
                      className={`px-3 py-1 text-sm font-medium rounded-lg ${
                        activeNotesTab === 'daily-journal'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Daily Journal
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recently used templates</div>
                    <div className="flex flex-wrap gap-2">
                      {templates.map((template) => (
                        <button
                          key={template}
                          className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className="flex-1">
                  <RichTextEditor 
                    placeholder="Write something or press '?' for commands" 
                    value={activeNotesTab === 'trade-note' ? tradeNoteContent : dailyJournalContent}
                    onChange={(content) => {
                      if (activeNotesTab === 'trade-note') {
                        setTradeNoteContent(content)
                      } else {
                        setDailyJournalContent(content)
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {activeContentTab === 'running-pnl' && (
              <div className="p-6 h-full">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Running P&L
                  </h3>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={runningChartData} margin={{ top: 5, right: 15, left: 0, bottom: 25 }}>
                      <defs>
                        {/* Green gradient for positive areas */}
                        <linearGradient id={posGradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                        </linearGradient>
                        {/* Red gradient for negative areas */}
                        <linearGradient id={negGradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      
                      <XAxis 
                        type="number"
                        dataKey="idx" 
                        domain={["dataMin", "dataMax"]}
                        allowDecimals={false}
                        scale="linear"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                        className="dark:fill-gray-400"
                        padding={{ left: 0, right: 0 }}
                        height={25}
                        tickMargin={5}
                        tickFormatter={(value) => {
                          const v = typeof value === 'number' ? value : Number(value)
                          const d = runningChartData.find(pt => pt.idx === v)
                          const label = d?.label || ''
                          return label
                        }}
                        interval="preserveStartEnd"
                        tickCount={6}
                        minTickGap={20}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        className="dark:fill-gray-400"
                        tickFormatter={(value) => {
                          if (value === 0) return '$0';
                          return `$${(Number(value)/1000).toFixed(1)}k`;
                        }}
                        width={60}
                        tickMargin={8}
                        padding={{ top: 0, bottom: 0 }}
                        domain={([dataMin, dataMax]: [number, number]) => [
                          Math.min(0, dataMin),
                          Math.max(0, dataMax)
                        ]}
                      />
                      
                      <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} />
                      
                      <Tooltip
                        cursor={false}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const p = payload.find((pp: any) => pp.dataKey === 'value') || payload[0]
                            const value = p?.value ?? p?.payload?.value
                            if (value === undefined || value === null) {
                              return (
                                <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                                  <div className="font-semibold text-gray-500">No data</div>
                                </div>
                              )
                            }
                            const vNum = Number(value)
                            const formatted = vNum >= 0 ? `$${vNum.toLocaleString()}` : `-$${Math.abs(vNum).toLocaleString()}`
                            return (
                              <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                                <div className={`font-semibold ${vNum >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatted}</div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      
                      {/* Stroke line */}
                      <Area type="linear" dataKey="value" stroke="#5B2CC9" strokeWidth={2.5} fill="none" connectNulls isAnimationActive animationDuration={1200} animationEasing="ease-in-out" dot={false} activeDot={{ r: 4, fill: '#5B2CC9', stroke: '#fff', strokeWidth: 2 }} />
                      {/* Positive fill */}
                      <Area type="linear" dataKey="pos" strokeOpacity={0} fill={`url(#${posGradId})`} baseValue={0 as any} activeDot={false} dot={false} />
                      {/* Negative fill */}
                      <Area type="linear" dataKey="neg" strokeOpacity={0} fill={`url(#${negGradId})`} baseValue={0 as any} activeDot={false} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}



            {/* Executions Content */}
            {activeMainTab === 'executions' && (
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {generateExecutionData(trade).length} executions
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center">
                    👁 View all
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                        <th className="text-left py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date/Time (US/Eastern)
                        </th>
                        <th className="text-right py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="text-right py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="text-right py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Gross P&L
                        </th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {generateExecutionData(trade).map((execution, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 text-sm text-gray-900 dark:text-white">
                            {execution.dateTime}
                          </td>
                          <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                            {execution.price}
                          </td>
                          <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                            {execution.quantity > 0 ? `+${execution.quantity}` : execution.quantity}
                          </td>
                          <td className="py-3 text-sm font-medium text-right">
                            <span className={
                              execution.grossPnl === '$0' 
                                ? 'text-gray-500' 
                                : execution.grossPnl.startsWith('+') 
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                            }>
                              {execution.grossPnl}
                            </span>
                          </td>
                          <td className="py-3">
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              ⚡
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attachments Content */}
            {activeMainTab === 'attachments' && (
              <div className="p-6 h-full flex items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📁</span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Drag and drop here
                  </h3>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Or
                  </p>
                  
                  <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                    <span className="mr-2">⬆</span>
                    Browse Files
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Color Picker Modals */}
      {showColorPicker === 'mistakes' && (
        <ColorPicker
          type="mistakes"
          currentColor={categories.find(c => c.id === 'mistakes')?.color || '#ef4444'}
          onColorSelect={(color) => updateCategory('mistakes', { color })}
          onClose={() => setShowColorPicker(null)}
        />
      )}

      {showColorPicker === 'custom' && (
        <ColorPicker
          type="custom"
          currentColor={categories.find(c => c.id === 'custom')?.color || '#10b981'}
          onColorSelect={(color) => updateCategory('custom', { color })}
          onClose={() => setShowColorPicker(null)}
        />
      )}

      {/* Full-screen Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img 
              src={viewingImage} 
              alt="Full view"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
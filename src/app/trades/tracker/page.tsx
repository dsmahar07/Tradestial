'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
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
import { chartColorPalette } from '@/config/theme'

// Old hardcoded data removed - now using TradeDataService

// Process data like dashboard - add zero crossing points

// Running P&L data now loaded dynamically from service

const executionData = [
  {
    dateTime: '08-12-2025 19:48:37',
    price: '$23,722',
    quantity: 1,
    grossPnl: '$0'
  },
  {
    dateTime: '08-12-2025 20:40:37',
    price: '$23,823.25',
    quantity: -1,
    grossPnl: '$2,025'
  }
]

export default function TrackerPage() {
  const router = useRouter()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [runningPnlData, setRunningPnlData] = useState<RunningPnlPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Load trade data on mount
  useEffect(() => {
    const loadTrade = async () => {
    try {
      const trades = await TradeDataService.getAllTrades()
      const firstTrade = trades[0] // Use first trade as default
      const pnlData = await TradeDataService.getRunningPnlData(firstTrade.id)
      const processedData = TradeDataService.processRunningPnlData(pnlData)
      
      setTrade(firstTrade)
      setRunningPnlData(processedData)
    } catch (error) {
      console.error('Error loading trade:', error)
    } finally {
      setIsLoading(false)
    }
    }
    
    loadTrade()
  }, [])
  const [activeMainTab, setActiveMainTab] = useState('stats')
  const [activeContentTab, setActiveContentTab] = useState('notes')
  const [activeNotesTab, setActiveNotesTab] = useState('trade-note')
  const [isReviewed, setIsReviewed] = useState(false)
  const [rating, setRating] = useState(5)
  const [profitTarget, setProfitTarget] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [tradeNoteContent, setTradeNoteContent] = useState('')
  const [dailyJournalContent, setDailyJournalContent] = useState('')
  const [mistakesCategory, setMistakesCategory] = useState({ name: 'Mistakes', color: '#ef4444' })
  const [customTagsCategory, setCustomTagsCategory] = useState({ name: 'Custom Tags', color: '#10b981' })
  const [showColorPicker, setShowColorPicker] = useState<'mistakes' | 'custom' | null>(null)
  const [mistakesTags, setMistakesTags] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [selectedMistakesTag, setSelectedMistakesTag] = useState('')
  const [selectedCustomTag, setSelectedCustomTag] = useState('')
  const [appliedMistakesTags, setAppliedMistakesTags] = useState<string[]>([])
  const [appliedCustomTags, setAppliedCustomTags] = useState<string[]>([])
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

  const addMistakesTag = (tag: string) => {
    if (tag.trim()) {
      // Add to available tags if not already there
      if (!mistakesTags.includes(tag.trim())) {
        setMistakesTags([...mistakesTags, tag.trim()])
      }
      // Add to applied tags if not already applied
      if (!appliedMistakesTags.includes(tag.trim())) {
        setAppliedMistakesTags([...appliedMistakesTags, tag.trim()])
      }
      setSelectedMistakesTag('')
    }
  }

  const addCustomTag = (tag: string) => {
    if (tag.trim()) {
      // Add to available tags if not already there
      if (!customTags.includes(tag.trim())) {
        setCustomTags([...customTags, tag.trim()])
      }
      // Add to applied tags if not already applied
      if (!appliedCustomTags.includes(tag.trim())) {
        setAppliedCustomTags([...appliedCustomTags, tag.trim()])
      }
      setSelectedCustomTag('')
    }
  }

  const removeMistakesTag = (tag: string) => {
    setAppliedMistakesTags(appliedMistakesTags.filter(t => t !== tag))
  }

  const removeCustomTag = (tag: string) => {
    setAppliedCustomTags(appliedCustomTags.filter(t => t !== tag))
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
                currentColor === color ? 'border-gray-800 dark:border-white scale-110' : 'border-gray-200 dark:border-gray-600'
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
            className="w-10 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 bg-gray-50 dark:bg-[#1C1C1C] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {trade?.symbol || 'NQ'}
                </h1>
                <span className="text-gray-500 dark:text-gray-400">({trade?.id || '09-01-2025'})</span>
                <span className="text-gray-500 dark:text-gray-400">{trade?.openDate || 'Tue, Aug 12, 2025'}</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <Button
                variant={isReviewed ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setIsReviewed(!isReviewed)}
              >
                Mark as reviewed
              </Button>

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
              <>
                {/* Stats Content */}
            {/* Net P&L with teal left border */}
            <div className="mb-6 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r"></div>
              <div className="pl-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net P&L</div>
                <div className="text-2xl font-bold" style={{color: '#14b8a6'}}>
                  $2,025
                </div>
              </div>
            </div>

            {/* Trade Metrics */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 dark:text-gray-400">Side</span>
                <span className="font-bold" style={{color: '#14b8a6'}}>LONG</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Contracts traded</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">1</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Points</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">101.25</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Ticks</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">405.0</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Ticks Per Contract</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">405.0</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Commissions & Fees</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">$0</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Net ROI</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">0.43%</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Gross P&L</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">$2,025</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Adjusted Cost</span>
                <span className="font-bold text-gray-600 dark:text-gray-300">$474,440</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Model</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 focus:border-[#5B2CC9] focus:ring-1 focus:ring-[#5B2CC9] transition-all duration-200 bg-white dark:bg-gray-800">
                      <span className="font-bold text-gray-600 dark:text-gray-300">ICT 2022 Model</span>
                      <span className="ml-1 text-blue-500">🔗</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 p-1">
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer">
                      <span className="text-blue-500">🔗</span>
                      View Model Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer">
                      <span className="text-gray-500">📊</span>
                      Change Model
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer">
                      <span className="text-gray-500">➕</span>
                      Create New Model
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Zella Scale */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Score</span>
                <div className="relative h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div className="absolute left-0 top-0 h-full w-3/4 bg-teal-500 rounded-full"></div>
                </div>
              </div>

              {/* Price MAE / MFE */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Price MAE / MFE</span>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span className="text-red-600 dark:text-red-400">$23,937</span>
                  <span className="text-gray-400">/</span>
                  <span style={{color: '#14b8a6'}}>$23,967.25</span>
                </div>
              </div>

              {/* Running P&L */}
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold" style={{color: '#7F85AF'}}>Running P&L</span>
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={runningPnlData.slice(-8)}>
                      <defs>
                        <linearGradient id="miniPnlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.6}/>
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4C25A7"
                        strokeWidth={1.5}
                        fill="url(#miniPnlGradient)"
                      />
                    </AreaChart>
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
                            setRating(isLeftHalf ? starNumber - 0.5 : starNumber)
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
                    onChange={(e) => setProfitTarget(e.target.value)}
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
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent outline-none font-bold text-gray-600 dark:text-gray-300 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Additional metrics */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Initial Target</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">--</span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Trade Risk</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">--</span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Planned R-Multiple</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">--</span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Realized R-Multiple</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">--</span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Average Entry</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">$23,722</span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Average Exit</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">$23,823.25</span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Entry Time</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">19:48:37</span>
                </div>
                
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold" style={{color: '#7F85AF'}}>Exit Time</span>
                  <span className="font-bold text-gray-600 dark:text-gray-300">20:40:37</span>
                </div>
              </div>

              {/* Tags Section */}
              <div className="pt-3 space-y-2">
                {/* Mistakes Section */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4" style={{color: mistakesCategory.color}} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 11.5L12 15l7.5-7.5L18 6l-6 6-2.5-2.5L8.5 11.5z" opacity="0.3"/>
                    </svg>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{mistakesCategory.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ml-auto transition-colors">
                          <span className="text-base font-bold">⋯</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1">
                        <DropdownMenuItem 
                          onClick={() => {
                            const newName = prompt('Enter new name:', mistakesCategory.name)
                            if (newName) setMistakesCategory({...mistakesCategory, name: newName})
                          }}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-500" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowColorPicker('mistakes')}
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
                      {mistakesTags.map((tag) => (
                        <option key={tag} value={tag} />
                      ))}
                    </datalist>
                    {appliedMistakesTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {appliedMistakesTags.map((tag, index) => {
                          const tagColor = chartColorPalette[index % chartColorPalette.length]
                          
                          return (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md text-white font-medium shadow-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                              style={{ backgroundColor: tagColor }}
                            >
                              <span className="relative z-10">{tag}</span>
                              <button
                                onClick={() => removeMistakesTag(tag)}
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

                {/* Custom Tags Section */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4" style={{color: customTagsCategory.color}} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2l-4.37.84zM12 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM6 15.5v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1H6z"/>
                    </svg>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{customTagsCategory.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ml-auto transition-colors">
                          <span className="text-base font-bold">⋯</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1">
                        <DropdownMenuItem 
                          onClick={() => {
                            const newName = prompt('Enter new name:', customTagsCategory.name)
                            if (newName) setCustomTagsCategory({...customTagsCategory, name: newName})
                          }}
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-500" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowColorPicker('custom')}
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
                      list="custom-tags"
                      type="text"
                      value={selectedCustomTag}
                      onChange={(e) => setSelectedCustomTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCustomTag(selectedCustomTag)
                        }
                      }}
                      placeholder="Select tag"
                      className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 focus:border-[#5B2CC9] focus:ring-1 focus:ring-[#5B2CC9] transition-all duration-200"
                    />
                    <datalist id="custom-tags">
                      {customTags.map((tag) => (
                        <option key={tag} value={tag} />
                      ))}
                    </datalist>
                    {appliedCustomTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {appliedCustomTags.map((tag, index) => {
                          const tagColor = chartColorPalette[index % chartColorPalette.length]
                          
                          return (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md text-white font-medium shadow-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                              style={{ backgroundColor: tagColor }}
                            >
                              <span className="relative z-10">{tag}</span>
                              <button
                                onClick={() => removeCustomTag(tag)}
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

                {/* Footer Links */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <button className="text-blue-600 dark:text-blue-400 hover:underline">Add new category</button>
                  <button className="text-gray-500 dark:text-gray-400 hover:underline">Manage tags</button>
                </div>
              </div>
            </div>
            </>
            )}

            {activeMainTab === 'attachments' && (
              <div className="space-y-6">
                {/* Attachments Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
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
                              <div className={`relative group bg-white dark:bg-gray-800 rounded-lg border p-3 transition-all duration-200 ${
                                isDraggedOver 
                                  ? 'border-blue-400 dark:border-blue-500 shadow-lg' 
                                  : 'border-gray-200 dark:border-gray-700'
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
                                  <button className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeAttachment(attachment.id)
                                    }}
                                    className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Non-image files */
                              <div className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 ${
                                isDraggedOver 
                                  ? 'border-blue-400 dark:border-blue-500 shadow-lg' 
                                  : 'border-gray-200 dark:border-gray-700'
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
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
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
            <div className="border-b border-gray-200 dark:border-gray-700 px-6">
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
                <div className="border-b border-gray-200 dark:border-gray-700 p-4">
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
                    <AreaChart
                      data={runningPnlData}
                      margin={{ top: 5, right: 15, left: 0, bottom: 25 }}
                    >
                      <defs>
                        {/* Green gradient for positive areas */}
                        <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                        </linearGradient>
                        {/* Red gradient for negative areas */}
                        <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      
                      <XAxis 
                        dataKey="time" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        height={25}
                        tickMargin={5}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => {
                          if (value === 0) return '$0';
                          return `$${(value/1000).toFixed(1)}k`;
                        }}
                        width={55}
                      />
                      
                      <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} />
                      
                      {/* Positive area - only fills between line and zero when line is above zero */}
                      <Area
                        type="monotone"
                        dataKey={(data) => data.value > 0 ? data.value : 0}
                        stroke="none"
                        fill="url(#positiveGradient)"
                        fillOpacity={1}
                        connectNulls={true}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                        baseValue={0}
                      />
                      
                      {/* Negative area - only fills between line and zero when line is below zero */}
                      <Area
                        type="monotone"
                        dataKey={(data) => data.value < 0 ? data.value : 0}
                        stroke="none"
                        fill="url(#negativeGradient)"
                        fillOpacity={1}
                        connectNulls={true}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                        baseValue={0}
                      />
                      
                      {/* Main line stroke */}
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4C25A7"
                        strokeWidth={2.5}
                        fill="none"
                        connectNulls={true}
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-in-out"
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#4C25A7",
                          stroke: "#fff",
                          strokeWidth: 2
                        }}
                      />
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
                    2 executions
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center">
                    👁 View all
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
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
                      {executionData.map((execution, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 text-sm text-gray-900 dark:text-white">
                            {execution.dateTime}
                          </td>
                          <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                            {execution.price}
                          </td>
                          <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                            {execution.quantity}
                          </td>
                          <td className="py-3 text-sm font-medium text-right">
                            <span className={execution.grossPnl === '$0' ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}>
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
          currentColor={mistakesCategory.color}
          onColorSelect={(color) => setMistakesCategory({...mistakesCategory, color})}
          onClose={() => setShowColorPicker(null)}
        />
      )}

      {showColorPicker === 'custom' && (
        <ColorPicker
          type="custom"
          currentColor={customTagsCategory.color}
          onColorSelect={(color) => setCustomTagsCategory({...customTagsCategory, color})}
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
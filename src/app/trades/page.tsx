'use client'

import '@/styles/scrollbar.css'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, MagnifyingGlassIcon, FunnelIcon, EllipsisHorizontalIcon, ArrowPathIcon, Cog6ToothIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon, TagIcon, TrashIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { usePageTitle } from '@/hooks/use-page-title'
import { TradeDataService, Trade, TradeMetrics } from '@/services/trade-data.service'
import { useTagData } from '@/hooks/use-tag-data'
import { useReviewStatus } from '@/hooks/use-review-status'
import { useTradeMetadata } from '@/hooks/use-trade-metadata'
import { PageLoading } from '@/components/ui/loading-spinner'
import { chartColorPalette } from '@/config/theme'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Dialog from '@radix-ui/react-dialog'

export default function TradesPage() {
  usePageTitle('Trades')
  const router = useRouter()
  const { categories, tags, addCategory, addTag, removeTag, getCategory, updateCategory } = useTagData()
  const [selectedTrades, setSelectedTrades] = useState<string[]>([])
  const [tradesPerPage, setTradesPerPage] = useState(100)
  const [trades, setTrades] = useState<Trade[]>([])
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { reviewStatuses, getReviewStatus, setReviewStatus, setBulkReviewStatus } = useReviewStatus()
  const { metadata, getTradeMetadata, setTradeMetadata, addTradeTag } = useTradeMetadata()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [dateRange, setDateRange] = useState('Last 7 days')
  const [showBulkDropdown, setShowBulkDropdown] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    'symbol': true,
    'open-date': true,
    'status': true,
    'close-date': true,
    'entry-price': true,
    'exit-price': true,
    'net-pnl': true,
    'net-roi': true,
    'scale': true,
    'reviewed': true
  })

  const [tagForm, setTagForm] = useState({
    name: '',
    selectedCategory: 'mistakes',
    description: '',
    showTypeDropdown: false
  })

  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    color: '#3559E9'
  })

  const [modelForm, setModelForm] = useState({
    selectedModel: 'ICT 2022 Model'
  })

  // Available models
  const models = [
    'ICT 2022 Model',
    'Smart Money Concepts',
    'Supply & Demand',
    'Fibonacci Retracements', 
    'Break & Retest',
    'Liquidity Sweep',
    'Order Block Trading',
    'Fair Value Gap'
  ]

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load trades and calculate metrics
  useEffect(() => {
    const loadData = async () => {
      try {
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
    loadData()
  }, [])

  // Filter trades based on search and filters
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = searchQuery === '' || 
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'All Status' ||
      trade.status === (statusFilter as 'WIN' | 'LOSS')
    
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalTrades = filteredTrades.length
  const totalPages = Math.ceil(totalTrades / tradesPerPage)
  const startIndex = (currentPage - 1) * tradesPerPage
  const endIndex = startIndex + tradesPerPage
  const currentTrades = filteredTrades.slice(startIndex, endIndex)

  const handleSelectTrade = (tradeId: string) => {
    setSelectedTrades(prev =>
      prev.includes(tradeId)
        ? prev.filter(id => id !== tradeId)
        : [...prev, tradeId]
    )
  }

  const handleSelectAll = () => {
    setSelectedTrades(
      selectedTrades.length === currentTrades.length 
        ? [] 
        : currentTrades.map(trade => trade.id)
    )
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on trades:`, selectedTrades)
    setShowBulkDropdown(false)
    
    if (action === 'add-tags') {
      setShowTagModal(true)
    } else if (action === 'add-to-model') {
      setShowModelModal(true)
    } else if (action === 'mark-reviewed') {
      console.log('Marking as reviewed:', selectedTrades)
      setBulkReviewStatus(selectedTrades, 'reviewed')
      alert(`Marked ${selectedTrades.length} trades as reviewed`)
      setSelectedTrades([])
    } else if (action === 'mark-not-reviewed') {
      console.log('Marking as not reviewed:', selectedTrades)
      setBulkReviewStatus(selectedTrades, 'not-reviewed')
      alert(`Marked ${selectedTrades.length} trades as not reviewed`)
      setSelectedTrades([])
    } else if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedTrades.length} trades?`)) {
        // Handle delete
        setSelectedTrades([])
      }
    }
  }

  const handleTagFormSubmit = () => {
    const tagName = tagForm.name.trim()
    if (!tagName) return

    const selectedCategory = getCategory(tagForm.selectedCategory)
    
    // Add tag to the global tag categories
    addTag(tagForm.selectedCategory, tagName)
    
    // Add the tag to all selected trades in their metadata
    selectedTrades.forEach(tradeId => {
      const categoryMapping = {
        'mistakes': 'mistakes' as const,
        'custom': 'customTags' as const,
        'reviewed': 'tags' as const
      }
      
      const metadataCategory = categoryMapping[tagForm.selectedCategory as keyof typeof categoryMapping] || 'tags' as const
      addTradeTag(tradeId, tagName, metadataCategory)
    })
    
    alert(`Tag "${tagName}" added to ${selectedTrades.length} trades in category: ${selectedCategory?.name || 'Unknown'}`)
    
    setShowTagModal(false)
    setTagForm({ name: '', selectedCategory: 'mistakes', description: '', showTypeDropdown: false })
    setSelectedTrades([])
  }

  const handleNewCategorySubmit = () => {
    const categoryName = newCategoryForm.name.trim()
    if (!categoryName) return

    const newCategory = addCategory({
      name: categoryName,
      color: newCategoryForm.color
    })
    
    setShowNewCategoryModal(false)
    setNewCategoryForm({ name: '', color: '#3559E9' })
    
    // Auto-select the new category in the tag form
    setTagForm(prev => ({ ...prev, selectedCategory: newCategory.id }))
  }

  const handleModelFormSubmit = () => {
    const model = modelForm.selectedModel
    if (!model) return

    // Assign model to all selected trades using metadata service
    selectedTrades.forEach(tradeId => {
      setTradeMetadata(tradeId, { model })
    })
    
    alert(`Assigned "${model}" model to ${selectedTrades.length} trades`)
    
    setShowModelModal(false)
    setSelectedTrades([])
  }

  const formatCurrency = (amount: number) => {
    if (amount === undefined || Number.isNaN(amount)) return '--'
    const sign = amount < 0 ? '-' : ''
    const absolute = Math.abs(amount)
    return `${sign}$${absolute.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getInitials = (symbol: string) => {
    return symbol.slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (symbol: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ]
    const index = symbol.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (isLoading) {
    return <PageLoading />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#1C1C1C]">
          <div className="max-w-[1400px] mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ArrowPathIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <h1 className="text-lg font-medium text-gray-900 dark:text-white">Trades</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your trades</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowColumnSelector(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-[#1C1C1C] p-6 rounded-xl flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Trades</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {trades.length.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 mt-1">+{((trades.length / 100) * 5).toFixed(0)} vs this week</div>
              </div>
              
              <div className="w-px h-16 bg-gray-200 dark:bg-[#2a2a2a]"></div>
              
              <div className="bg-gray-50 dark:bg-[#1C1C1C] p-6 rounded-xl flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total P&L</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(metrics?.netCumulativePnl || 0)}
                </div>
                <div className="text-xs text-green-600 mt-1">+8% vs last week</div>
              </div>
              
              <div className="w-px h-16 bg-gray-200 dark:bg-[#2a2a2a]"></div>
              
              <div className="bg-gray-50 dark:bg-[#1C1C1C] p-6 rounded-xl flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Average Trade Value</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency((metrics?.netCumulativePnl || 0) / (metrics?.totalTrades || 1))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">-2% this week</div>
              </div>
              
              <div className="w-px h-16 bg-gray-200 dark:bg-[#2a2a2a]"></div>
              
              <div className="bg-gray-50 dark:bg-[#1C1C1C] p-6 rounded-xl flex-1">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Win Rate</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {metrics?.winRate.toFixed(1) || 0}%
                </div>
                <div className="text-xs text-orange-600 mt-1">Requires attention</div>
              </div>
            </div>


            {/* Search and Filters Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search trades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 w-64"
                  />
                </div>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                      {dateRange}
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-[140px] bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg z-50 p-1">
                      <DropdownMenu.Item 
                        className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                        onClick={() => setDateRange('Last 7 days')}
                      >
                        Last 7 days
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                        onClick={() => setDateRange('Last 30 days')}
                      >
                        Last 30 days
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                        onClick={() => setDateRange('Last 3 months')}
                      >
                        Last 3 months
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                      {statusFilter}
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-[120px] bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg z-50 p-1">
                      <DropdownMenu.Item 
                        className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                        onClick={() => setStatusFilter('All Status')}
                      >
                        All Status
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                        onClick={() => setStatusFilter('WIN')}
                      >
                        Wins
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                        onClick={() => setStatusFilter('LOSS')}
                      >
                        Losses
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              <div className="flex items-center gap-4">
                <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 transition-colors">
                  <FunnelIcon className="w-4 h-4 inline mr-1" />
                  Filter
                </button>
                <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 transition-colors">
                  Export
                </button>
                
                {selectedTrades.length > 0 && (
                  <DropdownMenu.Root open={showBulkDropdown} onOpenChange={setShowBulkDropdown}>
                    <DropdownMenu.Trigger asChild>
                      <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors">
                        Actions ({selectedTrades.length})
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="min-w-[160px] bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg z-50 p-1">
                        <DropdownMenu.Item 
                          className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                          onClick={() => handleBulkAction('mark-reviewed')}
                        >
                          Mark as Reviewed
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                          className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                          onClick={() => handleBulkAction('mark-not-reviewed')}
                        >
                          Mark as Not Reviewed
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                          className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                          onClick={() => handleBulkAction('add-tags')}
                        >
                          Add Tags
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                          className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                          onClick={() => handleBulkAction('add-to-model')}
                        >
                          Add To Model
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
                        <DropdownMenu.Item 
                          className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer text-red-600 dark:text-red-400 outline-none"
                          onClick={() => handleBulkAction('delete')}
                        >
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: '1200px' }}>
                <thead className="bg-white dark:bg-[#171717] border-b-2 border-gray-300 dark:border-[#2a2a2a]">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <Checkbox.Root
                        checked={selectedTrades.length === currentTrades.length && currentTrades.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="w-4 h-4 border border-gray-300 dark:border-[#2a2a2a] rounded flex items-center justify-center outline-none"
                        style={{
                          backgroundColor: selectedTrades.length === currentTrades.length && currentTrades.length > 0 ? '#3559E9' : 'white',
                          borderColor: selectedTrades.length === currentTrades.length && currentTrades.length > 0 ? '#3559E9' : '#d1d5db'
                        }}
                      >
                        <Checkbox.Indicator className="text-white">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12"></polyline>
                          </svg>
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                    </th>
                    {visibleColumns['symbol'] && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] whitespace-nowrap">
                        Symbol <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['open-date'] && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                        Open Date <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['status'] && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[90px] whitespace-nowrap">
                        Status <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['close-date'] && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                        Close Date <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['entry-price'] && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                        Entry Price <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['exit-price'] && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                        Exit Price <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['net-pnl'] && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] whitespace-nowrap">
                        Net P&L <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['net-roi'] && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] whitespace-nowrap">
                        Net ROI <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['scale'] && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                        Scale <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    {visibleColumns['reviewed'] && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                        Reviewed <ChevronDownIcon className="w-3 h-3 inline ml-1" />
                      </th>
                    )}
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#171717] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {currentTrades.map((trade) => (
                    <tr 
                      key={trade.id} 
                      className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                      onClick={() => router.push(`/trades/tracker?trade=${trade.id}`)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox.Root
                          checked={selectedTrades.includes(trade.id)}
                          onCheckedChange={() => handleSelectTrade(trade.id)}
                          className="w-4 h-4 border border-gray-300 dark:border-[#2a2a2a] rounded flex items-center justify-center outline-none"
                          style={{
                            backgroundColor: selectedTrades.includes(trade.id) ? '#3559E9' : 'white',
                            borderColor: selectedTrades.includes(trade.id) ? '#3559E9' : '#d1d5db'
                          }}
                        >
                          <Checkbox.Indicator className="text-white">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                      </td>
                      {visibleColumns['symbol'] && (
                        <td className="px-4 py-4 min-w-[120px]">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(trade.symbol)}`}>
                              {getInitials(trade.symbol)}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{trade.symbol}</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns['open-date'] && (
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                          {new Date(trade.openDate).toLocaleDateString('en-US', { 
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </td>
                      )}
                      {visibleColumns['status'] && (
                        <td className="px-4 py-4 min-w-[90px]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              trade.status === 'WIN' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {trade.status === 'WIN' ? 'Win' : trade.status === 'LOSS' ? 'Loss' : trade.status}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleColumns['close-date'] && (
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                          {new Date(trade.closeDate).toLocaleDateString('en-US', { 
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </td>
                      )}
                      {visibleColumns['entry-price'] && (
                        <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                          {formatCurrency(trade.entryPrice)}
                        </td>
                      )}
                      {visibleColumns['exit-price'] && (
                        <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                          {formatCurrency(trade.exitPrice)}
                        </td>
                      )}
                      {visibleColumns['net-pnl'] && (
                        <td className="px-4 py-4 text-right text-sm font-medium min-w-[120px] whitespace-nowrap">
                          <span className={`${trade.netPnl >= 0 ? 'text-[#3559E9]' : 'text-[#FB3748]'} font-semibold`}>
                            {formatCurrency(trade.netPnl)}
                          </span>
                        </td>
                      )}

                      {visibleColumns['net-roi'] && (
                        <td className="px-4 py-4 text-right text-sm min-w-[80px] whitespace-nowrap">
                          <span className={`${trade.netRoi >= 0 ? 'text-[#3559E9]' : 'text-[#FB3748]'} font-semibold`}>
                            {(trade.netRoi * 100).toFixed(2)}%
                          </span>
                        </td>
                      )}

                      {visibleColumns['scale'] && (
                        <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                          {trade.zellaScale !== undefined ? (
                            <div className="flex justify-center">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${i < (trade.zellaScale ?? 0) ? 'text-blue-400' : 'text-gray-300'}`}
                                >
                                  ●
                                </span>
                              ))}
                            </div>
                          ) : '--'}
                        </td>
                      )}
                      {visibleColumns['reviewed'] && (
                        <td className="px-4 py-4 text-center min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              const currentStatus = getReviewStatus(trade.id)
                              let newStatus: 'reviewed' | 'not-reviewed' | null
                              
                              if (currentStatus === null) {
                                newStatus = 'reviewed'
                              } else if (currentStatus === 'reviewed') {
                                newStatus = 'not-reviewed'
                              } else {
                                newStatus = null
                              }
                              
                              setReviewStatus(trade.id, newStatus)
                            }}
                            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 transition-colors"
                            title="Click to toggle review status"
                          >
                            {getReviewStatus(trade.id) === 'reviewed' ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : getReviewStatus(trade.id) === 'not-reviewed' ? (
                              <XCircleIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-gray-400"></div>
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none">
                              <EllipsisHorizontalIcon className="w-4 h-4" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content className="min-w-[140px] bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg z-50 p-1">
                              <DropdownMenu.Item 
                                className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100"
                                onClick={() => router.push(`/trades/tracker/${trade.id}`)}
                              >
                                View Details
                              </DropdownMenu.Item>
                              <DropdownMenu.Item className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100">
                                Edit Trade
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="my-1 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
                              <DropdownMenu.Item className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer text-red-600 outline-none">
                                Delete
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between py-6">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 7) {
                    pageNumber = i + 1
                  } else if (currentPage <= 4) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNumber = totalPages - 6 + i
                  } else {
                    pageNumber = currentPage - 3 + i
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        pageNumber === currentPage 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {tradesPerPage} / page
              </div>
            </div>
          </div>
        </main>

      {/* Tag Modal */}
      <Dialog.Root open={showTagModal} onOpenChange={setShowTagModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#171717] rounded-xl shadow-xl w-full max-w-md z-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">Add Tags</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tag Name</label>
                  <input
                    type="text"
                    value={tagForm.name}
                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                    placeholder="Enter tag name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="w-full inline-flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                        {getCategory(tagForm.selectedCategory)?.name || 'Select Category'}
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="min-w-[200px] bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg z-50 p-1">
                        {categories.map((category) => (
                          <DropdownMenu.Item 
                            key={category.id}
                            className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100 flex items-center gap-2"
                            onClick={() => setTagForm({ ...tagForm, selectedCategory: category.id })}
                          >
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                            {tagForm.selectedCategory === category.id && (
                              <CheckCircleIcon className="w-4 h-4 text-blue-500 ml-auto" />
                            )}
                          </DropdownMenu.Item>
                        ))}
                        <DropdownMenu.Separator className="my-1 h-px bg-gray-200 dark:bg-[#2a2a2a]" />
                        <DropdownMenu.Item 
                          className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100 text-blue-600"
                          onClick={() => setShowNewCategoryModal(true)}
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add New Category
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button 
                  onClick={handleTagFormSubmit}
                  disabled={!tagForm.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* New Category Modal */}
      <Dialog.Root open={showNewCategoryModal} onOpenChange={setShowNewCategoryModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#171717] rounded-xl shadow-xl w-full max-w-md z-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">Create New Category</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                    placeholder="Enter category name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                  <input
                    type="color"
                    value={newCategoryForm.color}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 dark:border-[#2a2a2a] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button 
                  onClick={handleNewCategorySubmit}
                  disabled={!newCategoryForm.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Create Category
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Model Modal */}
      <Dialog.Root open={showModelModal} onOpenChange={setShowModelModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#171717] rounded-xl shadow-xl w-full max-w-md z-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold text-gray-900">Assign Model</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Model for {selectedTrades.length} trades
                  </label>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="w-full inline-flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                        {modelForm.selectedModel}
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="min-w-[300px] bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg z-50 p-1">
                        {models.map((model) => (
                          <DropdownMenu.Item 
                            key={model}
                            className="text-sm px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer outline-none text-gray-900 dark:text-gray-100 flex items-center gap-2"
                            onClick={() => setModelForm({ selectedModel: model })}
                          >
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            {model}
                            {modelForm.selectedModel === model && (
                              <CheckCircleIcon className="w-4 h-4 text-blue-500 ml-auto" />
                            )}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button 
                  onClick={handleModelFormSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Assign Model
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Column Selector Modal */}
      <Dialog.Root open={showColumnSelector} onOpenChange={setShowColumnSelector}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#171717] rounded-xl shadow-xl w-full max-w-4xl z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Dialog.Title className="text-lg font-semibold text-gray-900">Select Columns</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {(() => {
                  const columnCategories = {
                    'Basic Trade Info': ['symbol', 'status', 'side', 'instrument', 'instrument-type', 'account-name'],
                    'Timing': ['open-date', 'open-time', 'close-date', 'close-time', 'duration'],
                    'Pricing': ['entry-price', 'exit-price', 'average-entry', 'average-exit', 'best-exit-price', 'best-exit-time'],
                    'P&L Performance': ['net-pnl', 'gross-pnl', 'net-roi', 'best-exit-pnl', 'best-exit-percentage'],
                    'Position Sizing': ['volume', 'executions', 'points', 'ticks', 'ticks-per-contract', 'pips'],
                    'Risk Metrics': ['position-mae', 'position-mfe', 'price-mae', 'price-mfe', 'initial-risk', 'initial-target', 'planned-r-multiple', 'realized-r-multiple', 'return-per-pip'],
                    'Costs & Fees': ['commissions', 'total-fees', 'total-swap', 'adjusted-cost', 'adjusted-proceeds'],
                    'Trading Strategy': ['playbook', 'trade-rating', 'scale'],
                    'Analysis & Notes': ['notes', 'mistakes', 'custom-tags', 'reviewed']
                  }

                  const categoryEntries = Object.entries(columnCategories)
                  const categoriesPerColumn = Math.ceil(categoryEntries.length / 5)
                  
                  return Array.from({ length: 5 }, (_, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {categoryEntries
                        .slice(columnIndex * categoriesPerColumn, (columnIndex + 1) * categoriesPerColumn)
                        .map(([categoryName, columns]) => (
                          <div key={categoryName} className="space-y-1">
                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#2a2a2a] pb-0.5">
                              {categoryName}
                            </h3>
                            <div className="space-y-0.5">
                              {columns.map(key => (
                                <label key={key} className="flex items-center space-x-1.5 cursor-pointer py-0.5 rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                                  <Checkbox.Root
                                    checked={visibleColumns[key as keyof typeof visibleColumns]}
                                    onCheckedChange={(checked) => {
                                      setVisibleColumns(prev => ({
                                        ...prev,
                                        [key]: !!checked
                                      }))
                                    }}
                                    className="w-3 h-3 border border-gray-300 dark:border-[#2a2a2a] rounded flex items-center justify-center outline-none"
                                    style={{
                                      backgroundColor: visibleColumns[key as keyof typeof visibleColumns] ? '#3559E9' : 'white',
                                      borderColor: visibleColumns[key as keyof typeof visibleColumns] ? '#3559E9' : '#d1d5db'
                                    }}
                                  >
                                    <Checkbox.Indicator className="text-white">
                                      <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                      </svg>
                                    </Checkbox.Indicator>
                                  </Checkbox.Root>
                                  <span className="text-xs text-gray-700 dark:text-gray-300 capitalize leading-none">
                                    {key.replace(/-/g, ' ')}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))
                })()}
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Apply all columns
                      setVisibleColumns({
                        // === BASIC TRADE INFO ===
                        'symbol': true,
                        'status': true,
                        'side': true,
                        'instrument': true,
                        'instrument-type': true,
                        'account-name': true,
                        
                        // === TIMING ===
                        'open-date': true,
                        'open-time': true,
                        'close-date': true,
                        'close-time': true,
                        'duration': true,
                        
                        // === PRICING ===
                        'entry-price': true,
                        'exit-price': true,
                        'average-entry': true,
                        'average-exit': true,
                        'best-exit-price': true,
                        'best-exit-time': true,
                        
                        // === P&L PERFORMANCE ===
                        'net-pnl': true,
                        'gross-pnl': true,
                        'net-roi': true,
                        'best-exit-pnl': true,
                        'best-exit-percentage': true,
                        
                        // === POSITION SIZING ===
                        'volume': true,
                        'executions': true,
                        'points': true,
                        'ticks': true,
                        'ticks-per-contract': true,
                        'pips': true,
                        
                        // === RISK METRICS ===
                        'position-mae': true,
                        'position-mfe': true,
                        'price-mae': true,
                        'price-mfe': true,
                        'initial-risk': true,
                        'initial-target': true,
                        'planned-r-multiple': true,
                        'realized-r-multiple': true,
                        'return-per-pip': true,
                        
                        // === COSTS & FEES ===
                        'commissions': true,
                        'total-fees': true,
                        'total-swap': true,
                        'adjusted-cost': true,
                        'adjusted-proceeds': true,
                        
                        // === TRADING STRATEGY ===
                        'playbook': true,
                        'trade-rating': true,
                        'scale': true,
                        
                        // === ANALYSIS & NOTES ===
                        'notes': true,
                        'mistakes': true,
                        'custom-tags': true,
                        'reviewed': true
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Apply All
                  </button>
                  <button
                    onClick={() => {
                      // Reset to default columns
                      setVisibleColumns({
                        // === BASIC TRADE INFO ===
                        'symbol': true,
                        'status': true,
                        'side': false,
                        'instrument': false,
                        'instrument-type': false,
                        'account-name': false,
                        
                        // === TIMING ===
                        'open-date': true,
                        'open-time': false,
                        'close-date': false,
                        'close-time': false,
                        'duration': true,
                        
                        // === PRICING ===
                        'entry-price': true,
                        'exit-price': true,
                        'average-entry': false,
                        'average-exit': false,
                        'best-exit-price': false,
                        'best-exit-time': false,
                        
                        // === P&L PERFORMANCE ===
                        'net-pnl': true,
                        'gross-pnl': false,
                        'net-roi': false,
                        'best-exit-pnl': false,
                        'best-exit-percentage': false,
                        
                        // === POSITION SIZING ===
                        'volume': false,
                        'executions': false,
                        'points': false,
                        'ticks': false,
                        'ticks-per-contract': false,
                        'pips': false,
                        
                        // === RISK METRICS ===
                        'position-mae': false,
                        'position-mfe': false,
                        'price-mae': false,
                        'price-mfe': false,
                        'initial-risk': false,
                        'initial-target': false,
                        'planned-r-multiple': false,
                        'realized-r-multiple': false,
                        'return-per-pip': false,
                        
                        // === COSTS & FEES ===
                        'commissions': false,
                        'total-fees': false,
                        'total-swap': false,
                        'adjusted-cost': false,
                        'adjusted-proceeds': false,
                        
                        // === TRADING STRATEGY ===
                        'playbook': false,
                        'trade-rating': false,
                        'scale': false,
                        
                        // === ANALYSIS & NOTES ===
                        'notes': false,
                        'mistakes': false,
                        'custom-tags': false,
                        'reviewed': false
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    Set Default
                  </button>
                </div>
                <div className="flex gap-3">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <button 
                      onClick={() => {
                        console.log('Applied column changes:', visibleColumns)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Changes
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </div>
    </div>
  )
}
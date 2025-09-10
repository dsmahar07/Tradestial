'use client'

import { logger } from '@/lib/logger'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Edit3, Share2 } from 'lucide-react'
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ChevronDownIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { Root as FancyButton } from '@/components/ui/fancy-button'
import { MonthlyCalendar } from '@/components/ui/monthly-calendar'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine,
  CartesianGrid 
} from 'recharts'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { useReviewStatus } from '@/hooks/use-review-status'

interface TradeData {
  time: string
  value: number
  positiveValue?: number | null
  negativeValue?: number | null
}

interface TradeCard {
  id: string
  date: string
  netPnl: number
  isProfit: boolean
  stats: {
    totalTrades: number
    winners: number
    losers: number
    winrate: string
    grossPnl: number
    volume: number
    commissions: number
    profitFactor: number
  }
  chartData: TradeData[]
  trades: Array<{
    avgEntry: number
    avgExit: number
    bestExitPnl: number
    bestExitPercent: string
    bestExitPrice: number
    bestExitTime: string
    closeTime: string
    customTags: string
    duration: string
    grossPnl: number
    instrument: string
    mistakes: number
    netPnl: number
    netRoi: string
    openTime: string
    pips: number
    modelPoints: number
    priceMae: number
    priceMfe: number
    positionMae: number
    positionMfe: number
    realizedRMultiple: number
    returnPerPip: number
    reviewed: boolean
    side: string
    tag: string
    ticks: number
    ticksPerContract: number
    ticker: string
    volumeScore: number
  }>
}

const sampleTradeCards: TradeCard[] = [
  {
    id: '1',
    date: 'Tue, Apr 23, 2024',
    netPnl: 91.25,
    isProfit: true,
    stats: {
      totalTrades: 2,
      winners: 1,
      losers: 1,
      winrate: '50%',
      grossPnl: 91.25,
      volume: 7,
      commissions: 0,
      profitFactor: 4.65
    },
    chartData: [
      { time: '09:30', value: 0, positiveValue: 0, negativeValue: 0 },
      { time: '10:00', value: -20, positiveValue: null, negativeValue: -20 },
      { time: '10:30', value: -35, positiveValue: null, negativeValue: -35 },
      { time: '11:00', value: -15, positiveValue: null, negativeValue: -15 },
      { time: '11:30', value: 30, positiveValue: 30, negativeValue: null },
      { time: '12:00', value: 91.25, positiveValue: 91.25, negativeValue: null }
    ],
    trades: [
      {
        avgEntry: 5071.75,
        avgExit: 5079.5,
        bestExitPnl: 836.25,
        bestExitPercent: '13.9%',
        bestExitPrice: 5127.5,
        bestExitTime: '04/23/2024 23:00:00',
        closeTime: '09:45:29',
        customTags: '–',
        duration: '3m 47s',
        grossPnl: 836.25,
        instrument: 'ES',
        mistakes: 0,
        netPnl: 836.25,
        netRoi: '16.5%',
        openTime: '09:41:42',
        pips: 5.75,
        modelPoints: 115,
        priceMae: -12.50,
        priceMfe: 836.25,
        positionMae: -0.25,
        positionMfe: 16.5,
        realizedRMultiple: 3.35,
        returnPerPip: 145.48,
        reviewed: true,
        side: 'Long',
        tag: 'Breakout',
        ticks: 23,
        ticksPerContract: 11.5,
        ticker: 'ESU4',
        volumeScore: 9.2
      },
      {
        avgEntry: 5068.5,
        avgExit: 5067.25,
        bestExitPnl: 878.75,
        bestExitPercent: '–',
        bestExitPrice: 5127.5,
        bestExitTime: '04/23/2024 23:00:00',
        closeTime: '09:30:21',
        customTags: '–',
        duration: '18m 2s',
        grossPnl: -745.00,
        instrument: 'ES',
        mistakes: 1,
        netPnl: -745.00,
        netRoi: '-14.7%',
        openTime: '09:12:19',
        pips: -14.9,
        modelPoints: -298,
        priceMae: -745.00,
        priceMfe: 25.00,
        positionMae: -14.7,
        positionMfe: 0.49,
        realizedRMultiple: -2.98,
        returnPerPip: -50.00,
        reviewed: false,
        side: 'Short',
        tag: 'Reversal',
        ticks: -59,
        ticksPerContract: -29.5,
        ticker: 'ESU4',
        volumeScore: 6.8
      }
    ]
  },
  {
    id: '2',
    date: 'Mon, Apr 22, 2024',
    netPnl: -245.50,
    isProfit: false,
    stats: {
      totalTrades: 4,
      winners: 1,
      losers: 3,
      winrate: '25%',
      grossPnl: -245.50,
      volume: 12,
      commissions: 15.50,
      profitFactor: 0.67
    },
    chartData: [
      { time: '09:30', value: 0, positiveValue: 0, negativeValue: 0 },
      { time: '10:00', value: 50, positiveValue: 50, negativeValue: null },
      { time: '10:30', value: 25, positiveValue: 25, negativeValue: null },
      { time: '11:00', value: -30, positiveValue: null, negativeValue: -30 },
      { time: '11:30', value: -80, positiveValue: null, negativeValue: -80 },
      { time: '12:00', value: -150, positiveValue: null, negativeValue: -150 },
      { time: '12:30', value: -200, positiveValue: null, negativeValue: -200 },
      { time: '13:00', value: -245.50, positiveValue: null, negativeValue: -245.50 }
    ],
    trades: [
      {
        avgEntry: 4987.25,
        avgExit: 4992.75,
        bestExitPnl: 275.00,
        bestExitPercent: '5.5%',
        bestExitPrice: 4999.50,
        bestExitTime: '04/22/2024 15:30:00',
        closeTime: '10:15:42',
        customTags: 'Morning Rally',
        duration: '12m 15s',
        grossPnl: 275.00,
        instrument: 'ES',
        mistakes: 0,
        netPnl: 275.00,
        netRoi: '5.5%',
        openTime: '10:03:27',
        pips: 5.5,
        modelPoints: 110,
        priceMae: -25.00,
        priceMfe: 275.00,
        positionMae: -0.5,
        positionMfe: 5.5,
        realizedRMultiple: 2.75,
        returnPerPip: 50.00,
        reviewed: true,
        side: 'Long',
        tag: 'Momentum',
        ticks: 22,
        ticksPerContract: 11.0,
        ticker: 'ESU4',
        volumeScore: 8.5
      },
      {
        avgEntry: 4995.50,
        avgExit: 4988.25,
        bestExitPnl: 362.50,
        bestExitPercent: '7.3%',
        bestExitPrice: 5002.75,
        bestExitTime: '04/22/2024 16:00:00',
        closeTime: '11:45:18',
        customTags: 'Failed Breakout',
        duration: '8m 33s',
        grossPnl: -362.50,
        instrument: 'ES',
        mistakes: 2,
        netPnl: -362.50,
        netRoi: '-7.3%',
        openTime: '11:36:45',
        pips: -7.25,
        modelPoints: -145,
        priceMae: -362.50,
        priceMfe: 87.50,
        positionMae: -7.3,
        positionMfe: 1.75,
        realizedRMultiple: -2.90,
        returnPerPip: -50.00,
        reviewed: false,
        side: 'Long',
        tag: 'Breakout',
        ticks: -29,
        ticksPerContract: -14.5,
        ticker: 'ESU4',
        volumeScore: 4.2
      },
      {
        avgEntry: 4991.75,
        avgExit: 4986.00,
        bestExitPnl: 287.50,
        bestExitPercent: '5.8%',
        bestExitPrice: 4997.50,
        bestExitTime: '04/22/2024 17:15:00',
        closeTime: '12:22:09',
        customTags: 'Revenge Trade',
        duration: '4m 12s',
        grossPnl: -287.50,
        instrument: 'ES',
        mistakes: 3,
        netPnl: -287.50,
        netRoi: '-5.8%',
        openTime: '12:17:57',
        pips: -5.75,
        modelPoints: -115,
        priceMae: -287.50,
        priceMfe: 25.00,
        positionMae: -5.8,
        positionMfe: 0.5,
        realizedRMultiple: -2.30,
        returnPerPip: -50.00,
        reviewed: false,
        side: 'Long',
        tag: 'Revenge',
        ticks: -23,
        ticksPerContract: -11.5,
        ticker: 'ESU4',
        volumeScore: 3.1
      }
    ]
  },
  {
    id: '3',
    date: 'Fri, Apr 19, 2024',
    netPnl: 458.75,
    isProfit: true,
    stats: {
      totalTrades: 3,
      winners: 3,
      losers: 0,
      winrate: '100%',
      grossPnl: 458.75,
      volume: 9,
      commissions: 12.25,
      profitFactor: 7.85
    },
    chartData: [
      { time: '09:30', value: 0, positiveValue: 0, negativeValue: 0 },
      { time: '10:00', value: 125, positiveValue: 125, negativeValue: null },
      { time: '10:30', value: 280, positiveValue: 280, negativeValue: null },
      { time: '11:00', value: 350, positiveValue: 350, negativeValue: null },
      { time: '11:30', value: 458.75, positiveValue: 458.75, negativeValue: null }
    ],
    trades: [
      {
        avgEntry: 5012.25,
        avgExit: 5018.50,
        bestExitPnl: 312.50,
        bestExitPercent: '6.2%',
        bestExitPrice: 5024.75,
        bestExitTime: '04/19/2024 14:45:00',
        closeTime: '10:08:15',
        customTags: 'Perfect Entry',
        duration: '5m 42s',
        grossPnl: 312.50,
        instrument: 'ES',
        mistakes: 0,
        netPnl: 312.50,
        netRoi: '6.2%',
        openTime: '10:02:33',
        pips: 6.25,
        modelPoints: 125,
        priceMae: -12.50,
        priceMfe: 312.50,
        positionMae: -0.25,
        positionMfe: 6.2,
        realizedRMultiple: 3.12,
        returnPerPip: 50.00,
        reviewed: true,
        side: 'Long',
        tag: 'Breakout',
        ticks: 25,
        ticksPerContract: 12.5,
        ticker: 'ESU4',
        volumeScore: 9.8
      },
      {
        avgEntry: 5020.75,
        avgExit: 5024.00,
        bestExitPnl: 162.50,
        bestExitPercent: '3.2%',
        bestExitPrice: 5027.25,
        bestExitTime: '04/19/2024 15:15:00',
        closeTime: '10:35:28',
        customTags: 'Trend Following',
        duration: '7m 18s',
        grossPnl: 162.50,
        instrument: 'ES',
        mistakes: 0,
        netPnl: 162.50,
        netRoi: '3.2%',
        openTime: '10:28:10',
        pips: 3.25,
        modelPoints: 65,
        priceMae: -25.00,
        priceMfe: 162.50,
        positionMae: -0.5,
        positionMfe: 3.2,
        realizedRMultiple: 2.03,
        returnPerPip: 50.00,
        reviewed: true,
        side: 'Long',
        tag: 'Trend',
        ticks: 13,
        ticksPerContract: 6.5,
        ticker: 'ESU4',
        volumeScore: 8.7
      }
    ]
  }
]

// Process chart data to add zero crossing points for proper gradient separation
const processChartData = (data: TradeData[]) => {
  // Safety check for undefined or null data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [
      { time: '09:30', value: 0, positiveValue: 0, negativeValue: 0 },
      { time: '16:00', value: 0, positiveValue: 0, negativeValue: 0 }
    ]
  }

  // Map data to chart format with positive/negative split
  return data.map(item => {
    const value = item.value || 0
    return {
      time: item.time,
      value,
      positiveValue: value > 0 ? value : 0,
      negativeValue: value < 0 ? value : 0
    }
  })
}

// Column configuration mapping
const columnConfig = {
  'average-entry': { label: 'Average Entry', getValue: (trade: any) => `$${trade.avgEntry}` },
  'average-exit': { label: 'Average Exit', getValue: (trade: any) => `$${trade.avgExit}` },
  'best-exit-pnl': { label: 'Best Exit P&L', getValue: (trade: any) => `$${trade.bestExitPnl}` },
  'best-exit': { label: 'Best Exit (%)', getValue: (trade: any) => trade.bestExitPercent },
  'best-exit-price': { label: 'Best Exit Price', getValue: (trade: any) => `$${trade.bestExitPrice}` },
  'best-exit-time': { label: 'Best Exit Time', getValue: (trade: any) => trade.bestExitTime },
  'close-time': { label: 'Close Time', getValue: (trade: any) => trade.closeTime },
  'custom-tags': { label: 'Custom Tags', getValue: (trade: any) => trade.customTags },
  'duration': { label: 'Duration', getValue: (trade: any) => trade.duration },
  'gross-pnl': { label: 'Gross P&L', getValue: (trade: any) => `$${trade.grossPnl}` },
  'instrument': { label: 'Instrument', getValue: (trade: any) => trade.instrument },
  'mistakes': { label: 'Mistakes', getValue: (trade: any) => trade.mistakes },
  'net-pnl': { label: 'Net P&L', getValue: (trade: any) => `$${trade.netPnl}` },
  'net-roi': { label: 'Net ROI', getValue: (trade: any) => trade.netRoi },
  'open-time': { label: 'Open Time', getValue: (trade: any) => trade.openTime },
  'pips': { label: 'Pips', getValue: (trade: any) => trade.pips },
  'model-points': { label: 'Model Points', getValue: (trade: any) => trade.modelPoints },
  'price-mae': { label: 'Price MAE', getValue: (trade: any) => `$${trade.priceMae}` },
  'price-mfe': { label: 'Price MFE', getValue: (trade: any) => `$${trade.priceMfe}` },
  'position-mae': { label: 'Position MAE', getValue: (trade: any) => `${trade.positionMae}%` },
  'position-mfe': { label: 'Position MFE', getValue: (trade: any) => `${trade.positionMfe}%` },
  'r-multiple': { label: 'R Multiple', getValue: (trade: any) => trade.realizedRMultiple },
  'return-per-pip': { label: 'Return Per Pip', getValue: (trade: any) => `$${trade.returnPerPip}` },
  'reviewed': { label: 'Reviewed', getValue: (trade: any) => trade.reviewed ? 'Yes' : 'No' },
  'side': { label: 'Side', getValue: (trade: any) => trade.side },
  'tag': { label: 'Tag', getValue: (trade: any) => trade.tag },
  'ticks': { label: 'Ticks', getValue: (trade: any) => trade.ticks },
  'ticks-per-contract': { label: 'Ticks Per Contract', getValue: (trade: any) => trade.ticksPerContract },
  'ticker': { label: 'Ticker', getValue: (trade: any) => trade.ticker },
  'volume-score': { label: 'Volume Score', getValue: (trade: any) => trade.volumeScore }
}

export function DailyJournalContent() {
  const router = useRouter()
  const { reviewStatuses, getReviewStatus, setReviewStatus, setBulkReviewStatus } = useReviewStatus()
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [trades, setTrades] = useState<Trade[]>([])
  const [selectedTrades, setSelectedTrades] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const tradesPerPage = 100
  
  const [visibleColumns, setVisibleColumns] = useState({
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

  // Load trades and subscribe to changes
  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  // Table helper functions
  const handleSelectAll = () => {
    if (selectedTrades.length === trades.length && trades.length > 0) {
      setSelectedTrades([])
    } else {
      setSelectedTrades(trades.map(trade => trade.id))
    }
  }

  const handleSelectTrade = (tradeId: string) => {
    if (selectedTrades.includes(tradeId)) {
      setSelectedTrades(selectedTrades.filter(id => id !== tradeId))
    } else {
      setSelectedTrades([...selectedTrades, tradeId])
    }
  }

  const getAvatarColor = (symbol: string) => {
    if (!symbol || typeof symbol !== 'string') {
      return 'bg-gray-500' // Default color for invalid symbols
    }
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ]
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getInitials = (symbol: string) => {
    if (!symbol || typeof symbol !== 'string') {
      return 'XX' // Default initials for invalid symbols
    }
    return symbol.substring(0, 2).toUpperCase()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }


  // Generate daily summaries from imported data  
  const dailySummaries = useMemo(() => {
    logger.debug('🔍 Daily Journal - Processing trades:', trades.length)
    if (!trades.length) return []

    // Group trades by date
    const tradesByDate = new Map<string, Trade[]>()
    trades.forEach(trade => {
      const tradeDate = new Date(trade.closeDate || trade.openDate)
      const dateKey = tradeDate.toDateString()
      
      if (!tradesByDate.has(dateKey)) {
        tradesByDate.set(dateKey, [])
      }
      tradesByDate.get(dateKey)!.push(trade)
    })

    logger.debug('🔍 Daily Journal - Trading days:', tradesByDate.size)

    // Convert to daily summary format
    const dailyData: Array<{
      id: string
      date: string
      dayTrades: Trade[]
      trades: Trade[]
      totalPnL: number
      netPnl: number
      isProfit: boolean
      winners: number
      losers: number
      winRate: string
      chartData: Array<{ time: string; value: number; positiveValue: number | null; negativeValue: number | null }>
      stats: {
        totalTrades: number
        winners: number
        losers: number
        winrate: string
        grossPnl: number
        volume: number
        commissions: number
        profitFactor: number
      }
    }> = []

    tradesByDate.forEach((dayTrades, dateKey) => {
      const date = new Date(dateKey)
      const totalPnL = dayTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
      const winners = dayTrades.filter(t => t.netPnl > 0).length
      const losers = dayTrades.filter(t => t.netPnl < 0).length
      const winRate = dayTrades.length > 0 ? ((winners / dayTrades.length) * 100).toFixed(0) : '0'

      logger.debug(`🔍 Processing day ${date.toDateString()}: ${dayTrades.length} trades, P&L: ${totalPnL}`)

      dailyData.push({
        id: `day_${date.getTime()}`,
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        dayTrades: dayTrades,
        trades: dayTrades,
        totalPnL: Math.round(totalPnL),
        netPnl: Math.round(totalPnL),
        isProfit: totalPnL >= 0,
        winners: winners,
        losers: losers,
        winRate: `${winRate}%`,
        chartData: [
          { time: '09:30', value: 0, positiveValue: 0, negativeValue: 0 },
          { time: '16:00', value: Math.round(totalPnL), positiveValue: totalPnL > 0 ? Math.round(totalPnL) : null, negativeValue: totalPnL < 0 ? Math.round(totalPnL) : null }
        ],
        stats: {
          totalTrades: dayTrades.length,
          winners: winners,
          losers: losers,
          winrate: `${winRate}%`,
          grossPnl: Math.round(totalPnL),
          volume: dayTrades.reduce((sum, t) => sum + (t.contractsTraded || 1), 0),
          commissions: dayTrades.reduce((sum, t) => sum + (t.commissions || 0), 0),
          profitFactor: (() => {
            const avgWin = winners > 0 ? dayTrades.filter(t => t.netPnl > 0).reduce((sum, t) => sum + t.netPnl, 0) / winners : 0
            const avgLoss = losers > 0 ? Math.abs(dayTrades.filter(t => t.netPnl < 0).reduce((sum, t) => sum + t.netPnl, 0)) / losers : 0
            return avgLoss > 0 ? parseFloat((avgWin / avgLoss).toFixed(2)) : 0
          })()
        }
      })
    })

    return dailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [trades])

  const toggleTable = (cardId: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedTables(newExpanded)
  }

  const handleAddNote = (card: any) => {
    // Store trade data in localStorage to pass to notes page
    const tradeData = {
      id: card.id,
      date: card.date,
      netPnl: card.netPnl,
      isProfit: card.isProfit,
      stats: card.stats,
      chartData: card.chartData,
      trades: card.trades
    }
    localStorage.setItem('selectedTradeForNote', JSON.stringify(tradeData))
    
    // Navigate to notes page with trade source parameters
    router.push('/notes?source=trade&tradeId=' + card.id)
  }

  // Use real daily data only
  const dataToUse = dailySummaries
  
  // Convert to calendar format
  const tradingDays = dataToUse.map((item: any) => ({
    date: item.date,
    pnl: item.totalPnL || item.netPnl,
    isProfit: (item.totalPnL || item.netPnl) >= 0
  }))

  const handleDateSelect = (date: Date) => {
    logger.debug('Selected date:', date)
    // You can add functionality to filter or highlight trades for selected date
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-6 pt-10 bg-[#fafafa] dark:bg-[#171717]">
      
      <div className="flex gap-8 max-w-none">
        {/* Left side - Trading cards */}
        <div className="flex-1 space-y-4 min-w-0">
          {dataToUse.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Trading Data</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                  Import your trading data to see daily performance summaries and detailed trade analysis.
                </p>
                <FancyButton 
                  variant="primary" 
                  size="medium"
                  onClick={() => router.push('/import-data')}
                >
                  Import Trading Data
                </FancyButton>
              </div>
            </div>
          ) : (
            dataToUse.map((card) => {
            const isTableExpanded = expandedTables.has(card.id)
            
            return (
            <div key={card.id} className="relative w-full rounded-[32px] bg-[#fafcff] dark:bg-[#171717] ring-1 ring-gray-200 dark:ring-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-visible">
              {/* Card Header */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleTable(card.id)}
                      className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md px-2 py-1 transition-colors"
                    >
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isTableExpanded ? 'rotate-180' : ''
                        }`} 
                      />
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {card.date}
                      </span>
                    </button>
                    <div 
                      className="text-lg font-semibold"
                      style={{
                        color: card.isProfit ? '#10b981' : '#ef4444'
                      }}
                    >
                      Net P&L ${card.netPnl}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FancyButton 
                      variant="basic" 
                      size="small" 
                      className="!text-gray-600 dark:!text-gray-300 !bg-white dark:!bg-[#0f0f0f] !border-gray-300 dark:!border-[#2a2a2a] hover:!bg-gray-50 dark:hover:!bg-[#2a2a2a]"
                      onClick={() => handleAddNote(card)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Add note
                    </FancyButton>
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="w-6 h-6 relative">
                        <Image
                          src="/Branding/Tradestial.png"
                          alt="Tradestial Logo"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Inner container for chart and table content */}
              <div className="mb-6 rounded-[24px] bg-white dark:bg-[#0f0f0f] shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                {/* Chart and Stats Section - Always visible */}
                <div className="px-6 py-4">
                {/* Chart and Stats Section */}
                  <div className="flex flex-row gap-8">
                    {/* Chart */}
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-full sm:w-[380px] h-[150px] [--grid:#e5e7eb] dark:[--grid:#262626]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={processChartData(card.chartData)}
                            margin={{ top: 20, right: 5, left: -1, bottom: 20 }}
                          >
                            {/* Disable default grid entirely */}
                            <CartesianGrid stroke="none" vertical={false} horizontal={false} />
                            
                            <defs>
                              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#06d6a0" stopOpacity={0.15}/>
                              </linearGradient>
                              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF4757" stopOpacity={0.15}/>
                                <stop offset="100%" stopColor="#FF4757" stopOpacity={0.6}/>
                              </linearGradient>
                            </defs>
                            
                            <XAxis 
                              dataKey="time" 
                              axisLine={false}
                              tickLine={false}
                              tick={false}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ 
                                fontSize: 11, 
                                fill: '#9ca3af'
                              }}
                              className="dark:fill-gray-400"
                              tickFormatter={(value) => {
                                if (value === 0) return '$0';
                                const absValue = Math.abs(value);
                                if (absValue >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
                                if (absValue >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
                                return `$${Math.round(value).toLocaleString()}`;
                              }}
                              domain={(() => {
                                const processedData = processChartData(card.chartData);
                                const values = processedData?.map(d => d.value).filter(v => typeof v === 'number' && isFinite(v)) || [];
                                if (values.length === 0) return [0, 100];
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                if (min === max) {
                                  const pad = Math.max(1, Math.abs(min) * 0.1);
                                  return [min - 2 * pad, min + 2 * pad];
                                }
                                const range = max - min;
                                const rawStep = range / 6;
                                const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, Math.abs(rawStep)))));
                                const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
                                const niceMin = Math.floor(min / niceStep) * niceStep;
                                const niceMax = Math.ceil(max / niceStep) * niceStep;
                                return [niceMin, niceMax];
                              })()}
                              width={45}
                            />
                            
                            {/* Draw horizontal grid lines explicitly */}
                            {(() => {
                              const processedData = processChartData(card.chartData);
                              const values = processedData?.map(d => d.value).filter(v => typeof v === 'number' && isFinite(v)) || [];
                              if (values.length === 0) return [];
                              const min = Math.min(...values);
                              const max = Math.max(...values);
                              if (min === max) return [min];
                              const range = max - min;
                              const rawStep = range / 6;
                              const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, Math.abs(rawStep)))));
                              const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
                              const niceMin = Math.floor(min / niceStep) * niceStep;
                              const niceMax = Math.ceil(max / niceStep) * niceStep;
                              const ticks: number[] = [];
                              for (let v = niceMin; v <= niceMax + 1e-9; v += niceStep) {
                                const roundedTick = Math.round(Number(v.toFixed(10)));
                                if (!ticks.includes(roundedTick)) {
                                  ticks.push(roundedTick);
                                }
                              }
                              return ticks;
                            })().map((t) => (
                              <ReferenceLine
                                key={`grid-${t}`}
                                y={t}
                                stroke="var(--grid)"
                                strokeDasharray="3 3"
                                strokeWidth={1}
                                ifOverflow="visible"
                              />
                            ))}
                            
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const value = payload[0].value || payload[0].payload?.value;
                                  if (value === undefined || value === null) {
                                    return (
                                      <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                                        <div className="font-semibold text-gray-500">No data</div>
                                      </div>
                                    );
                                  }
                                  const formatCurrency = (val: number) => {
                                    if (!isFinite(val) || isNaN(val)) return '$0';
                                    const absValue = Math.abs(val);
                                    if (absValue >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
                                    if (absValue >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
                                    return `$${Math.round(val).toLocaleString()}`;
                                  };
                                  return (
                                    <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                                      <div className={`font-semibold ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(value)}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                              cursor={false}
                            />
                            
                            <Area
                              type="linear"
                              dataKey="positiveValue"
                              stroke="none"
                              fill="url(#positiveGradient)"
                              fillOpacity={1}
                              connectNulls={false}
                              isAnimationActive={true}
                              animationDuration={800}
                              animationEasing="ease-in-out"
                              baseValue={0}
                            />
                            <Area
                              type="linear"
                              dataKey="negativeValue"
                              stroke="none"
                              fill="url(#negativeGradient)"
                              fillOpacity={1}
                              connectNulls={false}
                              isAnimationActive={true}
                              animationDuration={800}
                              animationEasing="ease-in-out"
                              baseValue={0}
                            />
                            
                            {/* Main line stroke - enhanced styling */}
                            <Area
                              type="linear"
                              dataKey="value"
                              stroke="#5B2CC9"
                              strokeWidth={1.5}
                              fill="none"
                              connectNulls={true}
                              isAnimationActive={true}
                              animationDuration={1200}
                              animationEasing="ease-out"
                              dot={false}
                              activeDot={{
                                r: 5,
                                fill: "#5B2CC9",
                                stroke: "#fff",
                                strokeWidth: 3,
                                filter: "drop-shadow(0 2px 4px rgba(91, 44, 201, 0.3))"
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="flex-1">
                      <div className="space-y-6">
                        {/* First Row */}
                        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-[#2a2a2a]">
                          <div className="pr-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total trades</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {card.stats.totalTrades}
                            </div>
                          </div>
                          <div className="px-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winners</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {card.stats.winners}
                            </div>
                          </div>
                          <div className="px-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross P&L</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              ${card.stats.grossPnl}
                            </div>
                          </div>
                          <div className="pl-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commissions</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              ${card.stats.commissions}
                            </div>
                          </div>
                        </div>
                        
                        {/* Second Row */}
                        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-[#2a2a2a]">
                          <div className="pr-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winrate</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {card.stats.winrate}
                            </div>
                          </div>
                          <div className="px-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Losers</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {card.stats.losers}
                            </div>
                          </div>
                          <div className="px-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Volume</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {card.stats.volume}
                            </div>
                          </div>
                          <div className="pl-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit factor</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {typeof card.stats.profitFactor === 'number' ? card.stats.profitFactor.toFixed(2) : card.stats.profitFactor}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
              
              {/* Trades Table - Same as Trades Page */}
              {isTableExpanded && (
                <div className="px-6 pb-6">
                  <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto" style={{ minWidth: '1200px' }}>
                        <thead className="bg-white dark:bg-[#0f0f0f] border-b-2 border-gray-300 dark:border-[#2a2a2a]">
                          <tr>
                            <th className="w-12 px-4 py-3 text-center">
                              <div className="flex justify-center">
                                <Checkbox.Root
                                  checked={selectedTrades.length === card.trades.length && card.trades.length > 0}
                                  onCheckedChange={() => {
                                    if (selectedTrades.length === card.trades.length && card.trades.length > 0) {
                                      setSelectedTrades([])
                                    } else {
                                      setSelectedTrades((card as any).trades.map((trade: any) => trade.id))
                                    }
                                  }}
                                  className="w-4 h-4 border border-gray-300 dark:border-[#2a2a2a] rounded flex items-center justify-center outline-none"
                                  style={{
                                    backgroundColor: selectedTrades.length === card.trades.length && card.trades.length > 0 ? '#3559E9' : 'white',
                                    borderColor: selectedTrades.length === card.trades.length && card.trades.length > 0 ? '#3559E9' : '#d1d5db'
                                  }}
                                >
                                  <Checkbox.Indicator className="text-white">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                  </Checkbox.Indicator>
                                </Checkbox.Root>
                              </div>
                            </th>
                            {visibleColumns['symbol'] && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                                <div className="flex items-center">
                                  Symbol <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['open-date'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[110px]">
                                <div className="flex items-center justify-center">
                                  Open Date <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['status'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px]">
                                <div className="flex items-center justify-center">
                                  Status <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['close-date'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[110px]">
                                <div className="flex items-center justify-center">
                                  Close Date <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['entry-price'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                                <div className="flex items-center justify-center">
                                  Entry Price <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['exit-price'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                                <div className="flex items-center justify-center">
                                  Exit Price <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['net-pnl'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[130px]">
                                <div className="flex items-center justify-center">
                                  Net P&L <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['net-roi'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                                <div className="flex items-center justify-center">
                                  Net ROI <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['scale'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                                <div className="flex items-center justify-center">
                                  Scale <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            {visibleColumns['reviewed'] && (
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                                <div className="flex items-center justify-center">
                                  Reviewed <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </div>
                              </th>
                            )}
                            <th className="w-12 px-4 py-3 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#0f0f0f] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                          {(card as any).trades.map((trade: any) => (
                            <tr 
                              key={trade.id} 
                              className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                              onClick={() => router.push(`/trades/tracker?trade=${trade.id}`)}
                            >
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-center">
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
                                </div>
                              </td>
                              {visibleColumns['symbol'] && (
                                <td className="px-6 py-4 w-[140px]">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(trade.symbol)}`}>
                                      {getInitials(trade.symbol)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{trade.symbol}</span>
                                  </div>
                                </td>
                              )}
                              {visibleColumns['open-date'] && (
                                <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[110px]">
                                  {new Date(trade.openDate).toLocaleDateString('en-US', { 
                                    day: '2-digit', 
                                    month: 'short'
                                  })}
                                </td>
                              )}
                              {visibleColumns['status'] && (
                                <td className="px-4 py-4 w-[90px]">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      trade.status === 'WIN' ? 'bg-green-500' : 'bg-red-500'
                                    }`}></div>
                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                      {trade.status === 'WIN' ? 'Win' : trade.status === 'LOSS' ? 'Loss' : trade.status}
                                    </span>
                                  </div>
                                </td>
                              )}
                              {visibleColumns['close-date'] && (
                                <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[110px]">
                                  {new Date(trade.closeDate).toLocaleDateString('en-US', { 
                                    day: '2-digit', 
                                    month: 'short'
                                  })}
                                </td>
                              )}
                              {visibleColumns['entry-price'] && (
                                <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[120px]">
                                  {formatCurrency(trade.entryPrice)}
                                </td>
                              )}
                              {visibleColumns['exit-price'] && (
                                <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[120px]">
                                  {formatCurrency(trade.exitPrice)}
                                </td>
                              )}
                              {visibleColumns['net-pnl'] && (
                                <td className="px-4 py-4 text-center text-sm font-medium text-gray-900 dark:text-gray-100 w-[130px]">
                                  <span 
                                    style={{
                                      color: trade.netPnl >= 0 ? '#10b981' : '#ef4444'
                                    }}
                                  >
                                    {formatCurrency(trade.netPnl)}
                                  </span>
                                </td>
                              )}
                              {visibleColumns['net-roi'] && (
                                <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[100px]">
                                  <span 
                                    style={{
                                      color: (trade.netRoi || 0) >= 0 ? '#10b981' : '#ef4444'
                                    }}
                                  >
                                    {typeof trade.netRoi === 'number' ? (trade.netRoi * 100).toFixed(2) : '0.00'}%
                                  </span>
                                </td>
                              )}
                              {visibleColumns['scale'] && (
                                <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 w-[100px]">
                                  {trade.stialScale !== undefined && trade.stialScale !== null ? (
                                    <div className="flex justify-center">
                                      <div className="relative h-2 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full">
                                        <div 
                                          className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]"
                                          style={{ width: `${Math.max(0, Math.min(100, (trade.stialScale / 5) * 100))}%` }}
                                        ></div>
                                        <span
                                          className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 block h-3 w-3 rounded-full border-2 bg-white"
                                          style={{ 
                                            left: `${Math.max(1, Math.min(99, (trade.stialScale / 5) * 100))}%`,
                                            borderColor: '#693EE0'
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="relative h-2 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full">
                                        <div 
                                          className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]"
                                          style={{ width: `${(() => {
                                            // Calculate dynamic scale based on trade performance
                                            const netRoi = trade.netRoi || 0
                                            
                                            // Base scale on ROI performance (netRoi is stored as ratio, not percentage)
                                            if (netRoi >= 0.15) return 100 // Excellent (5/5)
                                            if (netRoi >= 0.10) return 80  // Very Good (4/5)
                                            if (netRoi >= 0.05) return 60  // Good (3/5)
                                            if (netRoi >= 0) return 40     // Fair (2/5)
                                            if (netRoi >= -0.05) return 20 // Poor (1/5)
                                            return 10                      // Very Poor (0.5/5)
                                          })()}%` }}
                                        ></div>
                                        <span
                                          className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 block h-3 w-3 rounded-full border-2 bg-white"
                                          style={{ 
                                            left: `${(() => {
                                              const netRoi = trade.netRoi || 0
                                              if (netRoi >= 0.15) return 100
                                              if (netRoi >= 0.10) return 80
                                              if (netRoi >= 0.05) return 60
                                              if (netRoi >= 0) return 40
                                              if (netRoi >= -0.05) return 20
                                              return 10
                                            })()}%`,
                                            borderColor: '#693EE0'
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </td>
                              )}
                              {visibleColumns['reviewed'] && (
                                <td className="px-4 py-4 text-center w-[100px]" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-center">
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
                                      className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      title="Click to toggle review status"
                                    >
                                      {getReviewStatus(trade.id) === 'reviewed' ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                      ) : getReviewStatus(trade.id) === 'not-reviewed' ? (
                                        <XCircleIcon className="w-5 h-5 text-red-500" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-300"></div>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              )}
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-center">
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none">
                                        <EllipsisHorizontalIcon className="w-4 h-4" />
                                      </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                      <DropdownMenu.Content className="min-w-[140px] bg-white dark:bg-[#0f0f0f] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-lg z-50 p-1">
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
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          )
        }))}
        </div>
        
        {/* Right side - Monthly Calendar */}
        <div className="w-full lg:w-[650px] xl:w-[700px] flex-shrink-0">
          <MonthlyCalendar 
            tradingDays={tradingDays}
            onDateSelect={handleDateSelect}
            className="sticky top-6"
          />
        </div>
      </div>
    </main>
  )
}
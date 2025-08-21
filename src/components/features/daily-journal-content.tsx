'use client'

import { useState } from 'react'
import { ChevronDown, Edit3, Share2 } from 'lucide-react'
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { MonthlyCalendar } from '@/components/ui/monthly-calendar'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import * as Checkbox from '@radix-ui/react-checkbox'
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

interface TradeData {
  time: string
  value: number
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
      { time: '09:30', value: 0 },
      { time: '10:00', value: -20 },
      { time: '10:30', value: -35 },
      { time: '11:00', value: -15 },
      { time: '11:30', value: 30 },
      { time: '12:00', value: 91.25 }
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
      { time: '09:30', value: 0 },
      { time: '10:00', value: 50 },
      { time: '10:30', value: 25 },
      { time: '11:00', value: -30 },
      { time: '11:30', value: -80 },
      { time: '12:00', value: -150 },
      { time: '12:30', value: -200 },
      { time: '13:00', value: -245.50 }
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
      { time: '09:30', value: 0 },
      { time: '10:00', value: 125 },
      { time: '10:30', value: 280 },
      { time: '11:00', value: 350 },
      { time: '11:30', value: 458.75 }
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
  const processed = []
  
  for (let i = 0; i < data.length; i++) {
    const current = data[i]
    const next = data[i + 1]
    
    processed.push(current)
    
    if (next) {
      // Check for zero crossing
      const currentValue = current.value || 0
      const nextValue = next.value || 0
      
      const crossesZero = (currentValue > 0 && nextValue < 0) || (currentValue < 0 && nextValue > 0)
      const involvesZero = currentValue === 0 || nextValue === 0
      
      if (crossesZero && !involvesZero) {
        // Calculate zero crossing point
        const ratio = Math.abs(currentValue) / (Math.abs(currentValue) + Math.abs(nextValue))
        
        // Calculate crossing time
        let crossingTime = current.time
        try {
          const currentTimeParts = current.time.split(':')
          const nextTimeParts = next.time.split(':')
          
          if (currentTimeParts.length >= 2 && nextTimeParts.length >= 2) {
            const currentMinutes = parseInt(currentTimeParts[0]) * 60 + parseInt(currentTimeParts[1])
            const nextMinutes = parseInt(nextTimeParts[0]) * 60 + parseInt(nextTimeParts[1])
            
            let minutesDiff = nextMinutes - currentMinutes
            if (minutesDiff < 0) minutesDiff += 24 * 60
            
            const crossingMinutes = currentMinutes + (minutesDiff * ratio)
            const crossingHour = Math.floor(crossingMinutes / 60) % 24
            const crossingMinute = Math.floor(crossingMinutes % 60)
            
            crossingTime = `${crossingHour.toString().padStart(2, '0')}:${crossingMinute.toString().padStart(2, '0')}`
          }
        } catch (e) {
          crossingTime = current.time
        }
        
        processed.push({
          time: crossingTime,
          value: 0
        })
      }
    }
  }
  
  return processed
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
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState({
    'average-entry': true,
    'average-exit': true,
    'best-exit-pnl': true,
    'best-exit': true,
    'best-exit-price': true,
    'best-exit-time': true,
    'close-time': true,
    'custom-tags': true,
    'duration': true,
    'gross-pnl': true,
    'instrument': true,
    'mistakes': true,
    'net-pnl': true,
    'net-roi': true,
    'open-time': true,
    'pips': true,
    'model-points': true,
    'price-mae': true,
    'price-mfe': true,
    'position-mae': true,
    'position-mfe': true,
    'r-multiple': true,
    'return-per-pip': true,
    'reviewed': true,
    'side': true,
    'tag': true,
    'ticks': true,
    'ticks-per-contract': true,
    'ticker': true,
    'volume-score': true
  })
  const router = useRouter()

  const toggleTable = (cardId: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedTables(newExpanded)
  }

  const handleAddNote = (card: TradeCard) => {
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

  // Convert trade cards to calendar format
  const tradingDays = sampleTradeCards.map(card => ({
    date: card.date,
    pnl: card.netPnl,
    isProfit: card.isProfit
  }))

  const handleDateSelect = (date: Date) => {
    console.log('Selected date:', date)
    // You can add functionality to filter or highlight trades for selected date
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-6 pt-10 bg-gray-50 dark:bg-[#1C1C1C]">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Journal</h1>
      </div>
      
      <div className="flex gap-8 max-w-none">
        {/* Left side - Trading cards */}
        <div className="flex-1 space-y-4 min-w-0">
          {sampleTradeCards.map((card) => {
            const isTableExpanded = expandedTables.has(card.id)
            
            return (
            <div key={card.id} className="bg-white dark:bg-[#171717] rounded-xl shadow-sm w-full">
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
                    <div className={`text-lg font-semibold ${
                      card.isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      Net P&L ${card.netPnl}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleAddNote(card)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Add note
                    </Button>
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="w-6 h-6 relative">
                        <Image
                          src="/new-tradtrace-logo.png"
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
              
              {/* Chart and Stats Section - Always visible */}
              <div className="px-6 py-4">
                {/* Chart and Stats Section */}
                  <div className="flex flex-row gap-8">
                    {/* Chart */}
                    <div className="flex-shrink-0">
                      <div className="w-full sm:w-[380px] h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={processChartData(card.chartData)} margin={{ top: 5, right: 5, left: 40, bottom: 5 }}>
                            <XAxis 
                              dataKey="time" 
                              axisLine={false}
                              tickLine={false}
                              tick={false}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#6b7280', fontSize: 12 }}
                              tickFormatter={(value) => `$${value}`}
                              domain={[0, 'dataMax + 10']}
                              width={35}
                            />
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke="#e5e7eb" 
                              horizontal={true}
                              vertical={false}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-background border rounded-lg p-2">
                                      <p className="text-xs font-medium">{data.time}</p>
                                      <p className={`text-xs font-medium ${
                                        data.value >= 0 ? "text-emerald-500" : "text-red-500"
                                      }`}>
                                        ${data.value}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <defs>
                              <linearGradient id={`greenGradient-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                                <stop offset="100%" stopColor="rgba(34, 197, 94, 0.3)" />
                              </linearGradient>
                              <linearGradient id={`redGradient-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
                              </linearGradient>
                            </defs>
                            
                            {/* Green area for positive parts - only above zero */}
                            <Area
                              type="monotone"
                              dataKey={(data) => data.value > 0 ? data.value : 0}
                              stroke="none"
                              fill={`url(#greenGradient-${card.id})`}
                              fillOpacity={0.7}
                              isAnimationActive={false}
                              baseValue={0}
                              connectNulls={true}
                            />
                            
                            {/* Red area for negative parts - only below zero */}
                            <Area
                              type="monotone"
                              dataKey={(data) => data.value < 0 ? data.value : 0}
                              stroke="none"
                              fill={`url(#redGradient-${card.id})`}
                              fillOpacity={0.7}
                              isAnimationActive={false}
                              baseValue={0}
                              connectNulls={true}
                            />
                            
                            {/* Main stroke line */}
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#3559E9"
                              strokeWidth={2}
                              fill="transparent"
                              isAnimationActive={false}
                              dot={false}
                            />
                            
                            {/* Reference line at zero */}
                            <ReferenceLine
                              y={0}
                              stroke="#94a3b8"
                              strokeDasharray="2 2"
                              strokeWidth={1}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="flex-1">
                      <div className="space-y-6">
                        {/* First Row */}
                        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
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
                        <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
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
                              {card.stats.profitFactor}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
              
              {/* Detailed Trades Table - Toggleable */}
              {isTableExpanded && (
                <div className="px-6 pb-6">
                  <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:dark:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:dark:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full" style={{ minWidth: '1200px' }}>
                      <thead className="bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-[#2a2a2a]">
                        <tr>
                          {Object.entries(visibleColumns)
                            .filter(([_, isVisible]) => isVisible)
                            .map(([columnKey]) => {
                              const config = columnConfig[columnKey as keyof typeof columnConfig]
                              return (
                                <th key={columnKey} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] whitespace-nowrap">
                                  {config?.label || columnKey.replace(/-/g, ' ')}
                                </th>
                              )
                            })}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#171717] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                        {card.trades.map((trade, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                            {Object.entries(visibleColumns)
                              .filter(([_, isVisible]) => isVisible)
                              .map(([columnKey]) => {
                                const config = columnConfig[columnKey as keyof typeof columnConfig]
                                return (
                                  <td key={columnKey} className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 min-w-[120px] whitespace-nowrap">
                                    {config?.getValue(trade) || 'N/A'}
                                  </td>
                                )
                              })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
        
        {/* Right side - Monthly Calendar */}
        <div className="w-full lg:w-[650px] flex-shrink-0">
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
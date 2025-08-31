'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { parseLocalDate, getMonth, getYear } from '@/utils/date-utils'

interface MonthData {
    month: string
    trades: number
    pnl: number
    winRate: number
}

interface YearlyCalendarProps {
    className?: string
}

// Generate yearly data from real trades
const generateYearData = (trades: Trade[], year: number): MonthData[] => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData: MonthData[] = []

    // Initialize all months
    for (let i = 0; i < 12; i++) {
        monthlyData.push({
            month: monthNames[i],
            trades: 0,
            pnl: 0,
            winRate: 0
        })
    }

    // Process trades for the selected year
    const yearTrades = trades.filter(trade => {
        return getYear(trade.closeDate || trade.openDate) === year
    })

    yearTrades.forEach(trade => {
        const monthIndex = getMonth(trade.closeDate || trade.openDate)
        
        monthlyData[monthIndex].trades += 1
        monthlyData[monthIndex].pnl += trade.netPnl
    })

    // Calculate win rates
    monthlyData.forEach((monthData, index) => {
        if (monthData.trades > 0) {
            const monthTrades = yearTrades.filter(trade => {
                return getMonth(trade.closeDate || trade.openDate) === index
            })
            const winningTrades = monthTrades.filter(trade => trade.netPnl > 0).length
            monthData.winRate = Math.round((winningTrades / monthData.trades) * 100)
        }
    })

    return monthlyData
}

export function YearlyCalendar({ className }: YearlyCalendarProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedTab, setSelectedTab] = useState<'winRate' | 'pnl' | 'trades'>('winRate')
    const [trades, setTrades] = useState<Trade[]>([])

    // Load trades and subscribe to changes
    useEffect(() => {
        setTrades(DataStore.getAllTrades())
        const unsubscribe = DataStore.subscribe(() => {
            setTrades(DataStore.getAllTrades())
        })
        return unsubscribe
    }, [])

    // Generate year data from real trades
    const yearData = useMemo(() => generateYearData(trades, selectedYear), [trades, selectedYear])

    const totalTrades = yearData.reduce((sum, month) => sum + month.trades, 0)
    const totalPnl = yearData.reduce((sum, month) => sum + month.pnl, 0)

    const getMonthColor = (month: MonthData) => {
        if (month.trades === 0) return 'border border-dotted border-gray-300 dark:border-gray-600 bg-transparent'

        switch (selectedTab) {
            case 'winRate':
                if (month.winRate >= 80) return 'bg-green-500 border border-dotted border-green-600'
                if (month.winRate >= 60) return 'bg-green-400 border border-dotted border-green-500'
                if (month.winRate >= 40) return 'bg-yellow-400 border border-dotted border-yellow-500'
                return 'bg-red-400 border border-dotted border-red-500'
            case 'pnl':
                if (month.pnl > 5000) return 'bg-green-500 border border-dotted border-green-600'
                if (month.pnl > 2000) return 'bg-green-400 border border-dotted border-green-500'
                if (month.pnl > 0) return 'bg-green-300 border border-dotted border-green-400'
                if (month.pnl < -2000) return 'bg-red-500 border border-dotted border-red-600'
                if (month.pnl < 0) return 'bg-red-400 border border-dotted border-red-500'
                return 'bg-gray-300 border border-dotted border-gray-400'
            case 'trades':
                if (month.trades >= 10) return 'bg-blue-500 border border-dotted border-blue-600'
                if (month.trades >= 5) return 'bg-blue-400 border border-dotted border-blue-500'
                if (month.trades >= 1) return 'bg-blue-300 border border-dotted border-blue-400'
                return 'border border-dotted border-gray-300 dark:border-gray-600 bg-transparent'
            default:
                return 'border border-dotted border-gray-300 dark:border-gray-600 bg-transparent'
        }
    }

    const getMonthValue = (month: MonthData) => {
        switch (selectedTab) {
            case 'winRate':
                return month.trades > 0 ? `${month.winRate}%` : '--'
            case 'pnl':
                return month.pnl !== 0 ? `$${month.pnl.toLocaleString()}` : '--'
            case 'trades':
                return month.trades > 0 ? month.trades.toString() : '--'
            default:
                return '--'
        }
    }

    const navigateYear = (direction: 'prev' | 'next') => {
        setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1)
    }

    // Show empty state when no trades
    if (!trades.length) {
        return (
            <Card className={cn("w-full border-0 shadow-none bg-white dark:bg-[#0f0f0f]", className)}>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-semibold">Yearly calendar</CardTitle>
                            <Info className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="h-32 flex items-center justify-center">
                        <div className="text-gray-500 dark:text-gray-400 text-center">
                            <div>No yearly trading data</div>
                            <div className="text-sm mt-1">Import your CSV to see monthly performance</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("w-full border-0 shadow-none bg-white dark:bg-[#0f0f0f]", className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-semibold">Yearly calendar</CardTitle>
                        <Info className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Tab Buttons */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <Button
                                variant={selectedTab === 'winRate' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setSelectedTab('winRate')}
                                className={cn(
                                    "text-xs px-3 py-1 h-7",
                                    selectedTab === 'winRate'
                                        ? "bg-white dark:bg-[#0f0f0f] shadow-sm text-gray-900 dark:text-white"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                Win rate
                            </Button>
                            <Button
                                variant={selectedTab === 'pnl' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setSelectedTab('pnl')}
                                className={cn(
                                    "text-xs px-3 py-1 h-7",
                                    selectedTab === 'pnl'
                                        ? "bg-white dark:bg-[#0f0f0f] shadow-sm text-gray-900 dark:text-white"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                P&L
                            </Button>
                            <Button
                                variant={selectedTab === 'trades' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setSelectedTab('trades')}
                                className={cn(
                                    "text-xs px-3 py-1 h-7",
                                    selectedTab === 'trades'
                                        ? "bg-white dark:bg-[#0f0f0f] shadow-sm text-gray-900 dark:text-white"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                Trades
                            </Button>
                        </div>

                        {/* Year Navigation */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateYear('prev')}
                                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="font-medium text-sm min-w-[3rem] text-center text-gray-900 dark:text-white">
                                {selectedYear}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateYear('next')}
                                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-4">
                    {/* Calendar Grid */}
                    <div className="grid gap-2 text-sm" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                        {/* Month Headers */}
                        {yearData.map((month) => (
                            <div key={month.month} className="text-center text-xs text-gray-600 dark:text-gray-400 font-medium">
                                {month.month}
                            </div>
                        ))}

                        {/* Total Column Header */}
                        <div className="text-center text-xs text-gray-600 dark:text-gray-400 font-medium">
                            Total
                        </div>

                        {/* Month Cells */}
                        {yearData.map((month) => (
                            <div
                                key={month.month}
                                className={cn(
                                    "aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium",
                                    month.trades > 0 ? "text-white" : "text-gray-400 dark:text-gray-500",
                                    getMonthColor(month)
                                )}
                            >
                                <div className="text-center">
                                    {month.trades > 0 && (
                                        <>
                                            <div className="text-xs opacity-90">{getMonthValue(month)}</div>
                                            <div className="text-[10px] opacity-75">{month.trades} trades</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Total Cell */}
                        <div className="aspect-square rounded-lg bg-red-400 flex flex-col items-center justify-center text-white text-xs font-medium">
                            <div className="text-center">
                                <div className="text-xs">
                                    {selectedTab === 'winRate' && totalTrades > 0 && `${Math.round((yearData.reduce((sum, m) => sum + (m.winRate * m.trades), 0) / totalTrades))}%`}
                                    {selectedTab === 'pnl' && `$${totalPnl.toLocaleString()}`}
                                    {selectedTab === 'trades' && totalTrades}
                                    {totalTrades === 0 && '--'}
                                </div>
                                <div className="text-[10px] opacity-75">{totalTrades} trades</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, BarChart3 } from 'lucide-react'

interface AnalyticsOverviewCardsProps {
  data: {
    totalPnl: number
    totalPnlChange: number
    winRate: number
    winRateChange: number
    profitFactor: number
    profitFactorChange: number
    avgTrade: number
    avgTradeChange: number
    totalTrades: number
    totalTradesChange: number
    sharpeRatio: number
    sharpeRatioChange: number
  }
}

export function AnalyticsOverviewCards({ data }: AnalyticsOverviewCardsProps) {
  const cards = [
    {
      title: 'Total P&L',
      value: `$${data.totalPnl.toLocaleString()}`,
      change: data.totalPnlChange,
      icon: DollarSign,
      color: data.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Win Rate',
      value: `${data.winRate.toFixed(1)}%`,
      change: data.winRateChange,
      icon: Target,
      color: data.winRate >= 50 ? 'text-green-600' : 'text-orange-600'
    },
    {
      title: 'Profit Factor',
      value: `${data.profitFactor.toFixed(2)}`,
      change: data.profitFactorChange,
      icon: BarChart3,
      color: data.profitFactor >= 1.5 ? 'text-green-600' : data.profitFactor >= 1 ? 'text-orange-600' : 'text-red-600'
    },
    {
      title: 'Avg Trade',
      value: `$${data.avgTrade.toFixed(2)}`,
      change: data.avgTradeChange,
      icon: TrendingUp,
      color: data.avgTrade >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Total Trades',
      value: data.totalTrades.toLocaleString(),
      change: data.totalTradesChange,
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Sharpe Ratio',
      value: data.sharpeRatio.toFixed(2),
      change: data.sharpeRatioChange,
      icon: BarChart3,
      color: data.sharpeRatio >= 1 ? 'text-green-600' : data.sharpeRatio >= 0.5 ? 'text-orange-600' : 'text-red-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white dark:bg-[#171717] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <card.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </h3>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 text-xs ${
                card.change > 0 ? 'text-green-500' : card.change < 0 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {card.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : card.change < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>{Math.abs(card.change).toFixed(1)}%</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { AlertOctagon, Tag as TagIcon } from 'lucide-react'

interface TradeStatsProps {
  trade: any
}

export function TradeStats({ trade }: TradeStatsProps) {
  const [rating, setRating] = useState(trade.tradeRating || 5)
  const [profitTarget, setProfitTarget] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, string[]>>({
    'Mistakes': [],
    'Custom Tags': []
  })

  const formatCurrency = (amount: number) => {
    if (amount === undefined || Number.isNaN(amount)) return '--'
    const sign = amount < 0 ? '-' : ''
    const absolute = Math.abs(amount)
    return `${sign}$${absolute.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value: number) => {
    if (value === undefined || Number.isNaN(value)) return '--'
    return `${(value * 100).toFixed(2)}%`
  }

  const addTag = (category: string, tag: string) => {
    setTagsByCategory(prev => ({
      ...prev,
      [category]: Array.from(new Set([...(prev[category] ?? []), tag]))
    }))
  }

  const removeTag = (category: string, tag: string) => {
    setTagsByCategory(prev => ({
      ...prev,
      [category]: (prev[category] ?? []).filter(t => t !== tag)
    }))
  }

  const renderCategoryLabel = (category: string) => {
    const isMistakes = category.toLowerCase() === 'mistakes'
    const containerClass = isMistakes
      ? 'w-5 h-5 rounded-md bg-gradient-to-br from-red-600 to-rose-500 ring-2 ring-red-400/40'
      : 'w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
    const Icon = isMistakes ? AlertOctagon : TagIcon
    return (
      <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <span className={`inline-flex items-center justify-center ${containerClass} text-white`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        {category}
      </span>
    )
  }

  return (
    <div className="flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-gray-700 p-6">
        {/* Net P&L */}
        <div className="mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net P&L</div>
          <div className={`text-3xl font-semibold ${
            trade.netPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(trade.netPnl)}
          </div>
        </div>

        {/* Trade Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="text-gray-500 dark:text-gray-400">Side</div>
            <div className="font-semibold text-green-600 dark:text-green-400">{trade.side}</div>

            <div className="text-gray-500 dark:text-gray-400">Contracts traded</div>
            <div className="font-medium">{trade.contractsTraded}</div>

            <div className="text-gray-500 dark:text-gray-400">Points</div>
            <div className="font-medium">{trade.points.toFixed(1)}</div>

            <div className="text-gray-500 dark:text-gray-400">Ticks</div>
            <div className="font-medium">{trade.ticks.toFixed(1)}</div>

            <div className="text-gray-500 dark:text-gray-400">Ticks Per Contract</div>
            <div className="font-medium">{trade.ticksPerContract.toFixed(1)}</div>

            <div className="text-gray-500 dark:text-gray-400">Commissions & Fees</div>
            <div className="font-medium">{formatCurrency(trade.commissions)}</div>

            <div className="text-gray-500 dark:text-gray-400">Net ROI</div>
            <div className={`font-medium ${trade.netRoi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatPercent(trade.netRoi)}
            </div>

            <div className="text-gray-500 dark:text-gray-400">Gross P&L</div>
            <div className="font-medium">{formatCurrency(trade.grossPnl)}</div>

            <div className="text-gray-500 dark:text-gray-400">Adjusted Cost</div>
            <div className="font-medium">{formatCurrency(trade.adjustedCost)}</div>

            <div className="text-gray-500 dark:text-gray-400">Model</div>
            <div className="font-medium">{trade.model}</div>

            <div className="text-gray-500 dark:text-gray-400">Zella Scale</div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 bg-green-200 dark:bg-green-900/40 rounded w-full relative">
                <div
                  className="absolute -top-1.5 h-4 w-1 rounded bg-green-600"
                  style={{ left: `${trade.zellaScale}%` }}
                />
              </div>
            </div>

            <div className="text-gray-500 dark:text-gray-400">Price MAE / MFE</div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs">
                {formatCurrency(trade.priceMae)}
              </span>
              <span className="text-xs text-gray-500">/</span>
              <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
                {formatCurrency(trade.priceMfe)}
              </span>
            </div>

            <div className="text-gray-500 dark:text-gray-400">Trade Rating</div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1)} aria-label={`Set rating ${i + 1}`}>
                  {i < rating ? (
                    <StarIcon className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <StarOutline className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Section */}
          <div className="mt-6">
            {Object.entries(tagsByCategory).map(([category, tags]) => (
              <div key={category} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {renderCategoryLabel(category)}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => removeTag(category, tag)}
                      className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Select tag</div>
              </div>
            ))}
            <div className="flex items-center justify-between mt-3 text-sm">
              <button className="text-blue-600 hover:underline">Add new category</button>
              <button className="text-gray-500 hover:underline">Manage tags</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <label className="text-gray-500 dark:text-gray-400 block mb-1">Profit Target</label>
            <div className="flex items-center">
              <span className="mr-1 text-gray-500">$</span>
              <input
                value={profitTarget}
                onChange={(e) => setProfitTarget(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-500 dark:text-gray-400 block mb-1">Stop Loss</label>
            <div className="flex items-center">
              <span className="mr-1 text-gray-500">$</span>
              <input
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="text-gray-500 dark:text-gray-400">Initial Target</div>
          <div className="font-medium">--</div>

          <div className="text-gray-500 dark:text-gray-400">Trade Risk</div>
          <div className="font-medium">--</div>

          <div className="text-gray-500 dark:text-gray-400">Planned R-Multiple</div>
          <div className="font-medium">--</div>

          <div className="text-gray-500 dark:text-gray-400">Realized R-Multiple</div>
          <div className="font-medium">--</div>

          <div className="text-gray-500 dark:text-gray-400">Average Entry</div>
          <div className="font-medium">{formatCurrency(trade.averageEntry)}</div>

          <div className="text-gray-500 dark:text-gray-400">Average Exit</div>
          <div className="font-medium">{formatCurrency(trade.averageExit)}</div>

          <div className="text-gray-500 dark:text-gray-400">Entry Time</div>
          <div className="font-medium">{trade.entryTime}</div>

          <div className="text-gray-500 dark:text-gray-400">Exit Time</div>
          <div className="font-medium">{trade.exitTime}</div>
        </div>
      </div>
    </div>
  )
}
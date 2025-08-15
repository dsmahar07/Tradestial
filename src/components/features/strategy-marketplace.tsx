'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSharedStrategies, SharedStrategy } from '@/lib/shared-strategies'

interface Strategy {
  id: string
  name: string
  description: string
  icon: string
  category: string
  color: string
  author: string
  rating: number
  downloads: number
  winRate: string
  profitFactor: string
}

const strategies: Strategy[] = [
  {
    id: 'ict-2022-model',
    name: 'ICT 2022 Model',
    description: 'Inner Circle Trader institutional concepts with smart money flow analysis and market structure...',
    icon: '📈',
    category: 'Breakout',
    color: 'bg-purple-500',
    author: 'ICT Trader',
    rating: 4.8,
    downloads: 1247,
    winRate: '72%',
    profitFactor: '2.4:1'
  },
  {
    id: 'smc-strategy',
    name: 'Smart Money Concepts',
    description: 'Advanced smart money concepts focusing on institutional order flow and liquidity grabs...',
    icon: '💰',
    category: 'Smart Money',
    color: 'bg-blue-500',
    author: 'SMC Expert',
    rating: 4.6,
    downloads: 892,
    winRate: '68%',
    profitFactor: '2.1:1'
  },
  {
    id: 'scalping-master',
    name: 'Scalping Master',
    description: 'High-frequency scalping strategy optimized for quick profits in volatile markets...',
    icon: '⚡',
    category: 'Scalping',
    color: 'bg-orange-500',
    author: 'Speed Trader',
    rating: 4.5,
    downloads: 623,
    winRate: '65%',
    profitFactor: '1.8:1'
  },
  {
    id: 'trend-following-pro',
    name: 'Trend Following Pro',
    description: 'Professional trend following system with advanced momentum indicators and risk management...',
    icon: '📊',
    category: 'Trend Following',
    color: 'bg-green-500',
    author: 'Trend Master',
    rating: 4.7,
    downloads: 1056,
    winRate: '74%',
    profitFactor: '2.6:1'
  },
  {
    id: 'reversal-king',
    name: 'Reversal King',
    description: 'Mean reversion strategy targeting oversold/overbought conditions with precise entries...',
    icon: '🔄',
    category: 'Mean Reversion',
    color: 'bg-red-500',
    author: 'Reversal Pro',
    rating: 4.4,
    downloads: 734,
    winRate: '63%',
    profitFactor: '2.0:1'
  },
  {
    id: 'momentum-trader',
    name: 'Momentum Trader',
    description: 'Momentum-based strategy capturing strong directional moves with tight risk control...',
    icon: '🚀',
    category: 'Momentum',
    color: 'bg-cyan-500',
    author: 'Momentum Pro',
    rating: 4.6,
    downloads: 945,
    winRate: '69%',
    profitFactor: '2.3:1'
  },
  {
    id: 'support-resistance',
    name: 'Support & Resistance',
    description: 'Classic support and resistance trading with modern refinements and automated signals...',
    icon: '📏',
    category: 'Support/Resistance',
    color: 'bg-indigo-500',
    author: 'Classic Trader',
    rating: 4.3,
    downloads: 567,
    winRate: '61%',
    profitFactor: '1.9:1'
  },
  {
    id: 'breakout-master',
    name: 'Breakout Master',
    description: 'Advanced breakout strategy with volume confirmation and false breakout filtering...',
    icon: '💥',
    category: 'Breakout',
    color: 'bg-pink-500',
    author: 'Breakout King',
    rating: 4.5,
    downloads: 812,
    winRate: '67%',
    profitFactor: '2.2:1'
  }
]

interface StrategyMarketplaceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StrategyMarketplace({ open, onOpenChange }: StrategyMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sharedStrategies, setSharedStrategies] = useState<SharedStrategy[]>([])

  useEffect(() => {
    setSharedStrategies(getSharedStrategies())
    
    const handleUpdate = () => {
      setSharedStrategies(getSharedStrategies())
    }
    
    window.addEventListener('tradtrace:shared-strategies-updated', handleUpdate)
    return () => window.removeEventListener('tradtrace:shared-strategies-updated', handleUpdate)
  }, [])

  // Convert shared strategies to marketplace format
  const convertedSharedStrategies: Strategy[] = sharedStrategies.map(shared => ({
    id: shared.id,
    name: shared.name,
    description: shared.description,
    icon: shared.emoji || '📈',
    category: shared.category,
    color: 'bg-purple-500', // User shared strategies get purple color
    author: shared.author,
    rating: 5.0, // Default high rating for user strategies
    downloads: Math.floor(Math.random() * 50) + 10, // Random download count
    winRate: `${shared.stats.winRate}%`,
    profitFactor: `${shared.stats.profitFactor}:1`
  }))

  // Combine default strategies with shared strategies
  const allStrategies = [...convertedSharedStrategies, ...strategies]

  const filteredStrategies = allStrategies.filter(strategy =>
    strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    strategy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    strategy.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    strategy.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(allStrategies.map(s => s.category))]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}>
        ★
      </span>
    ))
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 bg-white dark:bg-gray-900 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-lg">🏪</span>
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Strategy Marketplace
                </Dialog.Title>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Discover and import trading strategies from the community
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                My Strategies
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                Upload Strategy
              </Button>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search strategies, authors, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          {categories.map((category) => {
            const categoryStrategies = filteredStrategies.filter(s => s.category === category)
            if (categoryStrategies.length === 0) return null

            return (
              <div key={category}>
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">{category}</h3>
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    {categoryStrategies.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryStrategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3 mb-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white relative", strategy.color)}>
                          <span className="text-lg">{strategy.icon}</span>
                          {strategy.author === 'You' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {strategy.name}
                            </h4>
                            {strategy.author === 'You' && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded">
                                Your Strategy
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            by {strategy.author}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {strategy.description}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {strategy.winRate}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {strategy.profitFactor}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Profit Factor</div>
                        </div>
                      </div>

                      {/* Rating and Downloads */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(strategy.rating)}
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {strategy.rating}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {strategy.downloads} downloads
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Strategy
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
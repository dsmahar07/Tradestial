'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AddOn {
  id: string
  name: string
  description: string
  icon: string
  category: string
  color: string
}

const brokers: AddOn[] = [
  {
    id: 'ninjatrader',
    name: 'NinjaTrader',
    description: 'Connect your NinjaTrader account to automatically sync trades, positions, and performance data.',
    icon: '🥷',
    category: 'Popular',
    color: 'bg-orange-500'
  },
  {
    id: 'thinkorswim',
    name: 'Thinkorswim',
    description: 'Import your TD Ameritrade Thinkorswim trading data via CSV or API connection.',
    icon: '💭',
    category: 'Popular',
    color: 'bg-green-500'
  },
  {
    id: 'interactivebrokers',
    name: 'Interactive Brokers',
    description: 'Sync your IBKR account data including trades, commissions, and portfolio performance.',
    icon: '🏦',
    category: 'Popular',
    color: 'bg-blue-600'
  },
  {
    id: 'tradovate',
    name: 'Tradovate',
    description: 'Connect to Tradovate for real-time futures trading data and performance tracking.',
    icon: '⚡',
    category: 'Futures',
    color: 'bg-purple-600'
  },
  {
    id: 'tradestation',
    name: 'TradeStation',
    description: 'Import your TradeStation account data and trading history seamlessly.',
    icon: '🚂',
    category: 'Popular',
    color: 'bg-red-500'
  },
  {
    id: 'tastyworks',
    name: 'Tastyworks',
    description: 'Sync options and equity trades from your Tastyworks account automatically.',
    icon: '🍯',
    category: 'Options',
    color: 'bg-yellow-500'
  },
  {
    id: 'schwab',
    name: 'Charles Schwab',
    description: 'Connect your Schwab account to import trading data and performance metrics.',
    icon: '🏛️',
    category: 'Traditional',
    color: 'bg-blue-500'
  },
  {
    id: 'etrade',
    name: 'E*TRADE',
    description: 'Import your E*TRADE trading history and account performance data.',
    icon: '💻',
    category: 'Traditional',
    color: 'bg-green-600'
  },
  {
    id: 'fidelity',
    name: 'Fidelity',
    description: 'Sync your Fidelity account trades and portfolio performance automatically.',
    icon: '🔒',
    category: 'Traditional',
    color: 'bg-green-700'
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    description: 'Connect your Robinhood account for commission-free trading data import.',
    icon: '🏹',
    category: 'Mobile',
    color: 'bg-green-500'
  },
  {
    id: 'webull',
    name: 'Webull',
    description: 'Import your Webull trading data and access advanced analytics features.',
    icon: '🐂',
    category: 'Mobile',
    color: 'bg-blue-400'
  }
]

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBrokers = brokers.filter(broker =>
    broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    broker.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const popularBrokers = filteredBrokers.filter(broker => broker.category === 'Popular')
  const futuresBrokers = filteredBrokers.filter(broker => broker.category === 'Futures')
  const optionsBrokers = filteredBrokers.filter(broker => broker.category === 'Options')
  const traditionalBrokers = filteredBrokers.filter(broker => broker.category === 'Traditional')
  const mobileBrokers = filteredBrokers.filter(broker => broker.category === 'Mobile')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-6xl translate-x-[-50%] translate-y-[-50%] gap-4 bg-white dark:bg-[#171717] p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg border border-gray-200 dark:border-gray-600 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#171717] flex items-center justify-center">
                <span className="text-lg">🧩</span>
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Trade Sync
                </Dialog.Title>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sync and import your trading data from various platforms
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">
                Your connections
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                New
              </Button>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
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
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#171717] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Popular Brokers Section */}
          {popularBrokers.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">Popular Brokers</h3>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-[#171717] text-gray-600 dark:text-gray-400 rounded">
                  {popularBrokers.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularBrokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#171717] hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", broker.color)}>
                        <span className="text-lg">{broker.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {broker.name}
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {broker.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Connect broker
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Brokers Section */}
          {(futuresBrokers.length > 0 || optionsBrokers.length > 0 || traditionalBrokers.length > 0 || mobileBrokers.length > 0) && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">All Brokers</h3>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-[#171717] text-gray-600 dark:text-gray-400 rounded">
                  {futuresBrokers.length + optionsBrokers.length + traditionalBrokers.length + mobileBrokers.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...futuresBrokers, ...optionsBrokers, ...traditionalBrokers, ...mobileBrokers].map((broker) => (
                  <div
                    key={broker.id}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#171717] hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", broker.color)}>
                        <span className="text-lg">{broker.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {broker.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{broker.category}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {broker.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Connect broker
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
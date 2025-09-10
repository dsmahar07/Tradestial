'use client'

import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { CurrencyConversionService, CurrencyInfo } from '@/services/currency-conversion.service'

interface CurrencySelectorProps {
  className?: string
  showLabel?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function CurrencySelector({ 
  className = '', 
  showLabel = true,
  size = 'medium' 
}: CurrencySelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // Initialize and get current currency
    setSelectedCurrency(CurrencyConversionService.getSelectedCurrency().code)
    setLastUpdate(CurrencyConversionService.getLastUpdateTime())

    // Subscribe to currency changes
    const unsubscribe = CurrencyConversionService.subscribe((currency: CurrencyInfo) => {
      setSelectedCurrency(currency.code)
    })

    return unsubscribe
  }, [])

  const handleCurrencyChange = (currencyCode: string) => {
    const currencyInfo = CurrencyConversionService.getCurrencyInfo(currencyCode)
    if (currencyInfo) {
      CurrencyConversionService.setSelectedCurrency(currencyInfo)
    }
  }

  const handleRefreshRates = async () => {
    setIsRefreshing(true)
    try {
      await CurrencyConversionService.refreshRates()
      setLastUpdate(CurrencyConversionService.getLastUpdateTime())
    } catch (error) {
      logger.error('Failed to refresh rates:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const selectedCurrencyInfo = CurrencyConversionService.getCurrencyInfo(selectedCurrency)
  const isStale = CurrencyConversionService.isRateStale()

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-2',
    large: 'text-base px-4 py-3'
  }

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Never'
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Currency:
        </span>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`
              flex items-center gap-2 bg-white dark:bg-[#0f0f0f] 
              border border-gray-200 dark:border-[#2a2a2a] 
              rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] 
              transition-colors outline-none focus:ring-2 focus:ring-blue-500 
              focus:ring-offset-1 ${sizeClasses[size]}
              ${isStale ? 'border-yellow-300 dark:border-yellow-600' : ''}
            `}
          >
            <span className="text-lg">{selectedCurrencyInfo?.flag}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedCurrencyInfo?.symbol} {selectedCurrency}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="min-w-[280px] max-h-[400px] overflow-y-auto p-2"
          sideOffset={5}
        >
          {/* Header with refresh button */}
          <div className="flex items-center justify-between px-3 py-2 mb-2">
            <div>
              <DropdownMenuLabel className="text-sm font-medium">
                Select Currency
              </DropdownMenuLabel>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
                {isStale && (
                  <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                    (Stale)
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleRefreshRates}
              disabled={isRefreshing}
              className="
                p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2a2a2a] 
                transition-colors outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              title="Refresh exchange rates"
            >
              <ArrowPathIcon 
                className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </button>
          </div>

          <DropdownMenuSeparator />

          {/* Currency list */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {CurrencyConversionService.getSupportedCurrencies().map((currency: CurrencyInfo) => (
              <DropdownMenuItem
                key={currency.code}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                onClick={() => handleCurrencyChange(currency.code)}
              >
                <span className="text-lg">{currency.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currency.symbol} {currency.code}
                    </span>
                    {currency.code === selectedCurrency && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currency.name}
                  </div>
                </div>
                {currency.code !== 'USD' && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {CurrencyConversionService.getExchangeRate('USD', currency.code).toFixed(4)}
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />
          
          {/* Footer */}
          <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">
            Exchange rates are updated every 5 minutes
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

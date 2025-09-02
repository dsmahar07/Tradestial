'use client'

import { useState, useEffect, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import * as Tabs from '@radix-ui/react-tabs'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Separator from '@radix-ui/react-separator'
import { Calculator, TrendingUp, DollarSign, Target, Info, ChevronDown, Check, PieChart, BarChart3, Zap, Shield, TrendingDown, Activity, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalculationResult {
  positionSize: number
  riskAmount: number
  positionValue: number
  leverage?: number
  marginRequired?: number
  profitTarget?: number
  riskRewardRatio?: number
}

interface AssetConfig {
  tickSize: number
  contractSize: number
  currency: string
  marginRate?: number
}

const assetConfigs: Record<string, AssetConfig> = {
  // Forex - Standard lot sizes with proper pip values
  'EURUSD': { tickSize: 0.0001, contractSize: 100000, currency: 'USD' }, // 1 pip = $10 per lot
  'GBPUSD': { tickSize: 0.0001, contractSize: 100000, currency: 'USD' }, // 1 pip = $10 per lot
  'USDJPY': { tickSize: 0.01, contractSize: 100000, currency: 'JPY' },   // 1 pip = ¥1000 per lot
  'AUDUSD': { tickSize: 0.0001, contractSize: 100000, currency: 'USD' }, // 1 pip = $10 per lot
  'USDCAD': { tickSize: 0.0001, contractSize: 100000, currency: 'CAD' }, // 1 pip = CAD$10 per lot
  
  // Crypto - Price per unit
  'BTCUSD': { tickSize: 0.01, contractSize: 1, currency: 'USD' },
  'ETHUSD': { tickSize: 0.01, contractSize: 1, currency: 'USD' },
  'ADAUSD': { tickSize: 0.0001, contractSize: 1, currency: 'USD' },
  'SOLUSD': { tickSize: 0.01, contractSize: 1, currency: 'USD' },
  
  // Stocks - Price per share
  'AAPL': { tickSize: 0.01, contractSize: 1, currency: 'USD' },
  'TSLA': { tickSize: 0.01, contractSize: 1, currency: 'USD' },
  'MSFT': { tickSize: 0.01, contractSize: 1, currency: 'USD' },
  'GOOGL': { tickSize: 0.01, contractSize: 1, currency: 'USD' },
  
  // Futures - Correct tick values with realistic margin rates
  'ES': { tickSize: 0.25, contractSize: 50, currency: 'USD', marginRate: 0.03 },    // $12.50 per tick, ~3% margin
  'NQ': { tickSize: 0.25, contractSize: 20, currency: 'USD', marginRate: 0.02 },    // $5 per tick, ~2% margin  
  'CL': { tickSize: 0.01, contractSize: 1000, currency: 'USD', marginRate: 0.05 },  // $10 per tick, ~5% margin
  'GC': { tickSize: 0.10, contractSize: 100, currency: 'USD', marginRate: 0.04 }    // $10 per tick, ~4% margin
}

const assetCategories = {
  forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
  crypto: ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD'],
  stocks: ['AAPL', 'TSLA', 'MSFT', 'GOOGL'],
  futures: ['ES', 'NQ', 'CL', 'GC']
}

interface AdvancedPositionSizeCalculatorProps {
  open: boolean
  onClose: () => void
}

export function AdvancedPositionSizeCalculator({ open, onClose }: AdvancedPositionSizeCalculatorProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [assetType, setAssetType] = useState('forex')
  const [selectedAsset, setSelectedAsset] = useState('EURUSD')
  
  // Basic inputs
  const [accountBalance, setAccountBalance] = useState('10000')
  const [riskPercentage, setRiskPercentage] = useState('2')
  const [entryPrice, setEntryPrice] = useState('1.0850')
  const [stopLoss, setStopLoss] = useState('1.0800')
  const [takeProfit, setTakeProfit] = useState('1.0950')
  
  // Advanced inputs
  const [leverage, setLeverage] = useState('1')
  const [lotSize, setLotSize] = useState('1.0') // Standard lot for forex, 1 contract for futures/stocks
  const [commissionPerLot, setCommissionPerLot] = useState('7')
  const [spreadPips, setSpreadPips] = useState('1.5')

  const calculation = useMemo((): CalculationResult => {
    const balance = parseFloat(accountBalance) || 0
    const risk = parseFloat(riskPercentage) || 0
    const entry = parseFloat(entryPrice) || 0
    const stop = parseFloat(stopLoss) || 0
    const target = parseFloat(takeProfit) || 0
    const lev = parseFloat(leverage) || 1
    const userLotSize = parseFloat(lotSize) || 1
    
    if (!balance || !risk || !entry || !stop) {
      return { positionSize: 0, riskAmount: 0, positionValue: 0 }
    }

    const config = assetConfigs[selectedAsset]
    const riskAmount = (balance * risk) / 100
    const priceDiff = Math.abs(entry - stop)
    
    let positionSize = 0
    let positionValue = 0
    let marginRequired = 0

    if (assetType === 'forex') {
      // Calculate pip value correctly for different currency pairs
      const pips = priceDiff / config.tickSize
      let pipValue = 0
      
      if (selectedAsset.endsWith('USD')) {
        // USD is quote currency (EUR/USD, GBP/USD, etc.)
        pipValue = config.tickSize * config.contractSize
      } else if (selectedAsset.startsWith('USD')) {
        // USD is base currency (USD/JPY, USD/CAD, etc.)
        pipValue = (config.tickSize * config.contractSize) / entry
      } else {
        // Cross pairs - simplified calculation
        pipValue = config.tickSize * config.contractSize
      }
      
      // Calculate position size based on user's desired lot size
      const riskPerPip = riskAmount / pips
      const lotsNeeded = riskPerPip / pipValue
      positionSize = lotsNeeded * userLotSize
      
      positionValue = positionSize * config.contractSize * entry
      marginRequired = positionValue / lev
    } else if (assetType === 'crypto' || assetType === 'stocks') {
      // Calculate shares/units needed for the risk
      const sharesNeeded = riskAmount / priceDiff
      positionSize = sharesNeeded * userLotSize
      positionValue = positionSize * entry
      marginRequired = positionValue / lev
    } else if (assetType === 'futures') {
      // Calculate contracts needed
      const tickValue = config.tickSize * config.contractSize
      const ticks = priceDiff / config.tickSize
      const riskPerContract = ticks * tickValue
      
      const contractsNeeded = riskAmount / riskPerContract
      positionSize = contractsNeeded * userLotSize
      
      const notionalValue = positionSize * config.contractSize * entry
      positionValue = notionalValue
      marginRequired = notionalValue * (config.marginRate || 0.05)
    }

    // Calculate profit target with user's lot size
    const profitTarget = target ? Math.abs(target - entry) * positionSize : 0
    
    // Calculate risk-reward ratio
    const riskRewardRatio = target && stop ? Math.abs(target - entry) / Math.abs(entry - stop) : 0

    return {
      positionSize: Math.round(positionSize * 1000) / 1000, // Round to 3 decimals for precision
      riskAmount,
      positionValue: Math.round(positionValue * 100) / 100,
      leverage: lev,
      marginRequired: Math.round(marginRequired * 100) / 100,
      profitTarget: Math.round(profitTarget * 100) / 100,
      riskRewardRatio: Math.round(riskRewardRatio * 100) / 100
    }
  }, [accountBalance, riskPercentage, entryPrice, stopLoss, takeProfit, leverage, lotSize, selectedAsset, assetType])

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0f0f0f] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] z-50 flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Dialog.Title className="text-xl font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                    Advanced Position Size Calculator
                  </Dialog.Title>
                  <span className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                    BETA
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calculate optimal position sizes across all asset classes
                </p>
              </div>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              ×
            </Dialog.Close>
          </div>

          {/* Beta Warning */}
          <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Beta Feature Notice</p>
                <p className="text-amber-700 dark:text-amber-300">
                  This calculator is in beta testing. Results may contain inaccuracies, especially for complex instruments. 
                  Always verify calculations independently and consult with your broker for precise position sizing.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="grid w-full grid-cols-2 mb-6">
                <Tabs.Trigger 
                  value="basic"
                  className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-950/50 dark:data-[state=active]:text-blue-400"
                >
                  Basic Calculator
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="advanced"
                  className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-950/50 dark:data-[state=active]:text-blue-400"
                >
                  Advanced Features
                </Tabs.Trigger>
              </Tabs.List>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Inputs */}
                <div className="space-y-6">
                  {/* Asset Selection */}
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Layers className="w-3 h-3 text-white" />
                      </div>
                      Asset Selection
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Asset Type</label>
                        <Select.Root value={assetType} onValueChange={setAssetType}>
                          <Select.Trigger className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f] flex items-center justify-between">
                            <Select.Value />
                            <ChevronDown className="w-4 h-4" />
                          </Select.Trigger>
                          <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                            <Select.Item value="forex" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                              <Select.ItemText>Forex</Select.ItemText>
                              <Select.ItemIndicator><Check className="w-4 h-4" /></Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item value="crypto" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                              <Select.ItemText>Cryptocurrency</Select.ItemText>
                              <Select.ItemIndicator><Check className="w-4 h-4" /></Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item value="stocks" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                              <Select.ItemText>Stocks</Select.ItemText>
                              <Select.ItemIndicator><Check className="w-4 h-4" /></Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item value="futures" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                              <Select.ItemText>Futures</Select.ItemText>
                              <Select.ItemIndicator><Check className="w-4 h-4" /></Select.ItemIndicator>
                            </Select.Item>
                          </Select.Content>
                        </Select.Root>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Instrument</label>
                        <Select.Root value={selectedAsset} onValueChange={setSelectedAsset}>
                          <Select.Trigger className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f] flex items-center justify-between">
                            <Select.Value />
                            <ChevronDown className="w-4 h-4" />
                          </Select.Trigger>
                          <Select.Content className="bg-white dark:bg-[#0f0f0f] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                            {assetCategories[assetType as keyof typeof assetCategories]?.map(asset => (
                              <Select.Item key={asset} value={asset} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                <Select.ItemText>{asset}</Select.ItemText>
                                <Select.ItemIndicator><Check className="w-4 h-4" /></Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </div>
                    </div>
                  </div>

                  {/* Basic Inputs */}
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                        <DollarSign className="w-3 h-3 text-white" />
                      </div>
                      Account & Risk Settings
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Account Balance</label>
                        <input
                          type="number"
                          value={accountBalance}
                          onChange={(e) => setAccountBalance(e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                          placeholder="10000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Risk %</label>
                        <input
                          type="number"
                          value={riskPercentage}
                          onChange={(e) => setRiskPercentage(e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                          placeholder="2"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price Inputs */}
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      Price Levels
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Entry Price</label>
                        <input
                          type="number"
                          value={entryPrice}
                          onChange={(e) => setEntryPrice(e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                          step="0.00001"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Stop Loss</label>
                          <input
                            type="number"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                            step="0.00001"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Take Profit</label>
                          <input
                            type="number"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                            step="0.00001"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Tabs.Content value="advanced">
                    <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                          <Zap className="w-3 h-3 text-white" />
                        </div>
                        Advanced Settings
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Leverage</label>
                          <input
                            type="number"
                            value={leverage}
                            onChange={(e) => setLeverage(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {assetType === 'forex' ? 'Lot Size' : assetType === 'futures' ? 'Contracts' : 'Units'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={lotSize}
                            onChange={(e) => setLotSize(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                            placeholder={assetType === 'forex' ? '1.0' : '1'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Commission</label>
                          <input
                            type="number"
                            value={commissionPerLot}
                            onChange={(e) => setCommissionPerLot(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f0f0f]"
                          />
                        </div>
                      </div>
                    </div>
                  </Tabs.Content>
                </div>

                {/* Right Column - Results */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                        <BarChart3 className="w-3 h-3 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                        Calculation Results
                      </span>
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Position Size</span>
                        </div>
                        <span className="font-bold text-lg">
                          {calculation.positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          <span className="font-medium">Risk Amount</span>
                        </div>
                        <span className="font-bold text-red-600">
                          ${calculation.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">Position Value</span>
                        </div>
                        <span className="font-bold">
                          ${calculation.positionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {calculation.marginRequired && (
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">Margin Required</span>
                          </div>
                          <span className="font-bold text-orange-600">
                            ${calculation.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {calculation.profitTarget && (
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Profit Target</span>
                          </div>
                          <span className="font-bold text-green-600">
                            ${calculation.profitTarget.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {calculation.riskRewardRatio && (
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Risk:Reward</span>
                          </div>
                          <span className="font-bold">
                            1:{calculation.riskRewardRatio.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risk Management Tips */}
                  <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                        Risk Management Tips
                      </span>
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Never risk more than 1-2% per trade</li>
                      <li>• Maintain minimum 1:2 risk-reward ratio</li>
                      <li>• Consider correlation between positions</li>
                      <li>• Account for slippage and commissions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Tabs.Root>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-end gap-3">
              <Dialog.Close className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Close
              </Dialog.Close>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
                Save Calculation
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

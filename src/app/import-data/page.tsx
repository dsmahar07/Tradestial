'use client'

import { useState } from 'react'
import { Search, Plus, Upload, FileText, CheckCircle, Clock, Filter, ChevronDown, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/use-page-title'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { Trade } from '@/services/trade-data.service'
import { DataStore } from '@/services/data-store.service'

interface Broker {
  id: string
  name: string
  description: string
  icon: string
  category: string
  color: string
  csvFormat?: string
  status?: 'connected' | 'available'
  autoSync?: boolean
}

const brokers: Broker[] = [
  {
    id: 'ninjatrader',
    name: 'NinjaTrader',
    description: 'Connect your NinjaTrader account to automatically sync trades, positions, and performance data.',
    icon: '/Brokers Logo/Ninjatrader.png',
    category: 'Futures',
    color: 'bg-orange-500',
    csvFormat: 'NinjaTrader CSV Export',
    autoSync: true
  },
  {
    id: 'thinkorswim',
    name: 'Thinkorswim',
    description: 'Import your TD Ameritrade Thinkorswim trading data via CSV or API connection.',
    icon: '💭',
    category: 'Options',
    color: 'bg-green-500',
    csvFormat: 'TOS Trade History CSV',
    autoSync: true
  },
  {
    id: 'interactivebrokers',
    name: 'Interactive Brokers',
    description: 'Sync your IBKR account data including trades, commissions, and portfolio performance.',
    icon: '/Brokers Logo/Ibkr.png',
    category: 'Forex',
    color: 'bg-blue-600',
    csvFormat: 'IBKR Flex Query Report',
    autoSync: true
  },
  {
    id: 'tradovate',
    name: 'Tradovate',
    description: 'Connect to Tradovate for real-time futures trading data and performance tracking.',
    icon: '/Brokers Logo/Tradovate.png',
    category: 'Futures',
    color: 'bg-purple-600',
    csvFormat: 'Tradovate Export CSV',
    autoSync: true
  },
  {
    id: 'tradestation',
    name: 'TradeStation',
    description: 'Import your TradeStation account data and trading history seamlessly.',
    icon: '/Brokers Logo/Tradestation.png',
    category: 'Options',
    color: 'bg-red-500',
    csvFormat: 'TradeStation Reports',
    autoSync: false
  },
  {
    id: 'tastyworks',
    name: 'Tastyworks',
    description: 'Sync options and equity trades from your Tastyworks account automatically.',
    icon: '🍯',
    category: 'Options',
    color: 'bg-yellow-500',
    csvFormat: 'Tastyworks Transaction CSV',
    autoSync: true
  },
  {
    id: 'schwab',
    name: 'Charles Schwab',
    description: 'Connect your Schwab account to import trading data and performance metrics.',
    icon: '/Brokers Logo/Charles_Shwab.Logo.png',
    category: 'Traditional',
    color: 'bg-blue-500',
    csvFormat: 'Schwab Export CSV',
    autoSync: false
  },
  {
    id: 'etrade',
    name: 'E*TRADE',
    description: 'Import your E*TRADE trading history and account performance data.',
    icon: '/Brokers Logo/E-Trade-Logo.png',
    category: 'Traditional',
    color: 'bg-green-600',
    csvFormat: 'E*TRADE Download CSV',
    autoSync: false
  },
  {
    id: 'fidelity',
    name: 'Fidelity',
    description: 'Sync your Fidelity account trades and portfolio performance automatically.',
    icon: '🔒',
    category: 'Traditional',
    color: 'bg-green-700',
    csvFormat: 'Fidelity Transaction Export',
    autoSync: false
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    description: 'Connect your Robinhood account for commission-free trading data import.',
    icon: '/Brokers Logo/Robinhood.png',
    category: 'Mobile',
    color: 'bg-green-500',
    csvFormat: 'Robinhood Account Statement',
    autoSync: false
  },
  {
    id: 'webull',
    name: 'Webull',
    description: 'Import your Webull trading data and access advanced analytics features.',
    icon: '/Brokers Logo/webull.png',
    category: 'Mobile',
    color: 'bg-blue-400',
    csvFormat: 'Webull Trade History CSV',
    autoSync: false
  },
  {
    id: 'oanda',
    name: 'OANDA',
    description: 'Connect your OANDA account for comprehensive forex trading data and analytics.',
    icon: '/Brokers Logo/osandabroker.png',
    category: 'Forex',
    color: 'bg-indigo-500',
    csvFormat: 'OANDA Trade History CSV',
    autoSync: true
  },
  {
    id: 'forex',
    name: 'Forex.com',
    description: 'Import your Forex.com trading data and performance metrics.',
    icon: '📈',
    category: 'Forex',
    color: 'bg-emerald-500',
    csvFormat: 'Forex.com Export CSV',
    autoSync: false
  },
  {
    id: 'ampfutures',
    name: 'AMP Futures',
    description: 'Connect your AMP Futures account for comprehensive futures trading data and analytics.',
    icon: '/Brokers Logo/Ampfutures.png',
    category: 'Futures',
    color: 'bg-orange-600',
    csvFormat: 'AMP Futures CSV Export',
    autoSync: true
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    description: 'Import your MT5 trading data and performance metrics from any broker supporting MT5.',
    icon: '/Brokers Logo/Mt5.png',
    category: 'Forex',
    color: 'bg-blue-700',
    csvFormat: 'MT5 Account Statement',
    autoSync: true
  },
  {
    id: 'mt4',
    name: 'MetaTrader 4',
    description: 'Import your MT4 trading history and connect to forex and CFD markets.',
    icon: '📈',
    category: 'Forex',
    color: 'bg-indigo-600',
    csvFormat: 'MT4 Trade History CSV',
    autoSync: true
  },
  {
    id: 'tdameritrade',
    name: 'TD Ameritrade',
    description: 'Connect your TD Ameritrade account for comprehensive trading data import.',
    icon: '/Brokers Logo/Tdameri.png',
    category: 'Traditional',
    color: 'bg-red-600',
    csvFormat: 'TD Ameritrade CSV Export',
    autoSync: true
  },
  {
    id: 'alpaca',
    name: 'Alpaca',
    description: 'Import your commission-free trading data from Alpaca Markets.',
    icon: '🦙',
    category: 'Mobile',
    color: 'bg-yellow-600',
    csvFormat: 'Alpaca Trading History',
    autoSync: true
  },
  {
    id: 'binance',
    name: 'Binance',
    description: 'Connect your Binance account for cryptocurrency trading data and analytics.',
    icon: '/Brokers Logo/Binance.png',
    category: 'Crypto',
    color: 'bg-yellow-500',
    csvFormat: 'Binance Trade History CSV',
    autoSync: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    description: 'Import your Coinbase Pro cryptocurrency trading data and portfolio performance.',
    icon: '/Brokers Logo/coinbase-logo.png',
    category: 'Crypto',
    color: 'bg-blue-500',
    csvFormat: 'Coinbase Pro CSV Export',
    autoSync: false
  },
  {
    id: 'kraken',
    name: 'Kraken',
    description: 'Connect your Kraken account for comprehensive crypto trading analytics.',
    icon: '/Brokers Logo/Kraken-Logo.png',
    category: 'Crypto',
    color: 'bg-purple-700',
    csvFormat: 'Kraken Ledger Export',
    autoSync: false
  },
  {
    id: 'bybit',
    name: 'Bybit',
    description: 'Connect your Bybit account for crypto derivatives and spot trading data.',
    icon: '🚀',
    category: 'Crypto',
    color: 'bg-orange-500',
    csvFormat: 'Bybit Trading History',
    autoSync: true
  },
  {
    id: 'deribit',
    name: 'Deribit',
    description: 'Import your Deribit options and futures trading data for crypto derivatives.',
    icon: '⚡',
    category: 'Crypto',
    color: 'bg-gray-600',
    csvFormat: 'Deribit Trade Export',
    autoSync: false
  },
  {
    id: 'tradingview',
    name: 'TradingView',
    description: 'Import your TradingView paper trading and strategy backtesting results.',
    icon: '/Brokers Logo/tradingview.png',
    category: 'Traditional',
    color: 'bg-blue-600',
    csvFormat: 'TradingView Strategy Report',
    autoSync: false
  },
  {
    id: 'quantconnect',
    name: 'QuantConnect',
    description: 'Import your algorithmic trading results and backtesting data from QuantConnect.',
    icon: '🤖',
    category: 'Traditional',
    color: 'bg-green-600',
    csvFormat: 'QuantConnect Backtest CSV',
    autoSync: true
  },
  {
    id: 'xtb',
    name: 'XTB',
    description: 'Connect your XTB account for forex, indices, and commodities trading data.',
    icon: '📊',
    category: 'Forex',
    color: 'bg-red-500',
    csvFormat: 'XTB Trading History',
    autoSync: false
  },
  {
    id: 'plus500',
    name: 'Plus500',
    description: 'Import your Plus500 CFD trading data and performance analytics.',
    icon: '➕',
    category: 'Forex',
    color: 'bg-blue-500',
    csvFormat: 'Plus500 Account Statement',
    autoSync: false
  }
]

// Import workflow states
type ImportStep = 'broker-selection' | 'file-upload' | 'field-mapping' | 'processing' | 'results'

interface ImportState {
  step: ImportStep
  selectedBroker: Broker | null
  uploadedFile: File | null
  csvAnalysis: any
  fieldMapping: Record<string, string>
  importResults: {
    success: boolean
    trades: Partial<Trade>[]
    errors: string[]
    warnings: string[]
  } | null
}

export default function ImportDataPage() {
  usePageTitle('Import Trading Data')
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Import workflow state
  const [importState, setImportState] = useState<ImportState>({
    step: 'broker-selection',
    selectedBroker: null,
    uploadedFile: null,
    csvAnalysis: null,
    fieldMapping: {},
    importResults: null
  })

  const filterOptions = [
    { id: 'autoSync', label: 'Auto Sync Available' },
    { id: 'Futures', label: 'Futures Brokers' },
    { id: 'Forex', label: 'Forex Brokers' },
    { id: 'Options', label: 'Options Brokers' },
    { id: 'Crypto', label: 'Crypto Brokers' },
    { id: 'Traditional', label: 'Traditional Brokers' },
    { id: 'Mobile', label: 'Mobile Brokers' }
  ]

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }

  const clearAllFilters = () => {
    setSelectedFilters([])
  }

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broker.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (selectedFilters.length === 0) return matchesSearch
    
    const matchesFilters = selectedFilters.some(filter => {
      if (filter === 'autoSync') return broker.autoSync
      return broker.category === filter
    })
    
    return matchesSearch && matchesFilters
  })

  const popularBrokers = filteredBrokers.filter(broker => ['Futures', 'Options', 'Forex', 'Crypto'].includes(broker.category))
  const otherBrokers = filteredBrokers.filter(broker => !['Futures', 'Options', 'Forex', 'Crypto'].includes(broker.category))

  const handleBrokerSelect = (broker: Broker) => {
    setImportState(prev => ({
      ...prev,
      selectedBroker: broker,
      step: 'file-upload'
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const processFile = async (file: File) => {
    console.log('🚀 Processing file with AI:', file.name, file.type, file.size)

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please select a CSV file (.csv extension required)')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please select a file smaller than 10MB.')
      return
    }

    setIsProcessing(true)
    
    try {
      console.log('📊 Starting broker-specific CSV processing...')
      
      // Read file content
      const fileContent = await file.text()
      console.log('📄 File content loaded, size:', fileContent.length, 'characters')
      console.log('📄 File preview (first 500 chars):', fileContent.substring(0, 500))
      
      // TODO: Implement broker detection and CSV processing system
      // This will be built to detect specific broker formats and process accordingly
      
      setImportState(prev => ({
        ...prev,
        uploadedFile: file,
        step: 'results',
        importResults: {
          success: false,
          trades: [],
          errors: ['CSV processing system is being rebuilt with broker-specific detection.'],
          warnings: [
            'We are building a new system that will:',
            '• Automatically detect your broker from CSV format',
            '• Process broker-specific CSV structures', 
            '• Handle all major trading platforms',
            'Please provide your broker CSV files for training the system.'
          ]
        }
      }))
      
    } catch (error) {
      console.error('❌ CSV processing failed:', error)
      
      setImportState(prev => ({
        ...prev,
        step: 'results',
        importResults: {
          success: false,
          trades: [],
          errors: [`CSV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: ['Please check your CSV format and try again']
        }
      }))
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleFieldMappingComplete = async (mapping: Record<string, string>) => {
    if (!importState.uploadedFile) return
    
    setIsProcessing(true)
    setImportState(prev => ({ ...prev, step: 'processing', fieldMapping: mapping }))
    
    try {
      const result = await CSVImportService.importCSV(
        importState.uploadedFile,
        importState.selectedBroker?.id,
        mapping
      )
      
      await processImport(result.trades)
      
    } catch (error) {
      console.error('Import failed:', error)
      setImportState(prev => ({
        ...prev,
        step: 'results',
        importResults: {
          success: false,
          trades: [],
          errors: ['Import failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
          warnings: []
        }
      }))
    } finally {
      setIsProcessing(false)
    }
  }
  
  const processImport = async (trades: Partial<Trade>[]) => {
    try {
      // Save the trades to DataStore
      await DataStore.addTrades(trades)
      
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setImportState(prev => ({
        ...prev,
        step: 'results',
        importResults: {
          success: true,
          trades,
          errors: [],
          warnings: [`Successfully imported ${trades.length} trades to your portfolio`]
        }
      }))
      
    } catch (error) {
      setImportState(prev => ({
        ...prev,
        step: 'results',
        importResults: {
          success: false,
          trades: [],
          errors: ['Failed to save trades: ' + (error instanceof Error ? error.message : 'Unknown error')],
          warnings: []
        }
      }))
    }
  }
  
  const resetImport = () => {
    setImportState({
      step: 'broker-selection',
      selectedBroker: null,
      uploadedFile: null,
      csvAnalysis: null,
      fieldMapping: {},
      importResults: null
    })
  }
  
  const goBackToUpload = () => {
    setImportState(prev => ({
      ...prev,
      step: 'file-upload',
      csvAnalysis: null,
      fieldMapping: {},
      importResults: null
    }))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1C1C1C]">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image
                    src="/new-tradtrace-logo.png"
                    alt="Tradestial Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Import Trading Data
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sync and import your trading data from various platforms
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-gray-300 dark:border-[#2a2a2a] dark:bg-[#171717] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                        selectedFilters.length > 0 && "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
                      )}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      {selectedFilters.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                          {selectedFilters.length}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 bg-white dark:bg-[#171717] border-gray-200 dark:border-[#2a2a2a]"
                  >
                    {filterOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.id}
                        onClick={() => toggleFilter(option.id)}
                        className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-gray-900 dark:text-white">{option.label}</span>
                          {selectedFilters.includes(option.id) && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {selectedFilters.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={clearAllFilters}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                        >
                          Clear All Filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-gray-300">
                  View Connections
                </Button>
                <Button 
                  size="sm"
                  className="w-auto h-9 relative bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none px-4"
                >
                  <Plus className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">New Import</span>
                </Button>
              </div>
            </div>

            {/* Import Steps */}
            {importState.step === 'broker-selection' && (
              <>
                {/* Search and Filters */}
                <Card className="border-0 shadow-none bg-white dark:bg-[#171717]">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search brokers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#171717] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Specialty Brokers Section */}
                {popularBrokers.length > 0 && (
                  <Card className="border-0 shadow-none bg-white dark:bg-[#171717]">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg font-semibold">Specialty Brokers</CardTitle>
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {popularBrokers.length}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {popularBrokers.map((broker) => (
                          <div
                            key={broker.id}
                            onClick={() => handleBrokerSelect(broker)}
                            className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#171717] shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start space-x-3 mb-3">
                              {broker.icon.startsWith('/') ? (
                                <div className="w-12 h-12 flex items-center justify-center">
                                  <Image
                                    src={broker.icon}
                                    alt={`${broker.name} logo`}
                                    width={['ninjatrader', 'tradovate', 'robinhood', 'tdameritrade', 'mt5', 'interactivebrokers'].includes(broker.id) ? 64 : 48}
                                    height={['ninjatrader', 'tradovate', 'robinhood', 'tdameritrade', 'mt5', 'interactivebrokers'].includes(broker.id) ? 64 : 48}
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg", broker.color)}>
                                  <span className="text-xl">{broker.icon}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {broker.name}
                                  </h4>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {broker.csvFormat}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                              {broker.description}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-gray-300 group-hover:border-purple-300 dark:group-hover:border-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Traditional & Mobile Brokers Section */}
                {otherBrokers.length > 0 && (
                  <Card className="border-0 shadow-none bg-white dark:bg-[#171717]">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg font-semibold">Traditional & Mobile Brokers</CardTitle>
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {otherBrokers.length}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherBrokers.map((broker) => (
                          <div
                            key={broker.id}
                            onClick={() => handleBrokerSelect(broker)}
                            className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#171717] shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start space-x-3 mb-3">
                              {broker.icon.startsWith('/') ? (
                                <div className="w-12 h-12 flex items-center justify-center">
                                  <Image
                                    src={broker.icon}
                                    alt={`${broker.name} logo`}
                                    width={['ninjatrader', 'tradovate', 'robinhood', 'tdameritrade', 'mt5', 'interactivebrokers'].includes(broker.id) ? 64 : 48}
                                    height={['ninjatrader', 'tradovate', 'robinhood', 'tdameritrade', 'mt5', 'interactivebrokers'].includes(broker.id) ? 64 : 48}
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg", broker.color)}>
                                  <span className="text-xl">{broker.icon}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {broker.name}
                                  </h4>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {broker.category} • {broker.csvFormat}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                              {broker.description}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-gray-300 group-hover:border-purple-300 dark:group-hover:border-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* File Upload Step */}
            {importState.step === 'file-upload' && importState.selectedBroker && (
              <div className="space-y-6">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  onClick={resetImport}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Brokers
                </Button>

                {/* Selected Broker Info */}
                <Card className="border-0 shadow-none bg-white dark:bg-[#171717]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {importState.selectedBroker.icon.startsWith('/') ? (
                          <div className="w-16 h-16 flex items-center justify-center">
                            <Image
                              src={importState.selectedBroker.icon}
                              alt={`${importState.selectedBroker.name} logo`}
                              width={['ninjatrader', 'tradovate', 'robinhood', 'tdameritrade', 'mt5', 'interactivebrokers'].includes(importState.selectedBroker.id) ? 72 : 64}
                              height={['ninjatrader', 'tradovate', 'robinhood', 'tdameritrade', 'mt5', 'interactivebrokers'].includes(importState.selectedBroker.id) ? 72 : 64}
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center text-white shadow-lg", importState.selectedBroker.color)}>
                            <span className="text-2xl">{importState.selectedBroker.icon}</span>
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl">{importState.selectedBroker.name}</CardTitle>
                          <p className="text-gray-600 dark:text-gray-400">
                            Upload your {importState.selectedBroker.csvFormat} file
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                        Smart Detection Enabled
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Upload Area */}
                <Card className="border-0 shadow-none bg-white dark:bg-[#171717]">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Upload CSV File</span>
                      {isProcessing && <Clock className="w-4 h-4 animate-spin text-blue-500" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                        isProcessing 
                          ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-gray-300 dark:border-[#2a2a2a] hover:border-purple-400 dark:hover:border-purple-500"
                      )}
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onClick={() => !isProcessing && document.getElementById('file-upload')?.click()}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        {isProcessing ? (
                          <Clock className="w-8 h-8 text-blue-500 animate-spin" />
                        ) : (
                          <FileText className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {isProcessing ? 'Processing your CSV...' : 'Drop your CSV file here'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {isProcessing ? 'Extracting trade data intelligently' : 'or click to browse files'}
                      </p>
                      
                      {!isProcessing && (
                        <>
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            multiple={false}
                          />
                          <Button 
                            type="button"
                            className="bg-purple-600 hover:bg-purple-700 text-white pointer-events-none"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose CSV File
                          </Button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Supports: .csv files up to 10MB
                          </p>
                        </>
                      )}
                    </div>

                    {/* Smart Detection Info */}
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Our smart detection system will automatically identify your broker's CSV format and map the fields. 
                        If auto-detection fails, you'll be guided through manual field mapping.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Advanced Features */}
                <Card className="border-0 shadow-none bg-white dark:bg-[#171717]">
                  <CardHeader>
                    <CardTitle>Advanced Import Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-green-800 dark:text-green-200">Smart Detection</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Automatic broker format detection
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">Intelligent Extraction</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Human-level understanding of data patterns
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200">Zero Configuration</h4>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          No manual field mapping ever needed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Field Mapping Step - Removed for broker-specific detection system */}

            {/* Processing Step */}
            {importState.step === 'processing' && (
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Processing Your Trades
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Analyzing and extracting trade data from your CSV...
                  </p>
                </div>
              </div>
            )}

            {/* Results Step */}
            {importState.step === 'results' && importState.importResults && (
              <div className="space-y-6">
                <Button
                  variant="ghost"
                  onClick={resetImport}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Import Another File
                </Button>

                {importState.importResults.success ? (
                  <Card className="border-0 shadow-none bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div>
                          <CardTitle className="text-green-800 dark:text-green-200">
                            Import Successful!
                          </CardTitle>
                          <p className="text-green-600 dark:text-green-400">
                            Successfully imported {importState.importResults.trades.length} trades
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-white dark:bg-[#171717] rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {importState.importResults.trades.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Trades Imported</div>
                          </div>
                          <div className="text-center p-4 bg-white dark:bg-[#171717] rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {importState.importResults.warnings.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
                          </div>
                          <div className="text-center p-4 bg-white dark:bg-[#171717] rounded-lg">
                            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                              0
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => router.push('/dashboard')}
                          >
                            View Dashboard
                          </Button>
                          <Button variant="outline" onClick={resetImport}>
                            Import More Data
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-none bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <div>
                          <CardTitle className="text-red-800 dark:text-red-200">
                            Import Failed
                          </CardTitle>
                          <p className="text-red-600 dark:text-red-400">
                            There were errors processing your CSV file
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {importState.importResults.errors.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {importState.importResults.errors.map((error, index) => (
                                <li key={index} className="text-red-600 dark:text-red-400 text-sm">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex space-x-3">
                          <Button onClick={goBackToUpload} variant="outline">
                            Try Again
                          </Button>
                          <Button onClick={resetImport}>
                            Choose Different Broker
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
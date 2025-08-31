'use client'

import { useRef, useState, useMemo } from 'react'

import { Search, Plus, Upload, FileText, Clock, Filter, ChevronDown, Check, AlertCircle, ArrowLeft, Globe, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrdersIcon } from '@/components/ui/custom-icons'
import {
  Root as DropdownMenu,
  Content as DropdownMenuContent,
  Item as DropdownMenuItem,
  Separator as DropdownMenuSeparator,
  Trigger as DropdownMenuTrigger,
} from '@/components/ui/fancy-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/fancy-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as Notification from '@/components/ui/notification'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/use-page-title'
import { useRouter } from 'next/navigation'
import { Trade } from '@/services/trade-data.service'
import { DataStore } from '@/services/data-store.service'
import { CSVImportService } from '@/services/csv-import.service'
import { accountService } from '@/services/account.service'
import * as FileUpload from '@/components/ui/file-upload'
import { TIMEZONE_REGIONS, ALL_TIMEZONES, getCurrentTimezone, getBrokerTimezoneDefault, formatTimezoneOffset } from '@/utils/timezones'

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
  const isImportingRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  // Determine user's local timezone as default (fallback to UTC)
  const localTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }, [])
  const [selectedDateFormat, setSelectedDateFormat] = useState('MM/DD/YYYY')
  const [selectedTimezone, setSelectedTimezone] = useState<number>(() => getCurrentTimezone().value)
  // Local toasts
  const [toasts, setToasts] = useState<Array<{
    id: string
    status: 'success' | 'warning' | 'error' | 'information' | 'feature' | 'default'
    title: string
    description?: string
  }>>([])
  const addToast = (
    status: 'success' | 'warning' | 'error' | 'information' | 'feature' | 'default',
    title: string,
    description?: string,
  ) => {
    setToasts(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2), status, title, description },
    ])
  }
  const [importState, setImportState] = useState<ImportState>({
    step: 'broker-selection',
    selectedBroker: null,
    uploadedFile: null,
    csvAnalysis: null,
    fieldMapping: {},
    importResults: null
  })

  // ----- Strict header validation for Tradovate Performance.csv -----
  const expectedTradovatePerfHeaders = [
    'symbol','_priceFormat','_priceFormatType','_tickSize','buyFillId','sellFillId','qty','buyPrice','sellPrice','pnl','boughtTimestamp','soldTimestamp','duration'
  ]

  const getFileFirstLine = async (file: File): Promise<string> => {
    const text = await file.text()
    const first = text.split(/\r?\n/)[0] || ''
    return first.trim()
  }

  const parseSimpleCSVHeader = (line: string): string[] => {
    return line.split(',').map(h => h.trim())
  }

  // Robust CSV header parsing that handles quotes and embedded commas
  const parseCsvHeaderAdvanced = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const validateTradovatePerformanceHeaders = async (file: File): Promise<boolean> => {
    try {
      const headerLine = await getFileFirstLine(file)
      // Use advanced parser to handle quotes/commas
      const headers = parseCsvHeaderAdvanced(headerLine)
      // Normalize: lowercase and remove spaces for flexible matching
      const normalized = headers.map(h => h.replace(/\s+/g, '').toLowerCase())
      const has = (name: string) => normalized.includes(name.replace(/\s+/g, '').toLowerCase())
      // Minimal required fields for Performance.csv
      const required = ['symbol', 'pnl', 'boughtTimestamp']
      const ok = required.every(r => has(r))
      return ok
    } catch {
      return false
    }
  }

  // ----- Timezone helper (compute offset for local time zone) -----

  const getOffsetMinutes = (timeZone: string): number => {
    try {
      const now = new Date()
      // Format the date in the given timeZone and UTC, then compute offset
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      const utcFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      const parse = (s: string) => {
        const m = s.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/)
        if (!m) return now.getTime()
        const [, mm, dd, yyyy, HH, MM, SS] = m
        return Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(HH), Number(MM), Number(SS))
      }
      const tzStr = tzFormatter.format(now)
      const utcStr = utcFormatter.format(now)
      const tzUTCms = parse(tzStr)
      const utcUTCms = parse(utcStr)
      return Math.round((tzUTCms - utcUTCms) / 60000)
    } catch {
      return 0
    }
  }

  // (No UI for timezone; offset is computed automatically from localTimeZone)

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
    // Redirect to the upload page with broker info as URL parameters
    const params = new URLSearchParams({
      brokerId: broker.id,
      brokerName: broker.name,
      brokerIcon: broker.icon
    })
    router.push(`/upload?${params.toString()}`)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const handleFileDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
  }

  const processFile = async (file: File) => {
    console.log('🚀 Processing file with AI:', file.name, file.type, file.size)

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      addToast('warning', 'Invalid file type', 'Please select a CSV file (.csv extension required).')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast('warning', 'File too large', 'Please select a file smaller than 10MB.')
      return
    }
    // Re-entrancy guard: avoid duplicate processing if already in-flight
    if (isImportingRef.current) {
      console.warn('⚠️ Duplicate import trigger ignored (import already in progress):', file.name)
      return
    }
    isImportingRef.current = true
    setIsProcessing(true)
    
    try {
      console.log('📊 Starting broker-specific CSV processing...')
      // Enforce strict acceptance when Tradovate is selected: only Performance.csv schema
      if (importState.selectedBroker?.id === 'tradovate') {
        const ok = await validateTradovatePerformanceHeaders(file)
        if (!ok) {
          addToast('warning', 'Invalid Tradovate CSV', 'Only Tradovate Performance.csv with the exact columns is accepted on this form.')
          return
        }
      }
      
      // Use the CSV import service to process the file
      const result = await CSVImportService.importCSV(
        file,
        importState.selectedBroker?.id,
        undefined,
        {
          preferredDateFormat: selectedDateFormat,
          timezoneOffsetMinutes: selectedTimezone
        }
      )
      
      console.log('📄 Import result:', result)

      // Surface warnings/errors as toasts for visibility (e.g., auto-switched broker)
      if (Array.isArray(result.warnings) && result.warnings.length > 0) {
        result.warnings.forEach(w => addToast('warning', 'Import warning', w))
      }
      if (!result.success && Array.isArray(result.errors) && result.errors.length > 0) {
        addToast('error', 'Import issues', result.errors[0])
      }

      if (result.success && result.trades.length > 0) {
        // Create a new trading account with default values
        const balance = 10000 // Default starting balance
        const detectedBrokerName = (result as any)?.metadata?.broker as string | undefined
        const brokerDisplayName = detectedBrokerName || importState.selectedBroker?.name || 'Unknown Broker'
        const defaultAccountName = `${brokerDisplayName} Account`
        
        const newAccount = await accountService.createAccount(
          defaultAccountName,
          brokerDisplayName,
          result.trades,
          balance,
          importState.selectedBroker?.icon,
          `Imported from ${brokerDisplayName} CSV on ${new Date().toLocaleDateString()}`
        )
        
        // Switch to the new account (this will update DataStore)
        await accountService.switchToAccount(newAccount.id)
        
        console.log('🔄 Created new account and prepared analytics data...')
        addToast('success', 'Import complete', `Imported ${result.trades.length} trade${result.trades.length !== 1 ? 's' : ''}.`)
      }
      else if (result.success && result.trades.length === 0) {
        addToast('information', 'No trades imported', 'No valid rows were found in the CSV.')
      }
      
      setImportState(prev => ({
        ...prev,
        uploadedFile: file,
        step: 'results',
        importResults: {
          success: result.success,
          trades: result.trades,
          errors: result.errors,
          warnings: result.warnings
        }
      }))
      
    } catch (error) {
      console.error('❌ CSV processing failed:', error)
      addToast('error', 'CSV processing failed', 'Please check the file format and try again.')
      
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
      isImportingRef.current = false
    }
  }
  
  const handleFieldMappingComplete = async (mapping: Record<string, string>) => {
    if (!importState.uploadedFile) return
    
    // Prevent duplicate imports if one is already in progress
    if (isImportingRef.current) {
      console.warn('⚠️ Duplicate field-mapping import trigger ignored')
      return
    }
    isImportingRef.current = true
    setIsProcessing(true)
    setImportState(prev => ({ ...prev, step: 'processing', fieldMapping: mapping }))
    
    try {
      // Enforce strict acceptance when Tradovate is selected even in mapping flow
      if (importState.selectedBroker?.id === 'tradovate') {
        const ok = await validateTradovatePerformanceHeaders(importState.uploadedFile)
        if (!ok) {
          addToast('warning', 'Invalid Tradovate CSV', 'Only Tradovate Performance.csv with the exact columns is accepted on this form.')
          setIsProcessing(false)
          isImportingRef.current = false
          return
        }
      }
      const result = await CSVImportService.importCSV(
        importState.uploadedFile,
        importState.selectedBroker?.id,
        mapping,
        {
          preferredDateFormat: selectedDateFormat,
          timezoneOffsetMinutes: selectedTimezone
        }
      )
      // Surface warnings/errors as toasts when running via field-mapping flow
      if (Array.isArray(result.warnings) && result.warnings.length > 0) {
        result.warnings.forEach(w => addToast('warning', 'Import warning', w))
      }
      if (!result.success && Array.isArray(result.errors) && result.errors.length > 0) {
        addToast('error', 'Import issues', result.errors[0])
      }
      
      await processImport(
        result.trades,
        10000, // Default starting balance
        (result as any)?.metadata?.broker as string | undefined
      )
      
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
      isImportingRef.current = false
    }
  }
  
  const processImport = async (trades: Partial<Trade>[], balance?: number, brokerNameOverride?: string) => {
    try {
      // Create a new trading account with default values
      const actualBalance = balance || 10000
      const brokerDisplayName = brokerNameOverride || importState.selectedBroker?.name || 'Unknown Broker'
      const defaultAccountName = `${brokerDisplayName} Account`
      
      const newAccount = await accountService.createAccount(
        defaultAccountName,
        brokerDisplayName,
        trades as Trade[],
        actualBalance,
        importState.selectedBroker?.icon,
        `Imported from ${brokerDisplayName} CSV on ${new Date().toLocaleDateString()}`
      )
      
      // Switch to the new account (this will update DataStore)
      await accountService.switchToAccount(newAccount.id)
      
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setImportState(prev => ({
        ...prev,
        step: 'results',
        importResults: {
          success: true,
          trades,
          errors: [],
          warnings: [`Successfully imported ${trades.length} trades and created account "${newAccount.name}"`]
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
    setIsProcessing(false)
    setSelectedDateFormat('MM/DD/YYYY')
    setSelectedTimezone(getCurrentTimezone().value)
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-3 relative flex items-center justify-between">
        <button className="p-1" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button className="p-1" onClick={() => router.push('/dashboard')}>
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-semibold">U</span>
          </div>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            Welcome, User
          </h2>
          <p className="text-2xl font-semibold max-w-md mx-auto bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
            To start analyzing, please import your trading data.
          </p>
        </div>

            {/* Import Steps */}
            {importState.step === 'broker-selection' && (
              <>

            {/* Specialty Brokers Section */}
            {popularBrokers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold">Specialty Brokers</h2>
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    {popularBrokers.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {popularBrokers.map((broker) => (
                          <div
                            key={broker.id}
                            onClick={() => handleBrokerSelect(broker)}
                            className="p-4 rounded-lg bg-white dark:bg-[#171717] cursor-pointer group relative shadow-sm"
                          >
                            {/* Link icon for Tradovate and NinjaTrader */}
                            {(broker.id === 'tradovate' || broker.id === 'ninjatrader') && (
                              <div className="absolute top-3 right-3 group/tooltip cursor-help" onClick={(e) => e.stopPropagation()}>
                                <div className="absolute -top-8 -right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  This broker supports Auto Sync
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                    <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#4F7DFF" />
                                      <stop offset="50%" stopColor="#8B5CF6" />
                                      <stop offset="100%" stopColor="#F6B51E" />
                                    </linearGradient>
                                  </defs>
                                  <path d="M10.5217 13.4798C11.2884 14.2466 12.3286 14.6779 13.4135 14.6788C13.7721 14.6738 14.1291 14.6281 14.4774 14.5426C15.1679 14.3509 15.7974 13.9849 16.3052 13.4798L17.2737 12.5125L20.1517 9.62398C20.8746 8.84914 21.2681 7.82429 21.2494 6.76536C21.2307 5.70643 20.8012 4.69609 20.0515 3.94719C19.3017 3.1983 18.2903 2.76932 17.2301 2.75064C16.17 2.73195 15.144 3.12502 14.3683 3.84703L11.4902 6.73551" stroke="url(#linkGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M12.4449 17.3357L9.55321 20.2241C8.77213 20.9143 7.75675 21.2805 6.71446 21.248C5.67216 21.2155 4.68161 20.7868 3.94511 20.0494C3.20861 19.312 2.78174 18.3215 2.75169 17.2803C2.72163 16.2391 3.09066 15.2258 3.7834 14.4472L6.67512 11.5587L7.64358 10.5913C8.1514 10.0862 8.78087 9.72024 9.47137 9.52861C10.1661 9.34294 10.8975 9.34342 11.5919 9.52999C12.2864 9.71656 12.9193 10.0826 13.427 10.5913" stroke="url(#linkGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
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
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white", broker.color)}>
                                  <span className="text-xl">{broker.icon}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                                    {broker.name}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-600" />
                                  <span className="text-xs text-gray-600 font-medium">
                                    {broker.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                              {broker.description}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-gray-300"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import
                            </Button>
                          </div>
                        ))}
                      </div>
              </div>
            )}

            {/* Traditional & Mobile Brokers Section */}
            {otherBrokers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold">Traditional & Mobile Brokers</h2>
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    {otherBrokers.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherBrokers.map((broker) => (
                          <div
                            key={broker.id}
                            onClick={() => handleBrokerSelect(broker)}
                            className="p-4 rounded-lg bg-white dark:bg-[#171717] cursor-pointer group"
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
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white", broker.color)}>
                                  <span className="text-xl">{broker.icon}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">
                                    {broker.name}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-600" />
                                  <span className="text-xs text-gray-600 font-medium">
                                    {broker.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                              {broker.description}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 dark:border-[#2a2a2a] dark:bg-[#171717] dark:text-gray-300"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
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
                          <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center text-white", importState.selectedBroker.color)}>
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
                    {/* Import Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 justify-items-center">
                      <div className="space-y-2 w-full max-w-sm text-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Date Format
                        </label>
                        <Select value={selectedDateFormat} onValueChange={setSelectedDateFormat}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent noScroll>
                            <SelectGroup>
                              <SelectLabel>Common</SelectLabel>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY — 04/27/2025</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY — 27/04/2025</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD — 2025-04-27 (ISO)</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Regional</SelectLabel>
                              <SelectItem value="DD.MM.YYYY">DD.MM.YYYY — 27.04.2025 (German)</SelectItem>
                              <SelectItem value="YYYY/MM/DD">YYYY/MM/DD — 2025/04/27</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Variants</SelectLabel>
                              <SelectItem value="MM-DD-YYYY">MM-DD-YYYY — 04-27-2025</SelectItem>
                              <SelectItem value="DD-MM-YYYY">DD-MM-YYYY — 27-04-2025</SelectItem>
                              <SelectItem value="MM.DD.YYYY">MM.DD.YYYY — 04.27.2025</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 w-full max-w-sm text-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                          <Globe className="w-4 h-4" />
                          CSV Timezone
                        </label>
                        <Select 
                          value={selectedTimezone.toString()} 
                          onValueChange={(value) => setSelectedTimezone(parseInt(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {Object.entries(TIMEZONE_REGIONS).map(([region, timezones]) => (
                              <SelectGroup key={region}>
                                <SelectLabel>{region}</SelectLabel>
                                {timezones.map((tz) => (
                                  <SelectItem key={`${tz.region}-${tz.value}`} value={tz.value.toString()}>
                                    {tz.label} ({formatTimezoneOffset(tz.value)})
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Timezone of timestamps in your CSV file
                        </p>
                      </div>
                    </div>

                    <FileUpload.Root
                      className={cn(
                        isProcessing && "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                      )}
                      htmlFor="file-upload"
                      onDrop={(e: React.DragEvent<HTMLLabelElement>) => handleFileDrop(e)}
                      onDragOver={(e: React.DragEvent<HTMLLabelElement>) => handleDragOver(e)}
                      onDragEnter={(e: React.DragEvent<HTMLLabelElement>) => handleDragOver(e)}
                    >
                      {isProcessing ? (
                        <Clock className="w-8 h-8 text-blue-500 animate-spin" />
                      ) : (
                        <FileUpload.Icon 
                          as="svg"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-8 h-8"
                        >
                          <path d="M12 12.5858L16.2426 16.8284L14.8284 18.2426L13 16.415V22H11V16.413L9.17157 18.2426L7.75736 16.8284L12 12.5858ZM12 2C15.5934 2 18.5544 4.70761 18.9541 8.19395C21.2858 8.83154 23 10.9656 23 13.5C23 16.3688 20.8036 18.7246 18.0006 18.9776L18.0009 16.9644C19.6966 16.7214 21 15.2629 21 13.5C21 11.567 19.433 10 17.5 10C17.2912 10 17.0867 10.0183 16.8887 10.054C16.9616 9.7142 17 9.36158 17 9C17 6.23858 14.7614 4 12 4C9.23858 4 7 6.23858 7 9C7 9.36158 7.03838 9.7142 7.11205 10.0533C6.91331 10.0183 6.70879 10 6.5 10C4.567 10 3 11.567 3 13.5C3 15.2003 4.21241 16.6174 5.81986 16.934L6.00005 16.9646L6.00039 18.9776C3.19696 18.7252 1 16.3692 1 13.5C1 10.9656 2.71424 8.83154 5.04648 8.19411C5.44561 4.70761 8.40661 2 12 2Z"></path>
                        </FileUpload.Icon>
                      )}
                      
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {isProcessing ? 'Processing your CSV...' : 'Drop your CSV file here'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {isProcessing ? 'Extracting trade data and preparing analytics...' : 'or click to browse files'}
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
                            <FileUpload.Button>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose CSV File
                            </FileUpload.Button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Supports: .csv files up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                    </FileUpload.Root>

                  </CardContent>
                </Card>
              </div>
            )}
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
                    Analyzing CSV data and preparing all analytics...
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
                  <div className="max-w-md mx-auto">
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-8 text-center border-0 shadow-none">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <OrdersIcon className="text-green-600 dark:text-green-400" size={32} />
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Import Complete
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Successfully imported <span className="font-medium text-green-600 dark:text-green-400">{importState.importResults.trades.length} trades</span> and prepared all analytics data
                      </p>
                      
                      <div className="flex flex-col space-y-3">
                        <Button 
                          className="w-full bg-[#3559E9] hover:bg-[#2947d1] text-white"
                          onClick={() => router.push('/account')}
                        >
                          Go to Account Management
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={resetImport}
                          className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          Import More Data
                        </Button>
                      </div>
                    </div>
                  </div>
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
        {/* Notifications */}
        <Notification.Provider swipeDirection="right">
          {toasts.map((t) => (
            <Notification.Root
              key={t.id}
              status={t.status}
              variant={t.status === 'success' ? 'filled' : 'soft'}
              duration={3000}
              title={t.title}
              description={t.description}
              onOpenChange={(open) => {
                if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }}
              open
            />
          ))}
          <Notification.Viewport />
        </Notification.Provider>
      </div>
    </div>
  )
}
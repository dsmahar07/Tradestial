'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { userProfileService, UserProfile } from '@/services/user-profile.service'

import { Search, Plus, Upload, FileText, Clock, Filter, ChevronDown, Check, AlertCircle, ArrowLeft, Globe, X, ExternalLink } from 'lucide-react'
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
import { useToast } from '@/components/ui/notification-toast'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/use-page-title'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'

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
    icon: '/brokers-logo/Ninjatrader.png',
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
    icon: '/brokers-logo/Ibkr.png',
    category: 'Forex',
    color: 'bg-blue-600',
    csvFormat: 'IBKR Flex Query Report',
    autoSync: true
  },
  {
    id: 'tradovate',
    name: 'Tradovate',
    description: 'Connect to Tradovate for real-time futures trading data and performance tracking.',
    icon: '/brokers-logo/Tradovate.png',
    category: 'Futures',
    color: 'bg-purple-600',
    csvFormat: 'Tradovate Export CSV',
    autoSync: true
  },
  {
    id: 'tradestation',
    name: 'TradeStation',
    description: 'Import your TradeStation account data and trading history seamlessly.',
    icon: '/brokers-logo/Tradestation.png',
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
    icon: '/brokers-logo/Charles_Schwab.Logo.png',
    category: 'Traditional',
    color: 'bg-blue-500',
    csvFormat: 'Schwab Export CSV',
    autoSync: false
  },
  {
    id: 'etrade',
    name: 'E*TRADE',
    description: 'Import your E*TRADE trading history and account performance data.',
    icon: '/brokers-logo/E-Trade-Logo.png',
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
    icon: '/brokers-logo/Robinhood.png',
    category: 'Mobile',
    color: 'bg-green-500',
    csvFormat: 'Robinhood Account Statement',
    autoSync: false
  },
  {
    id: 'webull',
    name: 'Webull',
    description: 'Import your Webull trading data and access advanced analytics features.',
    icon: '/brokers-logo/webull.png',
    category: 'Mobile',
    color: 'bg-blue-400',
    csvFormat: 'Webull Trade History CSV',
    autoSync: false
  },
  {
    id: 'oanda',
    name: 'OANDA',
    description: 'Connect your OANDA account for comprehensive forex trading data and analytics.',
    icon: '/brokers-logo/osandabroker.png',
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
    icon: '/brokers-logo/Ampfutures.png',
    category: 'Futures',
    color: 'bg-orange-600',
    csvFormat: 'AMP Futures CSV Export',
    autoSync: true
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    description: 'Import your MT5 trading data and performance metrics from any broker supporting MT5.',
    icon: '/brokers-logo/Mt5.png',
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
    icon: '/brokers-logo/Tdameri.png',
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
    icon: '/brokers-logo/Binance.png',
    category: 'Crypto',
    color: 'bg-yellow-500',
    csvFormat: 'Binance Trade History CSV',
    autoSync: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    description: 'Import your Coinbase Pro cryptocurrency trading data and portfolio performance.',
    icon: '/brokers-logo/coinbase-logo.png',
    category: 'Crypto',
    color: 'bg-blue-500',
    csvFormat: 'Coinbase Pro CSV Export',
    autoSync: false
  },
  {
    id: 'kraken',
    name: 'Kraken',
    description: 'Connect your Kraken account for comprehensive crypto trading analytics.',
    icon: '/brokers-logo/Kraken-Logo.png',
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
    icon: '/brokers-logo/tradingview.png',
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
  step: 'broker-selection'
  selectedBroker: Broker | null
  uploadedFile: null
  csvAnalysis: null
  fieldMapping: {}
  importResults: null
}

export default function ImportDataPage() {
  usePageTitle('Import Data')
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false)
  const [selectedUnsupportedBroker, setSelectedUnsupportedBroker] = useState<Broker | null>(null)

  // Load user profile
  useEffect(() => {
    const profile = userProfileService.getUserProfile()
    setUserProfile(profile)
    
    // Listen for profile updates (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradestial_user_profile') {
        const updatedProfile = userProfileService.getUserProfile()
        setUserProfile(updatedProfile)
      }
    }
    
    // Listen for profile updates (same-tab)
    const handleProfileUpdate = (e: CustomEvent) => {
      setUserProfile(e.detail)
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

  // Force this route to always render in light mode
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const hadDarkHtml = html.classList.contains('dark')
    const hadDarkBody = body.classList.contains('dark')
    // Remove dark class so Tailwind dark: variants do not apply
    html.classList.remove('dark')
    body.classList.remove('dark')
    // Ensure color scheme stays light for form controls
    const prevHtmlScheme = html.style.colorScheme
    const prevBodyScheme = body.style.colorScheme
    html.style.colorScheme = 'light'
    body.style.colorScheme = 'light'

    return () => {
      // Restore previous state when navigating away
      if (hadDarkHtml) html.classList.add('dark')
      if (hadDarkBody) body.classList.add('dark')
      html.style.colorScheme = prevHtmlScheme
      body.style.colorScheme = prevBodyScheme
    }
  }, [])

  // Local toasts
  const { addToast } = useToast()
  const [importState, setImportState] = useState<ImportState>({
    step: 'broker-selection',
    selectedBroker: null,
    uploadedFile: null,
    csvAnalysis: null,
    fieldMapping: {},
    importResults: null
  })
  
  // Removed import processing functions - handled by upload page

  // Removed CSV validation functions - handled by upload page

  // Removed CSV parsing helpers - handled by upload page

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

  const isBrokerSupported = (brokerId: string) => {
    const supportedBrokers = ['tradovate', 'tradingview', 'ninjatrader']
    return supportedBrokers.includes(brokerId)
  }

  const handleBrokerSelect = (broker: Broker) => {
    // Check if broker is supported
    if (!isBrokerSupported(broker.id)) {
      setSelectedUnsupportedBroker(broker)
      setShowUnsupportedDialog(true)
      return
    }
    
    // Redirect to the upload page with broker info as URL parameters
    const params = new URLSearchParams({
      brokerId: broker.id,
      brokerName: broker.name,
      brokerIcon: broker.icon
    })
    router.push(`/upload?${params.toString()}`)
  }

  // Removed CSV import functionality - handled by upload page

  return (
    <div className="min-h-screen dark:text-gray-900 [color-scheme:light]" style={{ backgroundColor: '#f5f5f7' }} data-theme="light">
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg overflow-hidden">
            {userProfile?.profilePicture ? (
              <img 
                src={userProfile.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xl font-semibold">
                {userProfile?.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            Welcome, {userProfile?.fullName.split(' ')[0] || 'User'}
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
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {popularBrokers.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {popularBrokers.map((broker) => (
                          <div
                            key={broker.id}
                            onClick={() => handleBrokerSelect(broker)}
                            className="p-4 rounded-3xl bg-white cursor-pointer group relative shadow-sm"
                          >
                            {/* Coming Soon label for unsupported brokers */}
                            {!isBrokerSupported(broker.id) && (
                              <div className="absolute top-3 right-3 bg-[#E6A819]/30 text-yellow-900 text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center">
                                !
                              </div>
                            )}
                            
                            {/* Link icon for Tradovate and NinjaTrader */}
                            {(broker.id === 'tradovate' || broker.id === 'ninjatrader') && (
                              <div className="absolute top-3 right-3 group/tooltip cursor-help" onClick={(e) => e.stopPropagation()}>
                                <div className="absolute -top-8 -right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
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
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                              {broker.description}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {otherBrokers.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherBrokers.map((broker) => (
                          <div
                            key={broker.id}
                            onClick={() => handleBrokerSelect(broker)}
                            className="p-4 rounded-3xl bg-white cursor-pointer group relative"
                          >
                            {/* Coming Soon label for unsupported brokers */}
                            {!isBrokerSupported(broker.id) && (
                              <div className="absolute top-3 right-3 bg-[#E6A819]/30 text-yellow-900 text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center">
                                !
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
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                              {broker.description}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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

            {/* Removed file upload, processing, and results steps - handled by upload page */}
        {/* Toast notifications handled by useToast hook */}
      </div>
      
      {/* Unsupported Broker Dialog */}
      <Dialog.Root open={showUnsupportedDialog} onOpenChange={setShowUnsupportedDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Broker Not Yet Supported
            </Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-6">
              We don't currently support <strong>{selectedUnsupportedBroker?.name}</strong> CSV imports, but we'd love to add support for your broker!
              <br /><br />
              Please reach out to us on Discord and we'll work on adding support for {selectedUnsupportedBroker?.name} as soon as possible.
            </Dialog.Description>
            
            <div className="flex flex-col gap-3">
              <a
                href="https://discord.gg/7jsfc6RAmX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Join Our Discord
              </a>
              
              <Dialog.Close asChild>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
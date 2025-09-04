'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useToast } from '@/components/ui/notification-toast'
import { ArrowLeft, X, Play, Check, ChevronDown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { CSVImportService } from '@/services/csv-import.service'
import { accountService } from '@/services/account.service'
import { Trade } from '@/services/trade-data.service'
import { TIMEZONE_REGIONS, getCurrentTimezone, getBrokerTimezoneDefault, formatTimezoneOffset, ALL_TIMEZONES } from '@/utils/timezones'

export default function UploadPage() {
  usePageTitle('Add Trades')
  const router = useRouter()
  const searchParams = useSearchParams()
  const isImportingRef = useRef(false)
  const { success: toastSuccess, error: toastError, warning: toastWarning, ToastContainer } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTimezone, setSelectedTimezone] = useState<number>(() => {
    const brokerId = searchParams.get('brokerId') || 'tradovate'
    return getBrokerTimezoneDefault(brokerId)
  })

  // Get broker info from URL params or default to Tradovate
  const selectedBroker = useMemo(() => {
    const brokerId = searchParams.get('brokerId') || 'tradovate'
    const brokerName = searchParams.get('brokerName') || 'Tradovate'
    const brokerIcon = searchParams.get('brokerIcon') || '/Brokers Logo/Tradovate.png'
    
    return {
      id: brokerId,
      name: brokerName,
      icon: brokerIcon
    }
  }, [searchParams])

  // Set broker-specific timezone when broker changes
  useEffect(() => {
    if (selectedBroker?.id) {
      const brokerTimezone = getBrokerTimezoneDefault(selectedBroker.id)
      if (!isNaN(brokerTimezone)) {
        setSelectedTimezone(brokerTimezone)
      }
    }
  }, [selectedBroker])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toastWarning('Invalid file type', 'Please select a .csv file')
      return
    }

    setIsProcessing(true)
    
    try {
      // Validate timezone offset before processing
      if (isNaN(selectedTimezone)) {
        toastWarning('Invalid timezone', 'Please select a valid timezone before uploading')
        setIsProcessing(false)
        return
      }

      // Use the CSV import service to process the file with timezone settings
      const result = await CSVImportService.importCSV(
        file,
        selectedBroker.id,
        undefined, // accountId - not needed for new imports
        {
          timezoneOffsetMinutes: selectedTimezone
        }
      )
      
      if (result.success && result.trades.length > 0) {
        // Create a new trading account
        const newAccount = await accountService.createAccount(
          `${selectedBroker.name} Account`,
          selectedBroker.name,
          result.trades,
          10000,
          selectedBroker.icon,
          `Imported from ${selectedBroker.name} CSV on ${new Date().toLocaleDateString()}`
        )
        
        // Switch to the new account
        await accountService.switchToAccount(newAccount.id)
        
        // Redirect to account page
        router.push('/account')
        toastSuccess('Import complete', `Imported ${result.trades.length} trade${result.trades.length !== 1 ? 's' : ''}.`)
      } else {
        const errorMessage = result.errors && result.errors.length > 0 
          ? `Import failed: ${result.errors.join(', ')}` 
          : 'Failed to import trades. Please check your CSV format.'
        toastError('CSV import failed', errorMessage)
      }
      
    } catch (error) {
      toastError('Failed to process CSV file', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />
      {/* Header */}
      <div className="max-w-5xl mx-auto px-5 py-5 mb-16 relative flex items-center justify-between">
        <button className="p-1" onClick={() => router.push('/import-data')}>
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-3 text-center">
          <div className="text-base md:text-lg text-[#636A9D] font-semibold">Add Trades</div>
          <div className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">Upload file</div>
        </div>
        <button className="p-1" onClick={() => router.push('/import-data')}>
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>


      {/* Main Content */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 px-5 pb-14">
        {/* Left Side - Upload */}
        <div className="p-6 rounded-lg bg-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-[#636A9D]">Upload your file</h2>
              <span className="px-3 py-1.5 text-white text-sm rounded-full font-medium bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]">
                Takes less than 2 min
              </span>
            </div>

            {/* Time zone */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                <label className="text-sm font-medium text-[#636A9D]">Time zone</label>
                <div className="w-3 h-3 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-white text-xs">i</span>
                </div>
              </div>
              
              {/* Custom Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors flex items-center justify-between shadow-sm"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="text-gray-900">
                    {(() => {
                      const selectedTz = ALL_TIMEZONES.find(tz => tz.value === selectedTimezone)
                      return selectedTz ? `${formatTimezoneOffset(selectedTz.value)} ${selectedTz.label}` : 'Select timezone'
                    })()}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {ALL_TIMEZONES
                      .sort((a, b) => a.value - b.value)
                      .map((tz, index) => (
                        <button
                          key={`${tz.label}-${index}`}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:bg-purple-100 transition-colors border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setSelectedTimezone(tz.value)
                            setIsDropdownOpen(false)
                          }}
                        >
                          {formatTimezoneOffset(tz.value)} {tz.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Please select the file time zone. Note that if you want to see data in the application in a 
                different time zone please update it in your <span className="text-blue-600 underline">settings</span>
              </p>
            </div>

            {/* Warning */}
            {selectedBroker.id === 'tradingview' ? (
              <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded">
                <div className="w-5 h-5 rounded bg-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">!</span>
                </div>
                <p className="text-sm text-orange-800">
                  <strong>Duration Limitation:</strong> Sorry for the inconvenience - TradingView CSV imports have limited trade duration data 
                  as the CSV format doesn't contain proper entry/exit time columns. Only trade close times 
                  are available, which may affect duration-based analytics.
                </p>
              </div>
            ) : (
              <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded">
                <div className="w-5 h-5 rounded bg-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">!</span>
                </div>
                <p className="text-sm text-orange-800">
                  This import has limitations. Please review the details by clicking on 
                  this message. You'll find crucial information that may impact your 
                  import.
                </p>
              </div>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center bg-white transition-all duration-300 cursor-pointer ${
                isDragOver 
                  ? 'border-purple-400 bg-purple-50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
              }`}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => { if (!isProcessing) fileInputRef.current?.click() }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (!isProcessing && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fileInputRef.current?.click() } }}
            >
              {isProcessing ? (
                <div className="w-16 h-16 mx-auto mb-6 text-purple-600">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto mb-6 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M14.186 2.75293V6.3487C14.186 6.83643 14.3805 7.30418 14.7267 7.64905C15.0729 7.99393 15.5424 8.18768 16.032 8.18768H20.157" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.25 8.56776V17.136C20.23 17.696 20.0995 18.2466 19.8658 18.7563C19.632 19.266 19.2998 19.7248 18.8879 20.1065C18.4761 20.4881 17.9927 20.7852 17.4656 20.9806C16.9384 21.176 16.3777 21.266 15.8156 21.2454H8.22563C7.66013 21.2716 7.09505 21.1857 6.5631 20.9928C6.03115 20.7999 5.54291 20.5037 5.12664 20.1215C4.71037 19.7393 4.37436 19.2786 4.13805 18.7662C3.90175 18.2537 3.76985 17.6996 3.75 17.136V6.86233C3.76995 6.30232 3.90052 5.75172 4.13424 5.24201C4.36795 4.73231 4.70024 4.2735 5.11208 3.89184C5.52393 3.51017 6.00726 3.21313 6.53443 3.01769C7.0616 2.82226 7.62227 2.73228 8.18438 2.75288H13.8975C14.7704 2.74996 15.6128 3.07246 16.2591 3.65696L19.2188 6.37947C19.5351 6.65177 19.7904 6.98732 19.9681 7.36432C20.1457 7.74132 20.2418 8.15135 20.25 8.56776Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 10.4988L12 17.2727" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
                    <path d="M15.1064 13.3506L12.4411 10.6853C12.3834 10.6271 12.3147 10.5808 12.239 10.5493C12.1633 10.5177 12.0821 10.5015 12.0001 10.5015C11.918 10.5015 11.8368 10.5177 11.7611 10.5493C11.6854 10.5808 11.6167 10.6271 11.559 10.6853L8.89367 13.3506" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isProcessing ? 'Processing your file...' : (
                      <>
                        Drag & drop <span className="bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">CSV files</span>,<br />
                        <span className="bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">trading data</span>, or any <span className="bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">file</span>
                      </>
                    )}
                  </h3>
                  {!isProcessing && (
                    <p className="text-gray-500">
                      or <button className="text-purple-600 hover:text-purple-700 font-medium underline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>browse files</button> on your computer
                    </p>
                  )}
                </div>
                
                {!isProcessing && (
                  <>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" id="file-upload" onChange={handleFileUpload} />
                    <button 
                      className="px-8 py-3 bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] text-white font-medium rounded-full hover:opacity-90 transition-opacity duration-200"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    >
                      Upload
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Dynamic Broker Info */}
        <div className="p-6 rounded-lg bg-white">
          <div className="flex items-center space-x-2 mb-4">
            {selectedBroker.icon.startsWith('/') ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  src={selectedBroker.icon}
                  alt={`${selectedBroker.name} logo`}
                  className="w-10 h-10 object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 text-blue-500 flex items-center justify-center">
                <span className="text-2xl">{selectedBroker.icon}</span>
              </div>
            )}
            <h2 className="text-lg font-bold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">{selectedBroker.name}</h2>
          </div>

          <div className="space-y-4">
            {/* Supported Asset Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Supported Asset Types:</h4>
              <div className="flex items-center gap-4 flex-wrap">
                {(() => {
                  const getAssetTypes = (brokerId: string) => {
                    switch (brokerId) {
                      case 'tradingview':
                        return ['Futures', 'Forex']
                      case 'binance':
                        return ['Crypto', 'Futures']
                      case 'coinbase':
                        return ['Crypto']
                      case 'kraken':
                        return ['Crypto']
                      case 'bybit':
                        return ['Crypto', 'Derivatives']
                      case 'deribit':
                        return ['Crypto', 'Options', 'Futures']
                      case 'tradovate':
                        return ['Futures']
                      case 'ninjatrader':
                        return ['Futures', 'Forex', 'Stocks']
                      case 'interactivebrokers':
                        return ['Stocks', 'Options', 'Futures', 'Forex']
                      case 'thinkorswim':
                        return ['Stocks', 'Options', 'Futures', 'Forex']
                      case 'tdameritrade':
                        return ['Stocks', 'Options', 'Futures', 'Forex']
                      case 'webull':
                        return ['Stocks', 'Options', 'Crypto']
                      case 'robinhood':
                        return ['Stocks', 'Options', 'Crypto']
                      case 'etrade':
                        return ['Stocks', 'Options', 'Futures']
                      case 'schwab':
                        return ['Stocks', 'Options', 'Futures', 'Forex']
                      case 'fidelity':
                        return ['Stocks', 'Options', 'Futures']
                      case 'tastyworks':
                        return ['Stocks', 'Options']
                      case 'tradestation':
                        return ['Stocks', 'Options', 'Futures', 'Forex']
                      case 'alpaca':
                        return ['Stocks', 'Crypto']
                      case 'oanda':
                        return ['Forex']
                      case 'forex':
                        return ['Forex']
                      case 'mt4':
                        return ['Forex', 'CFDs']
                      case 'mt5':
                        return ['Forex', 'CFDs', 'Stocks']
                      case 'ampfutures':
                        return ['Futures']
                      case 'plus500':
                        return ['CFDs', 'Forex']
                      case 'xtb':
                        return ['Forex', 'CFDs', 'Stocks']
                      case 'quantconnect':
                        return ['Stocks', 'Futures', 'Forex', 'Crypto']
                      default:
                        return ['Futures']
                    }
                  }
                  
                  return getAssetTypes(selectedBroker.id).map((assetType, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 font-medium">{assetType}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Integration Guide */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">How to import trades from {selectedBroker.name}</h4>
                <button className="flex items-center text-xs text-blue-600">
                  Integration Guide
                  <div className="ml-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">?</span>
                  </div>
                </button>
              </div>
              <p className="text-sm text-[#636A9D] font-semibold mb-3">
                To import data from {selectedBroker.name}, follow these steps:
              </p>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    In {selectedBroker.name}, navigate to your account section and locate the export or download option.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    Select the date range for the trades you want to export.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    Choose CSV format and download the file.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p className="text-sm text-[#636A9D] font-semibold">
                    Upload the downloaded CSV file using the form on the left.
                  </p>
                </div>
              </div>

              <button className="text-xs text-blue-600 mt-2">
                Expand whole instructions ▼
              </button>
            </div>

            {/* Video */}
            <div className="relative bg-black/90 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5">
              <div className="aspect-video flex items-center justify-center">
                <button className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                </button>
              </div>
              <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded flex items-center space-x-2">
                <span>⏱ 3 min</span>
                <span>👁 9.97K views</span>
              </div>
              <div className="absolute bottom-2 right-2 text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded">
                1.2×
              </div>
              <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-1 py-0.5 rounded">
                3 min / 2 min 45 sec
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
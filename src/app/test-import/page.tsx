'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/use-page-title'
import { DataStore } from '@/services/data-store.service'
import { TradovateCsvParser } from '@/services/tradovate-csv-parser'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function TestImportPage() {
  usePageTitle('Test CSV Import')
  
  const [dataInfo, setDataInfo] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string>('')

  const refreshData = () => {
    setDataInfo(DataStore.getDataInfo())
  }

  const testTradovateImport = async () => {
    setImporting(true)
    setResult('')
    
    try {
      // Fetch the CSV file
      const response = await fetch('/Example CSV/Tradovate.csv')
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`)
      }
      
      const csvContent = await response.text()
      console.log('CSV Content length:', csvContent.length)
      
      console.log('📄 CSV Content Preview:', csvContent.substring(0, 500))
      console.log('📄 CSV Full length:', csvContent.length)
      
      // Parse CSV directly with Tradovate parser
      const parseResult = await TradovateCsvParser.parseCSV(csvContent)
      
      console.log('✅ Parse Result:', {
        success: parseResult.success,
        trades: parseResult.trades.length,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
        metadata: parseResult.metadata
      })
      
      if (parseResult.success && parseResult.trades.length > 0) {
        // Update DataStore
        await DataStore.replaceTrades(parseResult.trades)
        
        console.log('🎯 Sample imported trade:', parseResult.trades[0])
        console.log('📊 DataStore info after import:', DataStore.getDataInfo())
        
        setResult(`✅ SUCCESS: Imported ${parseResult.trades.length} trades from ${parseResult.metadata.broker}`)
      } else {
        setResult(`❌ FAILED: ${parseResult.errors.join(', ')}`)
      }
      
    } catch (error) {
      setResult(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setImporting(false)
      refreshData()
    }
  }

  const clearData = () => {
    DataStore.clearData()
    refreshData()
    setResult('🗑️ All data cleared')
  }

  useEffect(() => {
    refreshData()
    
    // Subscribe to data changes
    const unsubscribe = DataStore.subscribe(refreshData)
    return unsubscribe
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#171717]">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CSV Import Test (No Mock Data)
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test the clean system without any mock data interference
              </p>
            </div>

            {/* Current Data Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Data Status</CardTitle>
              </CardHeader>
              <CardContent>
                {dataInfo ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {dataInfo.count}
                      </div>
                      <div className="text-sm text-blue-600">Total Trades</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="text-sm font-bold text-gray-600">
                        {dataInfo.count > 0 ? '✅ Has Data' : '⚪ Empty'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dataInfo.sampleTradeId ? `Sample: ${dataInfo.sampleTradeId}` : 'No trades'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">Loading data info...</div>
                )}
              </CardContent>
            </Card>

            {/* Test Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Test Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <Button 
                    onClick={testTradovateImport}
                    disabled={importing}
                    className="flex items-center space-x-2"
                  >
                    {importing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>
                      {importing ? 'Importing...' : 'Test Tradovate Import'}
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={clearData}
                    disabled={importing}
                  >
                    Clear All Data
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    onClick={refreshData}
                    disabled={importing}
                  >
                    Refresh Status
                  </Button>
                </div>

                {result && (
                  <div className={`p-4 rounded-lg border ${
                    result.includes('✅') 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                      : result.includes('❌')
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200'
                  }`}>
                    <div className="font-mono text-sm">
                      {result}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Testing Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>System starts completely empty (no mock data)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Click "Test Tradovate Import" to load real CSV data</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Check that analytics pages now show real imported data</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Use "Clear All Data" to test empty state again</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
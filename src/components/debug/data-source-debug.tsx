'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Root as Badge } from '@/components/ui/badge'
import { DataStore } from '@/services/data-store.service'
import { Database, RefreshCw, AlertTriangle, TestTube } from 'lucide-react'
import { testTradovateImport } from '@/utils/test-csv-import'

interface DataInfo {
  count: number
  lastUpdated: number
  sampleTradeId?: string
}

export function DataSourceDebug() {
  const [dataInfo, setDataInfo] = useState<DataInfo | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [testing, setTesting] = useState(false)

  const refreshInfo = async () => {
    setRefreshing(true)
    try {
      const info = DataStore.getDataInfo()
      setDataInfo(info)
    } finally {
      setRefreshing(false)
    }
  }

  const clearData = async () => {
    if (confirm('Are you sure you want to clear all trade data? This will empty the system.')) {
      DataStore.clearData()
      await refreshInfo()
    }
  }

  const testImport = async () => {
    setTesting(true)
    try {
      const result = await testTradovateImport()
      alert(result.message)
      await refreshInfo()
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    refreshInfo()
    
    // Subscribe to data changes
    const unsubscribe = DataStore.subscribe(() => {
      refreshInfo()
    })
    
    return unsubscribe
  }, [])

  if (!dataInfo) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">Loading data info...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Database className="w-4 h-4" />
          <span>Data Source Debug</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshInfo}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="text-lg font-bold text-blue-600">{dataInfo.count}</div>
            <div className="text-xs text-blue-600">Total Trades</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <Badge variant={dataInfo.count > 0 ? "default" : "secondary"}>
              {dataInfo.count > 0 ? "Has Data" : "Empty"}
            </Badge>
          </div>
        </div>
        
        {dataInfo.sampleTradeId && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sample Trade ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{dataInfo.sampleTradeId}</code>
          </div>
        )}
        
        {dataInfo.count === 0 && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <div className="text-xs">
              Import CSV data to see analytics
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testImport}
            disabled={testing}
          >
            <TestTube className={`w-3 h-3 mr-1 ${testing ? 'animate-pulse' : ''}`} />
            Test Tradovate Import
          </Button>
          <Button size="sm" variant="outline" onClick={clearData}>
            Clear Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
/**
 * Dynamic Analytics Demo Component
 * Shows real-time analytics updates when data changes
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAnalytics, useAnalyticsPerformance } from '@/hooks/use-analytics'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Root as Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, Database, Zap } from 'lucide-react'
import { DataSourceDebug } from '@/components/debug/data-source-debug'

export function DynamicAnalyticsDemo() {
  const { 
    state, 
    loading, 
    error, 
    trades, 
    filteredTrades, 
    metrics,
    updateFilters,
    getPerformanceMetrics 
  } = useAnalytics()
  
  const { metrics: perfMetrics, cacheStats } = useAnalyticsPerformance()
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')

  useEffect(() => {
    if (state?.lastUpdated) {
      setLastUpdateTime(new Date(state.lastUpdated).toLocaleTimeString())
    }
  }, [state?.lastUpdated])

  const handleApplyFilter = async (filterType: string) => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (filterType) {
      case 'last30Days':
        await updateFilters({
          dateRange: { start: thirtyDaysAgo, end: now }
        })
        break
      case 'winningTrades':
        await updateFilters({
          status: ['WIN']
        })
        break
      case 'largeTrades':
        await updateFilters({
          contractRange: { min: 5 }
        })
        break
      case 'reset':
        await updateFilters({})
        break
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading analytics system...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Source Debug */}
      <DataSourceDebug />
      
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Dynamic Analytics Status</span>
            <Badge variant="outline" className="ml-auto">
              {loading ? 'Processing' : 'Live'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{trades.length}</div>
              <div className="text-sm text-blue-600">Total Trades</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{filteredTrades.length}</div>
              <div className="text-sm text-green-600">Filtered Trades</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {metrics?.winRate ? `${Math.round(metrics.winRate)}%` : '0%'}
              </div>
              <div className="text-sm text-purple-600">Win Rate</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ${metrics?.netCumulativePnl?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-orange-600">Net P&L</div>
            </div>
          </div>
          
          {lastUpdateTime && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Last updated: {lastUpdateTime}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Dynamic Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleApplyFilter('last30Days')}
              disabled={loading}
            >
              Last 30 Days
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleApplyFilter('winningTrades')}
              disabled={loading}
            >
              Winning Trades
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleApplyFilter('largeTrades')}
              disabled={loading}
            >
              Large Trades (5+)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleApplyFilter('reset')}
              disabled={loading}
            >
              Reset Filters
            </Button>
          </div>
          
          {state?.filterTime && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Filter applied in {state.filterTime.toFixed(2)}ms
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {perfMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {perfMetrics.state.calculationTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-yellow-600">Calculation Time</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="text-lg font-bold text-indigo-600">
                  {perfMetrics.state.filterTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-indigo-600">Filter Time</div>
              </div>
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">
                  {perfMetrics.subscriptions}
                </div>
                <div className="text-sm text-emerald-600">Active Subscriptions</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {perfMetrics.eventHistory}
                </div>
                <div className="text-sm text-red-600">Events Logged</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Cache Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <div className="text-lg font-bold text-teal-600">
                {cacheStats()?.totalEntries || 0}
              </div>
              <div className="text-sm text-teal-600">Cache Entries</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <div className="text-lg font-bold text-cyan-600">
                {cacheStats()?.hitRate ? `${cacheStats()?.hitRate.toFixed(1)}%` : '0%'}
              </div>
              <div className="text-sm text-cyan-600">Hit Rate</div>
            </div>
            <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <div className="text-lg font-bold text-violet-600">
                {cacheStats()?.totalMemoryUsage ? 
                  `${(cacheStats()!.totalMemoryUsage / 1024).toFixed(1)}KB` : '0KB'}
              </div>
              <div className="text-sm text-violet-600">Memory Used</div>
            </div>
            <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <div className="text-lg font-bold text-pink-600">
                {cacheStats()?.averageAccessTime ? 
                  `${cacheStats()?.averageAccessTime.toFixed(2)}ms` : '0ms'}
              </div>
              <div className="text-sm text-pink-600">Avg Access Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Data Preview */}
      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades (Live Data)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredTrades.slice(-5).reverse().map((trade) => (
                <div 
                  key={trade.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant={trade.status === 'WIN' ? 'default' : 'destructive'}>
                      {trade.status}
                    </Badge>
                    <span className="font-medium">{trade.symbol}</span>
                    <span className="text-sm text-gray-500">{trade.contractsTraded} contracts</span>
                  </div>
                  <div className={`font-bold ${trade.netPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${trade.netPnl.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
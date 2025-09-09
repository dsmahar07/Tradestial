'use client'

import { useState, useEffect } from 'react'
import { modelStatsService } from '@/services/model-stats.service'
import { DataStore } from '@/services/data-store.service'
import TradeMetadataService from '@/services/trade-metadata.service'
import * as Tabs from '@radix-ui/react-tabs'
import { Button } from '@/components/ui/button'
import { ModelModelsTable } from '@/components/features/model-models-table'
import { ModelCardsView } from '@/components/features/model-cards-view'
import { ModelMaker } from '@/components/features/model-maker'
import { StrategyMarketplace } from '@/components/features/strategy-marketplace'
import { Plus, Store, TrendingUp, TrendingDown } from 'lucide-react'
import { BestPerformingIcon, LeastPerformingIcon, BestActiveIcon, BestWinRateIcon } from '@/components/ui/custom-icons'
import { cn } from '@/lib/utils'

// Overview stats component
const OverviewStatsCard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon: Icon,
  color = 'blue'
}: {
  title: string
  value: string
  subtitle: string
  trend?: 'up' | 'down' | 'neutral'
  icon: any
  color?: 'blue' | 'green' | 'orange' | 'purple'
}) => {
  const colorConfigs = {
    blue: { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.12)' },
    green: { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.12)' },
    orange: { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.12)' },
    purple: { color: '#693EE0', bgColor: 'rgba(105, 62, 224, 0.12)' }
  }

  const config = colorConfigs[color]

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />
    return null
  }

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-4 min-h-32">
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="w-6 h-6" />
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="space-y-1">
        <div className="text-xl font-semibold text-gray-900 dark:text-white">
          {value}
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {subtitle}
        </div>
      </div>
    </div>
  )
}

export function ModelOverview() {
  console.log('ModelOverview component mounting...')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('models')
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid'
    const saved = localStorage.getItem('tradestial:modelView') as 'table' | 'grid' | 'list' | null
    return saved || 'grid'
  })
  const [summaryStats, setSummaryStats] = useState({
    bestPerforming: null as any,
    leastPerforming: null as any,
    mostActive: null as any,
    bestWinRate: null as any
  })

  const handleModelCreated = () => {
    setIsCreateOpen(false)
    // Trigger refresh of the table
    window.dispatchEvent(new CustomEvent('tradestial:strategies-updated'))
  }

  // Load summary stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get all trades and map model assignments from TradeMetadataService
        const allTrades = await DataStore.getAllTrades()
        const metaMap = TradeMetadataService.getAllTradeMetadata()
        
        // Map model assignments to trades
        const tradesWithModels = allTrades.map(trade => ({
          ...trade,
          model: metaMap?.[trade.id]?.model || trade.model
        }))

        // Get available models from strategies
        const strategiesRaw = localStorage.getItem('tradestial:strategies')
        const strategies = strategiesRaw ? JSON.parse(strategiesRaw) : []
        
        // Calculate stats for each model
        const modelStats: Array<{ modelId: string; name: string; stats: any }> = []
        
        for (const strategy of strategies) {
          const modelTrades = tradesWithModels.filter(trade => trade.model === strategy.name)
          
          const total = modelTrades.length
          let wins = 0
          let losses = 0
          let netPnL = 0

          for (const trade of modelTrades) {
            const pnl = typeof trade.netPnl === 'number' ? trade.netPnl : 
                        parseFloat(String(trade.netPnl || 0).replace(/[$,]/g, '')) || 0
            
            netPnL += pnl
            if (pnl > 0) wins++
            else if (pnl < 0) losses++
          }

          const winRate = total ? (wins / total) * 100 : 0

          modelStats.push({
            modelId: strategy.id,
            name: strategy.name,
            stats: { total, wins, losses, winRate, netPnL }
          })
        }

        // Find best performing, least performing, most active, and best win rate
        let bestPerforming = null
        let leastPerforming = null
        let mostActive = null
        let bestWinRate = null

        for (const model of modelStats) {
          if (!bestPerforming || model.stats.netPnL > bestPerforming.stats.netPnL) {
            bestPerforming = model
          }
          if (!leastPerforming || model.stats.netPnL < leastPerforming.stats.netPnL) {
            leastPerforming = model
          }
          if (!mostActive || model.stats.total > mostActive.stats.total) {
            mostActive = model
          }
          if (model.stats.total > 0 && (!bestWinRate || model.stats.winRate > bestWinRate.stats.winRate)) {
            bestWinRate = model
          }
        }

        setSummaryStats({
          bestPerforming,
          leastPerforming,
          mostActive,
          bestWinRate
        })
      } catch (error) {
        console.error('Error loading model stats:', error)
      }
    }

    loadStats()

    // Listen for metadata updates
    const handleMetadataUpdate = () => loadStats()
    window.addEventListener('tradestial:trade-metadata-updated', handleMetadataUpdate)
    window.addEventListener('tradestial:strategies-updated', handleMetadataUpdate)

    return () => {
      window.removeEventListener('tradestial:trade-metadata-updated', handleMetadataUpdate)
      window.removeEventListener('tradestial:strategies-updated', handleMetadataUpdate)
    }
  }, [])

  // Persist view mode preference
  useEffect(() => {
    try {
      localStorage.setItem('tradestial:modelView', viewMode)
    } catch {}
  }, [viewMode])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setIsMarketplaceOpen(true)}
            size="sm"
            className="bg-[#7D52F4] hover:bg-[#6B46C1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none relative"
          >
            <Store className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Templates</span>
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="bg-[#3559E9] hover:bg-[#2947d1] text-white border-none shadow-sm overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none relative"
          >
            <Plus className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">Create Model</span>
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <OverviewStatsCard
          title="Best performing model"
          value={summaryStats.bestPerforming?.name || "No data"}
          subtitle={summaryStats.bestPerforming 
            ? `${summaryStats.bestPerforming.stats.total} trade${summaryStats.bestPerforming.stats.total !== 1 ? 's' : ''} • $${summaryStats.bestPerforming.stats.netPnL.toFixed(0)}`
            : "No models with trades"
          }
          trend={summaryStats.bestPerforming?.stats.netPnL > 0 ? "up" : summaryStats.bestPerforming?.stats.netPnL < 0 ? "down" : "neutral"}
          icon={BestPerformingIcon}
          color="green"
        />
        <OverviewStatsCard
          title="Least performing model"
          value={summaryStats.leastPerforming?.name || "No data"}
          subtitle={summaryStats.leastPerforming 
            ? `${summaryStats.leastPerforming.stats.total} trade${summaryStats.leastPerforming.stats.total !== 1 ? 's' : ''} • $${summaryStats.leastPerforming.stats.netPnL.toFixed(0)}`
            : "No models with trades"
          }
          trend={summaryStats.leastPerforming?.stats.netPnL > 0 ? "up" : summaryStats.leastPerforming?.stats.netPnL < 0 ? "down" : "neutral"}
          icon={LeastPerformingIcon}
          color="blue"
        />
        <OverviewStatsCard
          title="Most active model"
          value={summaryStats.mostActive?.name || "No data"}
          subtitle={summaryStats.mostActive 
            ? `${summaryStats.mostActive.stats.total} trade${summaryStats.mostActive.stats.total !== 1 ? 's' : ''}`
            : "No models with trades"
          }
          icon={BestActiveIcon}
          color="orange"
        />
        <OverviewStatsCard
          title="Best win rate"
          value={summaryStats.bestWinRate?.name || "No data"}
          subtitle={summaryStats.bestWinRate 
            ? `${summaryStats.bestWinRate.stats.winRate.toFixed(0)}% / ${summaryStats.bestWinRate.stats.total} trade${summaryStats.bestWinRate.stats.total !== 1 ? 's' : ''}`
            : "No models with trades"
          }
          icon={BestWinRateIcon}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <Tabs.List className="flex items-center space-x-1 bg-gray-100 dark:bg-[#171717] p-1 rounded-lg">
            <Tabs.Trigger
              value="models"
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'models' 
                  ? "bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Models
            </Tabs.Trigger>
            <Tabs.Trigger
              value="shared"
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === 'shared'
                  ? "bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              Shared with me
            </Tabs.Trigger>
          </Tabs.List>

          {/* View Options */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'grid' 
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              )}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'table' 
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              )}
              title="Table view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <Tabs.Content value="models" className="mt-4">
          {viewMode === 'table' ? <ModelModelsTable /> : <ModelCardsView />}
          
          {/* Pagination - only show for table view */}
          {viewMode === 'table' && (
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Result: 1 - 1 of 1 models
                </span>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <button 
                  disabled
                  className="p-2 rounded-lg text-gray-400 dark:text-gray-600 cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg">
                  1
                </button>
                <button 
                  disabled
                  className="p-2 rounded-lg text-gray-400 dark:text-gray-600 cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="shared" className="mt-4">
          <div className="bg-white dark:bg-[#0f0f0f] rounded-xl p-12 border border-gray-200 dark:border-[#2a2a2a] text-center">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No shared models yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Models shared with you will appear here
            </p>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Create Model Modal */}
      <ModelMaker 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onModelCreated={handleModelCreated}
      />

      {/* Strategy Marketplace Modal */}
      <StrategyMarketplace 
        open={isMarketplaceOpen}
        onOpenChange={setIsMarketplaceOpen}
      />
    </div>
  )
}
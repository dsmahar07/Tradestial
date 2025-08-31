'use client'

import { useState, useEffect } from 'react'
import { modelStatsService } from '@/services/model-stats.service'
import { DataStore } from '@/services/data-store.service'
import * as Tabs from '@radix-ui/react-tabs'
import { Button } from '@/components/ui/button'
import { ModelModelsTable } from '@/components/features/model-models-table'
import { ModelMaker } from '@/components/features/model-maker'
import { StrategyMarketplace } from '@/components/features/strategy-marketplace'
import { Plus, TrendingUp, TrendingDown, Target, Activity, Store } from 'lucide-react'
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
  color?: 'blue' | 'green' | 'purple' | 'orange'
}) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600', 
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />
    return null
  }

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-4 min-h-32">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
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
    console.log('ModelOverview useEffect triggered')
    
    const loadStats = () => {
      console.log('=== ModelOverview Loading Stats ===')
      const trades = DataStore.getAllTrades()
      console.log('ModelOverview: Loading stats with trades:', trades.length)
      if (trades.length > 0) {
        console.log('First trade sample:', trades[0])
      }
      const summary = modelStatsService.getSummaryStats(trades)
      console.log('ModelOverview: Summary stats result:', summary)
      setSummaryStats(summary)
      console.log('=== End ModelOverview Loading Stats ===')
    }

    // Add a small delay to ensure all services are ready
    setTimeout(() => {
      console.log('ModelOverview: Starting delayed stats load...')
      // Also run debug function to see state
      if ((window as any).debugModelStats) {
        (window as any).debugModelStats()
      }
      loadStats()
    }, 100)

    // Listen for stats updates
    const handleStatsUpdate = () => loadStats()
    window.addEventListener('tradestial:model-stats-updated', handleStatsUpdate)
    window.addEventListener('tradestial:strategies-updated', handleStatsUpdate)

    return () => {
      window.removeEventListener('tradestial:model-stats-updated', handleStatsUpdate)
      window.removeEventListener('tradestial:strategies-updated', handleStatsUpdate)
    }
  }, [])

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
          icon={TrendingUp}
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
          icon={TrendingDown}
          color="blue"
        />
        <OverviewStatsCard
          title="Most active model"
          value={summaryStats.mostActive?.name || "No data"}
          subtitle={summaryStats.mostActive 
            ? `${summaryStats.mostActive.stats.total} trade${summaryStats.mostActive.stats.total !== 1 ? 's' : ''}`
            : "No models with trades"
          }
          icon={Activity}
          color="orange"
        />
        <OverviewStatsCard
          title="Best win rate"
          value={summaryStats.bestWinRate?.name || "No data"}
          subtitle={summaryStats.bestWinRate 
            ? `${summaryStats.bestWinRate.stats.winRate.toFixed(0)}% / ${summaryStats.bestWinRate.stats.total} trade${summaryStats.bestWinRate.stats.total !== 1 ? 's' : ''}`
            : "No models with trades"
          }
          icon={Target}
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
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <Tabs.Content value="models" className="mt-4">
          <ModelModelsTable />
          
          {/* Pagination */}
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
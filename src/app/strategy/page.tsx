'use client'

import * as React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import StrategyCard from '@/components/strategy/strategy-card'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { usePageTitle } from '@/hooks/use-page-title'
import { useTagData } from '@/hooks/use-tag-data'

export default function StrategyPage() {
  const [trades, setTrades] = React.useState<Trade[]>([])
  const { categories, tags, addTag, removeTag, updateCategory } = useTagData()
  const [showColorPicker, setShowColorPicker] = React.useState<'mistakes' | 'custom' | null>(null)
  const [profitTarget, setProfitTarget] = React.useState('')
  const [stopLoss, setStopLoss] = React.useState('')
  const [rating, setRating] = React.useState(0)
  usePageTitle('Strategy')

  React.useEffect(() => {
    try {
      const all = DataStore.getAllTrades()
      setTrades(all)
    } catch {
      setTrades([])
    }
  }, [])

  const primary = trades[0] || null
  const secondary = trades[1] || trades[0] || null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex-1 bg-[#f2f2f2] dark:bg-[#171717]">
          <div className="mx-auto max-w-6xl p-8">
            {/* Page heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Strategy</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Compare strategies and assign trades</p>
            </div>

            {/* Single dual-layer card */}
            <div className="flex justify-center">
              <StrategyCard
                title={primary ? primary.symbol || 'Starter' : 'Starter'}
                subtitle="Best for startup and small teams"
                trade={primary}
                highlight
                categories={categories}
                tags={tags}
                profitTarget={profitTarget}
                stopLoss={stopLoss}
                rating={rating}
                onProfitTargetChange={setProfitTarget}
                onStopLossChange={setStopLoss}
                onRatingChange={setRating}
                onAddTag={addTag}
                onRemoveTag={removeTag}
                onUpdateCategory={updateCategory}
                onShowColorPicker={setShowColorPicker}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

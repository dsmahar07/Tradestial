'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Share2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addSharedStrategy, SharedStrategy } from '@/lib/shared-strategies'

type Strategy = {
  id: string
  name: string
  emoji?: string
}

type StrategyStats = {
  winRate: number
  profitFactor: number
  total: number
  netPnL: number
}

interface ShareStrategyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategy: Strategy | null
  stats: StrategyStats | null
}

const CATEGORIES = [
  'Price Action',
  'Smart Money',
  'Scalping', 
  'Trend Following',
  'Mean Reversion',
  'Momentum',
  'Support & Resistance',
  'Breakout',
  'Technical Analysis',
  'Other'
]

export function ShareStrategyDialog({ open, onOpenChange, strategy, stats }: ShareStrategyDialogProps) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')
  const [tags, setTags] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (!strategy || !stats) return

    setIsSharing(true)
    try {
      const returns = stats.netPnL >= 0 ? `+${Math.round((stats.netPnL / 1000) * 100)}%` : `${Math.round((stats.netPnL / 1000) * 100)}%`
      
      const sharedStrategy: SharedStrategy = {
        id: `shared-${strategy.id}-${Date.now()}`,
        name: strategy.name,
        description: description || `A trading strategy with ${stats.winRate.toFixed(0)}% win rate and ${Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(1) : '0.0'} profit factor.`,
        author: 'You', // In a real app, this would be the current user
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        stats: {
          winRate: Math.round(stats.winRate),
          profitFactor: Number.isFinite(stats.profitFactor) ? Number(stats.profitFactor.toFixed(1)) : 0,
          totalTrades: stats.total,
          returns
        },
        emoji: strategy.emoji,
        sharedAt: Date.now(),
        originalId: strategy.id
      }

      addSharedStrategy(sharedStrategy)
      
      // Reset form
      setDescription('')
      setCategory('Other')
      setTags('')
      
      onOpenChange(false)
      
      // Show success message (you could add a toast notification here)
      alert('Strategy shared successfully!')
    } catch (error) {
      console.error('Failed to share strategy:', error)
      alert('Failed to share strategy. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  if (!strategy || !stats) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-white dark:bg-gray-900 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Share Strategy
                </Dialog.Title>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share "{strategy.name}" with the community
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Strategy Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="h-8 w-8 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                {strategy.emoji || '📈'}
              </span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{strategy.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{stats.total} trades</span>
                  <span>{stats.winRate.toFixed(0)}% win rate</span>
                  <span>{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(1) : '0.0'} PF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your strategy, methodology, and what makes it unique..."
                className="w-full h-24 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Tags
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ICT, Smart Money, Scalping (comma separated)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              disabled={isSharing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSharing ? 'Sharing...' : 'Share Strategy'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
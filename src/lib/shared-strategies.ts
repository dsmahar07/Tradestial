import { logger } from '@/lib/logger'

export interface SharedStrategy {
  id: string
  name: string
  description: string
  author: string
  category: string
  tags: string[]
  stats: {
    winRate: number
    profitFactor: number
    totalTrades: number
    returns: string
  }
  emoji?: string
  sharedAt: number
  originalId: string
  ruleGroups?: Array<{
    id: string
    title: string
    rules: Array<{
      id: string
      text: string
      frequency: string
    }>
  }>
}

const SHARED_STRATEGIES_KEY = 'tradestial:shared-strategies'

export function getSharedStrategies(): SharedStrategy[] {
  try {
    const raw = localStorage.getItem(SHARED_STRATEGIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addSharedStrategy(strategy: SharedStrategy): void {
  try {
    const existing = getSharedStrategies()
    const updated = [strategy, ...existing.filter(s => s.id !== strategy.id)]
    localStorage.setItem(SHARED_STRATEGIES_KEY, JSON.stringify(updated))
    
    // Trigger marketplace refresh
    window.dispatchEvent(new CustomEvent('tradestial:shared-strategies-updated'))
  } catch (error) {
    logger.error('Failed to save shared strategy:', error)
  }
}

export function removeSharedStrategy(id: string): void {
  try {
    const existing = getSharedStrategies()
    const updated = existing.filter(s => s.id !== id)
    localStorage.setItem(SHARED_STRATEGIES_KEY, JSON.stringify(updated))
    
    // Trigger marketplace refresh
    window.dispatchEvent(new CustomEvent('tradestial:shared-strategies-updated'))
  } catch (error) {
    logger.error('Failed to remove shared strategy:', error)
  }
}
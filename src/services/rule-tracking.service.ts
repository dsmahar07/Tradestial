/**
 * Rule Tracking Service
 * Monitors user actions and updates rule completion status
 */

import { DataStore } from './data-store.service'

export interface RuleCompletion {
  ruleId: string
  date: string
  completed: boolean
  timestamp: Date
  details?: any
}

export class RuleTrackingService {
  private static readonly RULE_COMPLETIONS_KEY = 'tradestial:rule-completions'
  private static readonly JOURNAL_ENTRIES_KEY = 'tradestial:journal-entries'
  
  // Get today's date in YYYY-MM-DD format
  private static getTodayKey(): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Store rule completion
  static setRuleCompletion(ruleId: string, completed: boolean, date?: string, details?: any): void {
    if (typeof window === 'undefined') return
    
    const dateKey = date || this.getTodayKey()
    const completion: RuleCompletion = {
      ruleId,
      date: dateKey,
      completed,
      timestamp: new Date(),
      details
    }
    
    try {
      const stored = localStorage.getItem(this.RULE_COMPLETIONS_KEY)
      const completions: Record<string, Record<string, RuleCompletion>> = stored ? JSON.parse(stored) : {}
      
      if (!completions[dateKey]) {
        completions[dateKey] = {}
      }
      
      completions[dateKey][ruleId] = completion
      
      localStorage.setItem(this.RULE_COMPLETIONS_KEY, JSON.stringify(completions))
      
      console.log(`Rule ${ruleId} marked as ${completed ? 'completed' : 'incomplete'} for ${dateKey}`)
    } catch (error) {
      console.error('Failed to store rule completion:', error)
    }
  }

  // Get rule completion status
  static getRuleCompletion(ruleId: string, date?: string): boolean {
    if (typeof window === 'undefined') return false
    
    const dateKey = date || this.getTodayKey()
    
    try {
      const stored = localStorage.getItem(this.RULE_COMPLETIONS_KEY)
      const completions: Record<string, Record<string, RuleCompletion>> = stored ? JSON.parse(stored) : {}
      
      return completions[dateKey]?.[ruleId]?.completed || false
    } catch (error) {
      console.error('Failed to get rule completion:', error)
      return false
    }
  }

  // Get all completions for a specific date
  static getDayCompletions(date?: string): Record<string, boolean> {
    if (typeof window === 'undefined') return {}
    
    const dateKey = date || this.getTodayKey()
    
    try {
      const stored = localStorage.getItem(this.RULE_COMPLETIONS_KEY)
      const completions: Record<string, Record<string, RuleCompletion>> = stored ? JSON.parse(stored) : {}
      
      const dayCompletions: Record<string, boolean> = {}
      const dayData = completions[dateKey] || {}
      
      Object.keys(dayData).forEach(ruleId => {
        dayCompletions[ruleId] = dayData[ruleId].completed
      })
      
      return dayCompletions
    } catch (error) {
      console.error('Failed to get day completions:', error)
      return {}
    }
  }

  // Track "Step into the day" rule completion
  static trackStepIntoDayRule(ruleTime: string, date?: string): void {
    const dateKey = date || this.getTodayKey()
    
    // Check if user has journal entry for the day
    const hasJournalEntry = this.checkJournalEntry(dateKey)
    
    // Check if it's within the specified time
    const now = new Date()
    const [hours, minutes] = ruleTime.split(':').map(Number)
    const ruleDateTime = new Date()
    ruleDateTime.setHours(hours, minutes, 0, 0)
    
    const isOnTime = hasJournalEntry && now <= ruleDateTime
    
    this.setRuleCompletion('2', isOnTime, dateKey, {
      journalEntry: hasJournalEntry,
      timeCheck: now <= ruleDateTime,
      actualTime: now.toTimeString().slice(0, 5)
    })
  }

  // Check if journal entry exists for a date
  private static checkJournalEntry(date: string): boolean {
    try {
      const stored = localStorage.getItem(this.JOURNAL_ENTRIES_KEY)
      const entries = stored ? JSON.parse(stored) : {}
      
      // Check if there's a journal entry for this date
      return !!entries[date] && entries[date].length > 0
    } catch (error) {
      console.error('Failed to check journal entry:', error)
      return false
    }
  }

  // Track "Link trades to model" rule completion
  static trackLinkTradesToModelRule(date?: string): void {
    const dateKey = date || this.getTodayKey()
    const trades = DataStore.getAllTrades()
    
    // Get trades for this specific date
    const dayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.openDate).toISOString().split('T')[0]
      return tradeDate === dateKey
    })
    
    // Check if all trades have models linked
    const allTradesHaveModels = dayTrades.length > 0 && dayTrades.every(trade => 
      trade.modelId || trade.model || trade.strategy
    )
    
    this.setRuleCompletion('3', allTradesHaveModels, dateKey, {
      totalTrades: dayTrades.length,
      tradesWithModels: dayTrades.filter(trade => trade.modelId || trade.model || trade.strategy).length
    })
  }

  // Track "Stop loss" rule completion
  static trackStopLossRule(date?: string): void {
    const dateKey = date || this.getTodayKey()
    const trades = DataStore.getAllTrades()
    
    // Get trades for this specific date
    const dayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.openDate).toISOString().split('T')[0]
      return tradeDate === dateKey
    })
    
    // Check if all trades have stop loss set
    const allTradesHaveStopLoss = dayTrades.length > 0 && dayTrades.every(trade => 
      trade.stopLoss !== undefined && trade.stopLoss !== null && trade.stopLoss !== 0
    )
    
    this.setRuleCompletion('stop_loss', allTradesHaveStopLoss, dateKey, {
      totalTrades: dayTrades.length,
      tradesWithStopLoss: dayTrades.filter(trade => 
        trade.stopLoss !== undefined && trade.stopLoss !== null && trade.stopLoss !== 0
      ).length
    })
  }

  // Track "Max loss per trade" rule completion
  static trackMaxLossPerTradeRule(maxLoss: number, date?: string): void {
    const dateKey = date || this.getTodayKey()
    const trades = DataStore.getAllTrades()
    
    // Get trades for this specific date
    const dayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.openDate).toISOString().split('T')[0]
      return tradeDate === dateKey
    })
    
    // Check if all trades stayed within max loss limit
    const allTradesWithinLimit = dayTrades.every(trade => {
      const loss = Math.abs(Math.min(0, trade.netPnl || 0))
      return loss <= maxLoss
    })
    
    const worstTrade = dayTrades.reduce((worst, trade) => {
      const loss = Math.abs(Math.min(0, trade.netPnl || 0))
      return loss > worst.loss ? { trade, loss } : worst
    }, { trade: null, loss: 0 })
    
    this.setRuleCompletion('max_loss_trade', allTradesWithinLimit, dateKey, {
      maxLossLimit: maxLoss,
      worstLoss: worstTrade.loss,
      totalTrades: dayTrades.length,
      violatingTrades: dayTrades.filter(trade => {
        const loss = Math.abs(Math.min(0, trade.netPnl || 0))
        return loss > maxLoss
      }).length
    })
  }

  // Track "Max loss per day" rule completion
  static trackMaxLossPerDayRule(maxDailyLoss: number, date?: string): void {
    const dateKey = date || this.getTodayKey()
    const trades = DataStore.getAllTrades()
    
    // Get trades for this specific date
    const dayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.openDate).toISOString().split('T')[0]
      return tradeDate === dateKey
    })
    
    // Calculate total P&L for the day
    const dayPnL = dayTrades.reduce((total, trade) => total + (trade.netPnl || 0), 0)
    const dayLoss = Math.abs(Math.min(0, dayPnL))
    
    const withinLimit = dayLoss <= maxDailyLoss
    
    this.setRuleCompletion('max_loss_day', withinLimit, dateKey, {
      maxDailyLossLimit: maxDailyLoss,
      actualDayLoss: dayLoss,
      dayPnL: dayPnL,
      totalTrades: dayTrades.length
    })
  }

  // Store journal entry (to track Step into day rule)
  static recordJournalEntry(date: string, content: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.JOURNAL_ENTRIES_KEY)
      const entries = stored ? JSON.parse(stored) : {}
      
      if (!entries[date]) {
        entries[date] = []
      }
      
      entries[date].push({
        content,
        timestamp: new Date().toISOString()
      })
      
      localStorage.setItem(this.JOURNAL_ENTRIES_KEY, JSON.stringify(entries))
      
      // Auto-check Step into day rule when journal entry is made
      this.autoCheckStepIntoDayRule(date)
    } catch (error) {
      console.error('Failed to record journal entry:', error)
    }
  }

  // Auto-check Step into day rule when conditions are met
  private static autoCheckStepIntoDayRule(date: string): void {
    // This would be called from the trading rules to get the time setting
    // For now, we'll use a default or check the current rules
    const defaultTime = '08:30' // This should come from the actual rule configuration
    this.trackStepIntoDayRule(defaultTime, date)
  }

  // Get completion statistics for a date range
  static getCompletionStats(startDate: string, endDate: string): {
    totalDays: number
    completedDays: number
    completionRate: number
    ruleStats: Record<string, { completed: number; total: number }>
  } {
    if (typeof window === 'undefined') return {
      totalDays: 0,
      completedDays: 0,
      completionRate: 0,
      ruleStats: {}
    }
    
    try {
      const stored = localStorage.getItem(this.RULE_COMPLETIONS_KEY)
      const completions: Record<string, Record<string, RuleCompletion>> = stored ? JSON.parse(stored) : {}
      
      const start = new Date(startDate)
      const end = new Date(endDate)
      const ruleStats: Record<string, { completed: number; total: number }> = {}
      
      let totalDays = 0
      let completedDays = 0
      
      // Iterate through date range
      const currentDate = new Date(start)
      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0]
        const dayCompletions = completions[dateKey] || {}
        
        totalDays++
        
        const dayRules = Object.keys(dayCompletions)
        const completedRules = dayRules.filter(ruleId => dayCompletions[ruleId].completed)
        
        if (dayRules.length > 0 && completedRules.length === dayRules.length) {
          completedDays++
        }
        
        // Update rule statistics
        dayRules.forEach(ruleId => {
          if (!ruleStats[ruleId]) {
            ruleStats[ruleId] = { completed: 0, total: 0 }
          }
          ruleStats[ruleId].total++
          if (dayCompletions[ruleId].completed) {
            ruleStats[ruleId].completed++
          }
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      return {
        totalDays,
        completedDays,
        completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
        ruleStats
      }
    } catch (error) {
      console.error('Failed to get completion stats:', error)
      return {
        totalDays: 0,
        completedDays: 0,
        completionRate: 0,
        ruleStats: {}
      }
    }
  }
}
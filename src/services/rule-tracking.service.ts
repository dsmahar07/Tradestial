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
    
    // Rule can only be completed if there are actual trades to validate
    if (dayTrades.length === 0) {
      this.setRuleCompletion('3', false, dateKey, {
        totalTrades: 0,
        tradesWithModels: 0,
        reason: 'No trades found for validation'
      })
      return
    }
    
    // Check if all trades have models linked (check metadata service for model selection)
    const allTradesHaveModels = dayTrades.every(trade => {
      // Check if model is selected in trade metadata (from stats widget)
      try {
        const metadata = JSON.parse(localStorage.getItem('tradestial:trade-metadata') || '{}')
        const tradeMetadata = metadata[trade.id]
        return tradeMetadata && tradeMetadata.selectedModel && tradeMetadata.selectedModel.trim() !== ''
      } catch {
        return trade.model || false
      }
    })
    
    this.setRuleCompletion('3', allTradesHaveModels, dateKey, {
      totalTrades: dayTrades.length,
      tradesWithModels: dayTrades.filter(trade => {
        try {
          const metadata = JSON.parse(localStorage.getItem('tradestial:trade-metadata') || '{}')
          const tradeMetadata = metadata[trade.id]
          return tradeMetadata && tradeMetadata.selectedModel && tradeMetadata.selectedModel.trim() !== ''
        } catch {
          return trade.model || false
        }
      }).length
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
    
    // Rule can only be completed if there are actual trades to validate
    if (dayTrades.length === 0) {
      this.setRuleCompletion('4', false, dateKey, {
        totalTrades: 0,
        tradesWithStopLoss: 0,
        reason: 'No trades found for validation'
      })
      return
    }
    
    // Check if all trades have stop loss set (check metadata service for stop loss values)
    const allTradesHaveStopLoss = dayTrades.every(trade => {
      // Check if stop loss is set in trade metadata (from stats widget)
      try {
        const metadata = JSON.parse(localStorage.getItem('tradestial:trade-metadata') || '{}')
        const tradeMetadata = metadata[trade.id]
        return tradeMetadata && tradeMetadata.stopLoss && tradeMetadata.stopLoss.trim() !== ''
      } catch {
        return false
      }
    })
    
    this.setRuleCompletion('4', allTradesHaveStopLoss, dateKey, {
      totalTrades: dayTrades.length,
      tradesWithStopLoss: dayTrades.filter(trade => {
        try {
          const metadata = JSON.parse(localStorage.getItem('tradestial:trade-metadata') || '{}')
          const tradeMetadata = metadata[trade.id]
          return tradeMetadata && tradeMetadata.stopLoss && tradeMetadata.stopLoss.trim() !== ''
        } catch {
          return false
        }
      }).length
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
    
    // Rule can only be completed if there are actual trades to validate
    // If no trades exist, the rule should remain incomplete (not auto-completed)
    if (dayTrades.length === 0) {
      this.setRuleCompletion('5', false, dateKey, {
        maxLossLimit: maxLoss,
        worstLoss: 0,
        totalTrades: 0,
        violatingTrades: 0,
        reason: 'No trades found for validation'
      })
      return
    }
    
    // Check if all trades stayed within max loss limit
    const allTradesWithinLimit = dayTrades.every(trade => {
      const loss = Math.abs(Math.min(0, trade.netPnl || 0))
      return loss <= maxLoss
    })
    
    const worstTrade = dayTrades.reduce<{ trade: any; loss: number }>((worst, trade) => {
      const loss = Math.abs(Math.min(0, trade.netPnl || 0))
      return loss > worst.loss ? { trade, loss } : worst
    }, { trade: null, loss: 0 })
    
    this.setRuleCompletion('5', allTradesWithinLimit, dateKey, {
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
    
    // Rule can only be completed if there are actual trades to validate
    // If no trades exist, the rule should remain incomplete (not auto-completed)
    if (dayTrades.length === 0) {
      this.setRuleCompletion('6', false, dateKey, {
        maxDailyLossLimit: maxDailyLoss,
        actualDayLoss: 0,
        dayPnL: 0,
        totalTrades: 0,
        reason: 'No trades found for validation'
      })
      return
    }
    
    // Calculate total P&L for the day
    const dayPnL = dayTrades.reduce((total, trade) => total + (trade.netPnl || 0), 0)
    const dayLoss = Math.abs(Math.min(0, dayPnL))
    
    const withinLimit = dayLoss <= maxDailyLoss
    
    this.setRuleCompletion('6', withinLimit, dateKey, {
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
    // Get the actual rule configuration from Activity Journal
    try {
      const storedRules = localStorage.getItem('progress:tradingRules')
      if (storedRules) {
        const rules = JSON.parse(storedRules)
        const stepIntoDayRule = rules.find((rule: any) => rule.type === 'start_day')
        const ruleTime = stepIntoDayRule?.config?.time || '08:30'
        this.trackStepIntoDayRule(ruleTime, date)
      } else {
        this.trackStepIntoDayRule('08:30', date)
      }
    } catch {
      this.trackStepIntoDayRule('08:30', date)
    }
  }

  // Track model selection in stats widget
  static trackModelSelection(tradeId: string, modelName: string): void {
    try {
      const metadata = JSON.parse(localStorage.getItem('tradestial:trade-metadata') || '{}')
      if (!metadata[tradeId]) {
        metadata[tradeId] = {}
      }
      metadata[tradeId].selectedModel = modelName
      localStorage.setItem('tradestial:trade-metadata', JSON.stringify(metadata))
      
      // Re-check link trades to model rule
      this.trackLinkTradesToModelRule()
      console.log(`Model ${modelName} linked to trade ${tradeId}`)
    } catch (error) {
      console.error('Failed to track model selection:', error)
    }
  }

  // Track stop loss input in stats widget
  static trackStopLossInput(tradeId: string, stopLoss: string): void {
    try {
      const metadata = JSON.parse(localStorage.getItem('tradestial:trade-metadata') || '{}')
      if (!metadata[tradeId]) {
        metadata[tradeId] = {}
      }
      metadata[tradeId].stopLoss = stopLoss
      localStorage.setItem('tradestial:trade-metadata', JSON.stringify(metadata))
      
      // Re-check stop loss rule
      this.trackStopLossRule()
      console.log(`Stop loss ${stopLoss} set for trade ${tradeId}`)
    } catch (error) {
      console.error('Failed to track stop loss input:', error)
    }
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
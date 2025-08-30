/**
 * Account Management Service
 * Manages imported trading accounts and their associated data
 */

import { Trade } from './trade-data.service'
import { DataStore } from './data-store.service'

export interface TradingAccount {
  id: string
  name: string
  broker: string
  brokerLogo?: string
  importDate: string
  lastUpdated: string
  trades: Trade[]
  balance: {
    starting: number
    current: number
    netPnl: number
  }
  stats: {
    totalTrades: number
    winRate: number
    profitFactor: number
    avgDailyPnl: number
    maxDrawdown: number
    bestDay: number
    worstDay: number
  }
  isActive: boolean
  description?: string
  tags?: string[]
}

export interface AccountSummary {
  id: string
  name: string
  broker: string
  brokerLogo?: string
  balance: number
  netPnl: number
  totalTrades: number
  winRate: number
  lastUpdated: string
  isActive: boolean
}

class AccountService {
  private static instance: AccountService
  private accounts: Map<string, TradingAccount> = new Map()
  private activeAccountId: string | null = null
  private listeners: Array<() => void> = []

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService()
    }
    return AccountService.instance
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('tradestial:accounts')
      const activeStored = localStorage.getItem('tradestial:active-account')
      
      if (stored) {
        const parsed = JSON.parse(stored)
        this.accounts = new Map(Object.entries(parsed))
      }
      
      if (activeStored) {
        this.activeAccountId = activeStored
      }
    } catch (error) {
      console.warn('AccountService: Failed to load from storage:', error)
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const accountsObj = Object.fromEntries(this.accounts)
      localStorage.setItem('tradestial:accounts', JSON.stringify(accountsObj))
      
      if (this.activeAccountId) {
        localStorage.setItem('tradestial:active-account', this.activeAccountId)
      } else {
        // Ensure stale active account key is cleared when none is active
        localStorage.removeItem('tradestial:active-account')
      }
    } catch (error) {
      console.warn('AccountService: Failed to save to storage:', error)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.warn('AccountService: Listener error:', error)
      }
    })
  }

  /**
   * Create a new trading account from imported data
   */
  async createAccount(
    name: string,
    broker: string,
    trades: Trade[],
    startingBalance: number = 10000,
    brokerLogo?: string,
    description?: string
  ): Promise<TradingAccount> {
    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    // Calculate account statistics
    const stats = this.calculateAccountStats(trades)
    const netPnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0)
    
    const account: TradingAccount = {
      id,
      name,
      broker,
      brokerLogo,
      importDate: now,
      lastUpdated: now,
      trades: [...trades],
      balance: {
        starting: startingBalance,
        current: startingBalance + netPnl,
        netPnl
      },
      stats,
      isActive: true,
      description,
      tags: [broker.toLowerCase()]
    }

    this.accounts.set(id, account)
    
    // Set as active if it's the first account
    if (this.accounts.size === 1 || !this.activeAccountId) {
      this.activeAccountId = id
    }
    
    this.saveToStorage()
    this.notifyListeners()
    
    return account
  }

  /**
   * Get all accounts summary
   */
  getAllAccountsSummary(): AccountSummary[] {
    return Array.from(this.accounts.values()).map(account => ({
      id: account.id,
      name: account.name,
      broker: account.broker,
      brokerLogo: account.brokerLogo,
      balance: account.balance.current,
      netPnl: account.balance.netPnl,
      totalTrades: account.stats.totalTrades,
      winRate: account.stats.winRate,
      lastUpdated: account.lastUpdated,
      isActive: account.isActive
    }))
  }

  /**
   * Get account by ID
   */
  getAccountById(id: string): TradingAccount | undefined {
    return this.accounts.get(id)
  }

  /**
   * Get all trades from all accounts
   */
  getAllTrades(): (Trade & { accountName: string; accountId: string })[] {
    const allTrades: (Trade & { accountName: string; accountId: string })[] = [];
    this.accounts.forEach(account => {
      account.trades.forEach(trade => {
        allTrades.push({ 
          ...trade, 
          accountName: account.name,
          accountId: account.id
        });
      });
    });
    return allTrades;
  }

  /**
   * Get active account
   */
  getActiveAccount(): TradingAccount | undefined {
    return this.activeAccountId ? this.accounts.get(this.activeAccountId) : undefined
  }

  /**
   * Set active account
   */
  setActiveAccount(id: string): boolean {
    if (this.accounts.has(id)) {
      this.activeAccountId = id
      this.saveToStorage()
      this.notifyListeners()
      return true
    }
    return false
  }

  /**
   * Update account details
   */
  async updateAccount(id: string, updates: Partial<TradingAccount>): Promise<boolean> {
    const account = this.accounts.get(id)
    if (!account) return false

    const updatedAccount = {
      ...account,
      ...updates,
      lastUpdated: new Date().toISOString()
    }

    // Recalculate stats if trades were updated
    if (updates.trades) {
      updatedAccount.stats = this.calculateAccountStats(updates.trades)
      const netPnl = updates.trades.reduce((sum, trade) => sum + trade.netPnl, 0)
      updatedAccount.balance = {
        ...updatedAccount.balance,
        current: updatedAccount.balance.starting + netPnl,
        netPnl
      }
    }

    this.accounts.set(id, updatedAccount)
    this.saveToStorage()
    this.notifyListeners()
    return true
  }

  /**
   * Delete account
   */
  async deleteAccount(id: string): Promise<boolean> {
    if (!this.accounts.has(id)) return false

    // Remove the account
    this.accounts.delete(id)

    // Determine new active account (first remaining) if needed
    const remainingIds = Array.from(this.accounts.keys())
    const deletedWasActive = this.activeAccountId === id
    if (deletedWasActive) {
      this.activeAccountId = remainingIds.length > 0 ? remainingIds[0] : null
    }

    // Keep DataStore in sync with the new active account or clear if none remain
    if (this.activeAccountId) {
      const next = this.accounts.get(this.activeAccountId)
      if (next) {
        await DataStore.replaceTrades(next.trades)
        await DataStore.setStartingBalance(next.balance.starting)
      }
    } else {
      // No accounts remain; clear app-level trades and balances
      DataStore.clearData()
    }

    this.saveToStorage()
    this.notifyListeners()
    return true
  }

  /**
   * Add trades to existing account
   */
  async addTradesToAccount(accountId: string, newTrades: Trade[]): Promise<boolean> {
    const account = this.accounts.get(accountId)
    if (!account) return false

    const updatedTrades = [...account.trades, ...newTrades]
    return this.updateAccount(accountId, { trades: updatedTrades })
  }

  /**
   * Switch DataStore to use specific account data
   */
  async switchToAccount(accountId: string): Promise<boolean> {
    const account = this.accounts.get(accountId)
    if (!account) return false

    // Update DataStore with account's trades and balance
    await DataStore.replaceTrades(account.trades)
    await DataStore.setStartingBalance(account.balance.starting)
    
    this.setActiveAccount(accountId)
    return true
  }

  /**
   * Sync current DataStore state to active account
   */
  async syncActiveAccount(): Promise<void> {
    if (!this.activeAccountId) return

    const currentTrades = DataStore.getAllTrades()
    const currentBalance = DataStore.getStartingBalance()
    
    await this.updateAccount(this.activeAccountId, {
      trades: currentTrades,
      balance: {
        starting: currentBalance,
        current: DataStore.getCurrentAccountBalance(),
        netPnl: currentTrades.reduce((sum, trade) => sum + trade.netPnl, 0)
      }
    })
  }

  /**
   * Get combined stats from all accounts
   */
  getCombinedStats() {
    const allAccounts = Array.from(this.accounts.values())
    const totalAccounts = allAccounts.length
    const activeAccounts = allAccounts.filter(acc => acc.isActive).length
    
    const totalTrades = allAccounts.reduce((sum, acc) => sum + acc.stats.totalTrades, 0)
    const totalPnl = allAccounts.reduce((sum, acc) => sum + acc.balance.netPnl, 0)
    const totalBalance = allAccounts.reduce((sum, acc) => sum + acc.balance.current, 0)
    const avgWinRate = totalAccounts > 0 
      ? allAccounts.reduce((sum, acc) => sum + acc.stats.winRate, 0) / totalAccounts 
      : 0

    return {
      totalAccounts,
      activeAccounts,
      totalTrades,
      totalPnl,
      totalBalance,
      avgWinRate
    }
  }

  /**
   * Subscribe to account changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private calculateAccountStats(trades: Trade[]) {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        avgDailyPnl: 0,
        maxDrawdown: 0,
        bestDay: 0,
        worstDay: 0
      }
    }

    const totalTrades = trades.length
    const winningTrades = trades.filter(t => t.netPnl > 0).length
    const winRate = (winningTrades / totalTrades) * 100

    const totalWins = trades.filter(t => t.netPnl > 0).reduce((sum, t) => sum + t.netPnl, 0)
    const totalLosses = Math.abs(trades.filter(t => t.netPnl < 0).reduce((sum, t) => sum + t.netPnl, 0))
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0

    // Group trades by day for daily stats
    const dailyGroups = trades.reduce((groups, trade) => {
      const day = trade.openDate.split('T')[0]
      if (!groups[day]) groups[day] = []
      groups[day].push(trade)
      return groups
    }, {} as Record<string, Trade[]>)

    const dailyPnls = Object.values(dailyGroups).map(dayTrades =>
      dayTrades.reduce((sum, t) => sum + t.netPnl, 0)
    )

    const avgDailyPnl = dailyPnls.length > 0 
      ? dailyPnls.reduce((sum, pnl) => sum + pnl, 0) / dailyPnls.length 
      : 0

    const bestDay = dailyPnls.length > 0 ? Math.max(...dailyPnls) : 0
    const worstDay = dailyPnls.length > 0 ? Math.min(...dailyPnls) : 0

    // Calculate max drawdown
    let peak = 0
    let maxDrawdown = 0
    let runningPnl = 0
    
    trades.forEach(trade => {
      runningPnl += trade.netPnl
      peak = Math.max(peak, runningPnl)
      maxDrawdown = Math.max(maxDrawdown, peak - runningPnl)
    })

    return {
      totalTrades,
      winRate,
      profitFactor,
      avgDailyPnl,
      maxDrawdown,
      bestDay,
      worstDay
    }
  }
}

export const accountService = AccountService.getInstance()
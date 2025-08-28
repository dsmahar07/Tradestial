import { Trade } from './trade-data.service'

/**
 * Dynamic filtering and aggregation pipeline for analytics
 * Supports complex filter combinations and real-time updates
 */

export interface AnalyticsFilter {
  // Date range filters
  dateRange?: {
    startDate: string
    endDate: string
    timezone?: string
  }
  
  // PnL metric selector
  pnlMetric?: 'NET' | 'GROSS'
  
  // Symbol filters
  symbols?: string[]
  excludeSymbols?: string[]
  
  // P&L filters
  pnlRange?: {
    min?: number
    max?: number
    metric: 'NET' | 'GROSS'
  }
  
  // Trade characteristics
  status?: ('WIN' | 'LOSS' | 'BREAKEVEN')[]
  side?: ('LONG' | 'SHORT')[]
  
  // Volume filters
  contractRange?: {
    min?: number
    max?: number
  }
  
  // Tag filters
  tags?: {
    include?: string[]
    exclude?: string[]
    mode: 'ANY' | 'ALL' // ANY = OR logic, ALL = AND logic
  }
  
  // Model filters
  models?: string[]
  excludeModels?: string[]
  
  // Rating filters
  ratingRange?: {
    min?: number
    max?: number
  }
  
  // Time-based filters
  timeFilters?: {
    entryTimeRange?: {
      start: string // HH:MM format
      end: string   // HH:MM format
    }
    daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
    monthsOfYear?: number[] // 1-12
  }
  
  // Advanced filters
  durationRange?: {
    min?: number // minutes
    max?: number // minutes
  }
  
  // Custom filter function
  customFilter?: (trade: Trade) => boolean
}

export interface AggregationConfig {
  groupBy: AggregationGroupBy[]
  timeframe?: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
  metrics: AggregationMetric[]
  sortBy?: {
    field: string
    direction: 'ASC' | 'DESC'
  }
  limit?: number
}

export type AggregationGroupBy = 
  | 'symbol' 
  | 'status' 
  | 'side' 
  | 'model' 
  | 'tag'
  | 'date'
  | 'hour'
  | 'dayOfWeek'
  | 'month'

export interface AggregationMetric {
  name: string
  function: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'MEDIAN' | 'STDDEV'
  field: keyof Trade | 'calculated'
  calculation?: (trades: Trade[]) => number
}

export interface FilterResult {
  trades: Trade[]
  metadata: {
    totalFiltered: number
    originalCount: number
    filterTime: number
    appliedFilters: string[]
  }
}

export interface AggregationResult {
  groups: AggregationGroup[]
  metadata: {
    totalGroups: number
    aggregationTime: number
    config: AggregationConfig
  }
}

export interface AggregationGroup {
  key: string | number
  label: string
  trades: Trade[]
  metrics: Record<string, number>
  count: number
}

export class AnalyticsFilterService {
  /**
   * Apply filters to trade data with performance optimization
   */
  static filterTrades(trades: Trade[], filter: AnalyticsFilter): FilterResult {
    const startTime = performance.now()
    const appliedFilters: string[] = []
    
    let filteredTrades = [...trades]

    // Date range filter
    if (filter.dateRange) {
      filteredTrades = this.applyDateRangeFilter(filteredTrades, filter.dateRange)
      appliedFilters.push('dateRange')
    }

    // Symbol filters
    if (filter.symbols?.length) {
      filteredTrades = filteredTrades.filter(trade => 
        filter.symbols!.some(symbol => 
          trade.symbol.toLowerCase().includes(symbol.toLowerCase())
        )
      )
      appliedFilters.push('symbols')
    }

    if (filter.excludeSymbols?.length) {
      filteredTrades = filteredTrades.filter(trade => 
        !filter.excludeSymbols!.some(symbol => 
          trade.symbol.toLowerCase().includes(symbol.toLowerCase())
        )
      )
      appliedFilters.push('excludeSymbols')
    }

    // P&L range filter
    if (filter.pnlRange) {
      filteredTrades = this.applyPnLRangeFilter(filteredTrades, filter.pnlRange)
      appliedFilters.push('pnlRange')
    }

    // Status filter
    if (filter.status?.length) {
      filteredTrades = filteredTrades.filter(trade => 
        filter.status!.includes(trade.status)
      )
      appliedFilters.push('status')
    }

    // Side filter
    if (filter.side?.length) {
      filteredTrades = filteredTrades.filter(trade => 
        filter.side!.includes(trade.side || 'LONG')
      )
      appliedFilters.push('side')
    }

    // Contract range filter
    if (filter.contractRange) {
      filteredTrades = this.applyContractRangeFilter(filteredTrades, filter.contractRange)
      appliedFilters.push('contractRange')
    }

    // Tag filters
    if (filter.tags) {
      filteredTrades = this.applyTagFilter(filteredTrades, filter.tags)
      appliedFilters.push('tags')
    }

    // Model filters
    if (filter.models?.length) {
      filteredTrades = filteredTrades.filter(trade => 
        trade.model && filter.models!.includes(trade.model)
      )
      appliedFilters.push('models')
    }

    if (filter.excludeModels?.length) {
      filteredTrades = filteredTrades.filter(trade => 
        !trade.model || !filter.excludeModels!.includes(trade.model)
      )
      appliedFilters.push('excludeModels')
    }

    // Rating range filter
    if (filter.ratingRange) {
      filteredTrades = this.applyRatingRangeFilter(filteredTrades, filter.ratingRange)
      appliedFilters.push('ratingRange')
    }

    // Time filters
    if (filter.timeFilters) {
      filteredTrades = this.applyTimeFilters(filteredTrades, filter.timeFilters)
      appliedFilters.push('timeFilters')
    }

    // Duration range filter
    if (filter.durationRange) {
      filteredTrades = this.applyDurationRangeFilter(filteredTrades, filter.durationRange)
      appliedFilters.push('durationRange')
    }

    // Custom filter
    if (filter.customFilter) {
      filteredTrades = filteredTrades.filter(filter.customFilter)
      appliedFilters.push('customFilter')
    }

    const filterTime = performance.now() - startTime

    return {
      trades: filteredTrades,
      metadata: {
        totalFiltered: filteredTrades.length,
        originalCount: trades.length,
        filterTime: Math.round(filterTime * 100) / 100,
        appliedFilters
      }
    }
  }

  /**
   * Aggregate filtered data with flexible grouping
   */
  static aggregateData(trades: Trade[], config: AggregationConfig): AggregationResult {
    const startTime = performance.now()
    
    // Group trades based on configuration
    let groups: Map<string, Trade[]> = new Map()

    if (config.groupBy.length === 0) {
      // No grouping - treat all trades as one group
      groups.set('all', trades)
    } else {
      groups = this.groupTrades(trades, config.groupBy, config.timeframe)
    }

    // Calculate metrics for each group
    const aggregationGroups: AggregationGroup[] = Array.from(groups.entries()).map(([key, groupTrades]) => {
      const metrics: Record<string, number> = {}
      
      for (const metric of config.metrics) {
        metrics[metric.name] = this.calculateMetric(groupTrades, metric)
      }

      return {
        key,
        label: this.generateGroupLabel(key, config.groupBy),
        trades: groupTrades,
        metrics,
        count: groupTrades.length
      }
    })

    // Sort groups if specified
    if (config.sortBy) {
      aggregationGroups.sort((a, b) => {
        const aValue = config.sortBy!.field === 'count' ? a.count : a.metrics[config.sortBy!.field]
        const bValue = config.sortBy!.field === 'count' ? b.count : b.metrics[config.sortBy!.field]
        
        const comparison = (aValue || 0) - (bValue || 0)
        return config.sortBy!.direction === 'ASC' ? comparison : -comparison
      })
    }

    // Apply limit if specified
    const limitedGroups = config.limit 
      ? aggregationGroups.slice(0, config.limit)
      : aggregationGroups

    const aggregationTime = performance.now() - startTime

    return {
      groups: limitedGroups,
      metadata: {
        totalGroups: aggregationGroups.length,
        aggregationTime: Math.round(aggregationTime * 100) / 100,
        config
      }
    }
  }

  /**
   * Create optimized filter combinations for common use cases
   */
  static createPresetFilter(preset: string, params?: any): AnalyticsFilter {
    switch (preset) {
      case 'last30Days':
        return {
          dateRange: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        }

      case 'winningTrades':
        return {
          status: ['WIN'],
          pnlRange: { min: 0, metric: 'NET' }
        }

      case 'losingTrades':
        return {
          status: ['LOSS'],
          pnlRange: { max: 0, metric: 'NET' }
        }

      case 'largeTrades':
        return {
          contractRange: { min: params?.minContracts || 10 }
        }

      case 'recentHighVolume':
        return {
          dateRange: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          },
          contractRange: { min: params?.minContracts || 5 }
        }

      case 'tradingHours':
        return {
          timeFilters: {
            entryTimeRange: { start: '09:30', end: '16:00' }
          }
        }

      case 'topPerformers':
        return {
          ratingRange: { min: 8 }
        }

      default:
        return {}
    }
  }

  // Private helper methods

  private static applyDateRangeFilter(trades: Trade[], dateRange: NonNullable<AnalyticsFilter['dateRange']>): Trade[] {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.openDate)
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      return tradeDate >= startDate && tradeDate <= endDate
    })
  }

  private static applyPnLRangeFilter(trades: Trade[], pnlRange: NonNullable<AnalyticsFilter['pnlRange']>): Trade[] {
    return trades.filter(trade => {
      const pnl = pnlRange.metric === 'GROSS' ? (trade.grossPnl || trade.netPnl) : trade.netPnl
      
      const minCheck = pnlRange.min === undefined || pnl >= pnlRange.min
      const maxCheck = pnlRange.max === undefined || pnl <= pnlRange.max
      
      return minCheck && maxCheck
    })
  }

  private static applyContractRangeFilter(trades: Trade[], contractRange: NonNullable<AnalyticsFilter['contractRange']>): Trade[] {
    return trades.filter(trade => {
      const contracts = trade.contractsTraded || 0
      
      const minCheck = contractRange.min === undefined || contracts >= contractRange.min
      const maxCheck = contractRange.max === undefined || contracts <= contractRange.max
      
      return minCheck && maxCheck
    })
  }

  private static applyTagFilter(trades: Trade[], tagFilter: NonNullable<AnalyticsFilter['tags']>): Trade[] {
    return trades.filter(trade => {
      const tradeTags = trade.tags || []
      
      // Include filter
      if (tagFilter.include?.length) {
        const hasIncluded = tagFilter.mode === 'ALL'
          ? tagFilter.include.every(tag => tradeTags.some(tradeTag => 
              tradeTag.toLowerCase().includes(tag.toLowerCase())
            ))
          : tagFilter.include.some(tag => tradeTags.some(tradeTag => 
              tradeTag.toLowerCase().includes(tag.toLowerCase())
            ))
        
        if (!hasIncluded) return false
      }

      // Exclude filter
      if (tagFilter.exclude?.length) {
        const hasExcluded = tagFilter.exclude.some(tag => tradeTags.some(tradeTag => 
          tradeTag.toLowerCase().includes(tag.toLowerCase())
        ))
        
        if (hasExcluded) return false
      }

      return true
    })
  }

  private static applyRatingRangeFilter(trades: Trade[], ratingRange: NonNullable<AnalyticsFilter['ratingRange']>): Trade[] {
    return trades.filter(trade => {
      const rating = trade.tradeRating || 0
      
      const minCheck = ratingRange.min === undefined || rating >= ratingRange.min
      const maxCheck = ratingRange.max === undefined || rating <= ratingRange.max
      
      return minCheck && maxCheck
    })
  }

  private static applyTimeFilters(trades: Trade[], timeFilters: NonNullable<AnalyticsFilter['timeFilters']>): Trade[] {
    return trades.filter(trade => {
      // Entry time range check
      if (timeFilters.entryTimeRange && trade.entryTime) {
        const entryMinutes = this.timeToMinutes(trade.entryTime)
        const startMinutes = this.timeToMinutes(timeFilters.entryTimeRange.start)
        const endMinutes = this.timeToMinutes(timeFilters.entryTimeRange.end)
        
        if (entryMinutes < startMinutes || entryMinutes > endMinutes) {
          return false
        }
      }

      // Days of week check
      if (timeFilters.daysOfWeek?.length) {
        const tradeDay = new Date(trade.openDate).getDay()
        if (!timeFilters.daysOfWeek.includes(tradeDay)) {
          return false
        }
      }

      // Months of year check
      if (timeFilters.monthsOfYear?.length) {
        const tradeMonth = new Date(trade.openDate).getMonth() + 1 // 1-based
        if (!timeFilters.monthsOfYear.includes(tradeMonth)) {
          return false
        }
      }

      return true
    })
  }

  private static applyDurationRangeFilter(trades: Trade[], durationRange: NonNullable<AnalyticsFilter['durationRange']>): Trade[] {
    return trades.filter(trade => {
      if (!trade.entryTime || !trade.exitTime) return true // Skip if no time data

      const duration = this.calculateTradeDuration(trade)
      if (duration === null) return true

      const minCheck = durationRange.min === undefined || duration >= durationRange.min
      const maxCheck = durationRange.max === undefined || duration <= durationRange.max
      
      return minCheck && maxCheck
    })
  }

  private static groupTrades(trades: Trade[], groupBy: AggregationGroupBy[], timeframe?: string): Map<string, Trade[]> {
    const groups = new Map<string, Trade[]>()

    for (const trade of trades) {
      const keyParts: string[] = []

      for (const groupByField of groupBy) {
        switch (groupByField) {
          case 'symbol':
            keyParts.push(trade.symbol)
            break
          case 'status':
            keyParts.push(trade.status)
            break
          case 'side':
            keyParts.push(trade.side || 'UNKNOWN')
            break
          case 'model':
            keyParts.push(trade.model || 'UNKNOWN')
            break
          case 'tag':
            keyParts.push((trade.tags || ['UNTAGGED']).join(','))
            break
          case 'date':
            keyParts.push(this.getDateGroupKey(trade.openDate, timeframe))
            break
          case 'hour':
            const hour = trade.entryTime ? parseInt(trade.entryTime.split(':')[0]) : 0
            keyParts.push(`${hour}:00`)
            break
          case 'dayOfWeek':
            const dayOfWeek = new Date(trade.openDate).getDay()
            keyParts.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek])
            break
          case 'month':
            const month = new Date(trade.openDate).getMonth()
            keyParts.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month])
            break
        }
      }

      const key = keyParts.join('|')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(trade)
    }

    return groups
  }

  private static calculateMetric(trades: Trade[], metric: AggregationMetric): number {
    if (trades.length === 0) return 0

    if (metric.calculation) {
      return metric.calculation(trades)
    }

    const values = trades
      .map(trade => this.getFieldValue(trade, metric.field))
      .filter((value): value is number => typeof value === 'number' && !isNaN(value))

    if (values.length === 0) return 0

    switch (metric.function) {
      case 'SUM':
        return values.reduce((sum, val) => sum + val, 0)
      case 'AVG':
        return values.reduce((sum, val) => sum + val, 0) / values.length
      case 'COUNT':
        return values.length
      case 'MIN':
        return Math.min(...values)
      case 'MAX':
        return Math.max(...values)
      case 'MEDIAN':
        const sorted = [...values].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      case 'STDDEV':
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
        return Math.sqrt(variance)
      default:
        return 0
    }
  }

  private static getFieldValue(trade: Trade, field: keyof Trade | 'calculated'): any {
    if (field === 'calculated') return 1 // For calculated metrics
    return trade[field as keyof Trade]
  }

  private static getDateGroupKey(dateString: string, timeframe?: string): string {
    const date = new Date(dateString)
    
    switch (timeframe) {
      case 'WEEK':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return weekStart.toISOString().split('T')[0]
      case 'MONTH':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      case 'QUARTER':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `${date.getFullYear()}-Q${quarter}`
      case 'YEAR':
        return String(date.getFullYear())
      default: // DAY
        return date.toISOString().split('T')[0]
    }
  }

  private static generateGroupLabel(key: string, groupBy: AggregationGroupBy[]): string {
    const keyParts = key.split('|')
    
    if (keyParts.length === 1 && groupBy.length === 1) {
      return keyParts[0]
    }
    
    const labels = keyParts.map((part, index) => {
      const field = groupBy[index]
      return `${field}: ${part}`
    })
    
    return labels.join(', ')
  }

  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  private static calculateTradeDuration(trade: Trade): number | null {
    if (!trade.entryTime || !trade.exitTime) return null

    const entryDate = new Date(`${trade.openDate} ${trade.entryTime}`)
    const exitDate = new Date(`${trade.closeDate} ${trade.exitTime}`)
    
    const diffMs = exitDate.getTime() - entryDate.getTime()
    return diffMs / (1000 * 60) // Convert to minutes
  }
}
export interface MetricValue {
  value: number | string
  formatted?: string
  change?: number
  changePercent?: number
  isPositive?: boolean
}

export interface ChartDataPoint {
  date: string
  value: number
  index?: number
}

export interface PerformanceChart {
  title: string
  data: ChartDataPoint[]
  color?: string
  timeframe?: 'Day' | 'Week' | 'Month'
}

export interface TooltipPayload {
  dataKey: string
  value: number
  color: string
  payload?: ChartDataPoint
}

export interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

export interface ChartDataWithMetrics extends ChartDataPoint {
  [metricName: string]: string | number | undefined
}

export type ChartType = 'Area' | 'Line' | 'Column'

export interface MetricCategory {
  [category: string]: string[]
}

export interface PerformanceMetrics {
  // Summary Tab Metrics
  netPnL: MetricValue
  winRate: MetricValue
  avgDailyWinRate: MetricValue
  profitFactor: MetricValue
  tradeExpectancy: MetricValue
  avgDailyWinLoss: MetricValue
  avgTradeWinLoss: MetricValue
  avgHoldTime: MetricValue
  avgNetTradePnL: MetricValue
  avgDailyNetPnL: MetricValue
  avgPlannedRMultiple: MetricValue
  avgRealizedRMultiple: MetricValue
  avgDailyVolume: MetricValue
  loggedDays: MetricValue
  maxDailyNetDrawdown: MetricValue
  avgNetDrawdown: MetricValue
  
  // Days Tab Additional Metrics
  largestLosingDay: MetricValue
  avgTradingDaysDuration: MetricValue
  largestProfitableDay: MetricValue
  stialScale: {
    current: number
    max: number
    color: 'red' | 'yellow' | 'green'
  }
  
  // Trades Tab Additional Metrics
  longsWinRate: MetricValue
  largestProfitableTrade: MetricValue
  largestLosingTrade: MetricValue
  longestTradeDuration: MetricValue
  shortsWinRate: MetricValue
}

export interface PerformanceData {
  metrics: PerformanceMetrics
  charts: {
    avgPlannedRMultiple: PerformanceChart
    avgLoss: PerformanceChart
  }
}

export type PerformanceTab = 'Summary' | 'Days' | 'Trades'
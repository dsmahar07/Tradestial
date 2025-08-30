import { NetPnlIcon, OrdersIcon, VisitorsIcon, RefundIcon, StreakIcon, ExpectancyIcon } from './custom-icons'
import { StreakDisplay } from './streak-display'
import { DataStore } from '@/services/data-store.service'

export interface AnalyticsCardConfig {
  title: string
  value: string
  change: number
  changeLabel: string
  delay: number
  icon: React.ComponentType<{ className?: string; size?: number }>
  customIcon: boolean
  valueColor?: string
  iconColor?: string
  showSemicircularIndicator?: boolean
  gaugeData?: Array<{ name: string; value: number; color: string }>
  showDonutIndicator?: boolean
  donutData?: Array<{ name: string; value: number; color: string }>
  showHorizontalBars?: boolean
  horizontalBarsData?: Array<{ name: string; value: number; color: string }>
  horizontalBarsFormatter?: (value: number, name: string) => string
  showCustomContent?: boolean
  customContent?: React.ReactNode
  showVerticalBars?: boolean
  verticalBarsData?: Array<{ name: string; value: number; color: string }>
  tradeCount?: number
}

// TradeCountLabel component to prevent re-creation
const TradeCountLabel = ({ tradeCount }: { tradeCount: number }) => (
  <div className="absolute bottom-2 right-2">
    <div 
      className="font-medium rounded-full inline-flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative group" 
      style={{ 
        color: '#6b7280', 
        backgroundColor: 'rgba(107, 114, 128, 0.15)', 
        padding: '2px 6px', 
        fontSize: '10px', 
        lineHeight: '1' 
      }}
    >
      {tradeCount}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        Total Trades
      </div>
    </div>
  </div>
)

// Get real-time data from DataStore
export const getAnalyticsCardsConfig = (): AnalyticsCardConfig[] => {
  // Prevent hydration mismatch by always returning empty state on server
  if (typeof window === 'undefined') {
    return getEmptyAnalyticsCards()
  }
  
  const trades = DataStore.getAllTrades()
  
  // If no trades, return empty state
  if (trades.length === 0) {
    return getEmptyAnalyticsCards()
  }
  
  const kpis = DataStore.calculateDashboardKPIs()
  const metrics = DataStore.calculateMetrics()
  const currentStreak = kpis.currentStreak
  
  return [
    {
      title: "NET PNL",
      value: kpis.netPnl.formatted,
      change: 0,
      changeLabel: "",
      delay: 0,
      icon: NetPnlIcon,
      customIcon: true,
      valueColor: kpis.netPnl.isPositive ? "#10b981" : "#ef4444",
      iconColor: "#10b981" // green to match NetPnlIcon gradient
    },
    {
      title: "Winrate",
      value: kpis.winRate.formatted,
      change: 0,
      changeLabel: "",
      delay: 0.1,
      icon: OrdersIcon,
      customIcon: true,
      iconColor: "#3b82f6", // blue to match OrdersIcon
      showSemicircularIndicator: true,
      gaugeData: [
        { name: 'Wins', value: metrics.winningTrades, color: '#10b981' },
        { name: 'Breakeven', value: 0, color: '#F6B51E' }, // Placeholder - would need breakeven calculation
        { name: 'Losses', value: metrics.losingTrades, color: '#ef4444' }
      ]
    },
    {
      title: "Profit Factor",
      value: kpis.profitFactor.formatted,
      change: 0,
      changeLabel: "",
      delay: 0.2,
      icon: VisitorsIcon,
      customIcon: true,
      valueColor: kpis.profitFactor.isPositive ? "#10b981" : "#ef4444",
      iconColor: "#8b5cf6", // purple to match VisitorsIcon
      showDonutIndicator: true,
      donutData: [
        { name: 'Profit', value: Math.round((metrics.totalWinAmount / (metrics.totalWinAmount + metrics.totalLossAmount)) * 100), color: '#10b981' },
        { name: 'Loss', value: Math.round((metrics.totalLossAmount / (metrics.totalWinAmount + metrics.totalLossAmount)) * 100), color: '#ef4444' }
      ]
    },
    {
      title: "Avg Win/Loss",
      value: kpis.avgWinLoss.formatted,
      change: 0,
      changeLabel: "",
      delay: 0.3,
      icon: RefundIcon,
      customIcon: true,
      iconColor: "#f59e0b", // amber to match RefundIcon
      showHorizontalBars: true,
      horizontalBarsData: [
        { name: 'Avg Win', value: Math.round(metrics.avgWinAmount), color: '#10b981' },
        { name: 'Avg Loss', value: Math.round(metrics.avgLossAmount), color: '#ef4444' }
      ]
    },
    {
      title: "Current streak",
      value: currentStreak.value.toString(),
      change: 0,
      changeLabel: `${currentStreak.type} streak`,
      delay: 0.4,
      icon: StreakIcon,
      customIcon: true,
      valueColor: currentStreak.type === 'win' ? "#10b981" : "#ef4444",
      iconColor: "#10b981", // green to match StreakIcon
      showVerticalBars: true,
      verticalBarsData: [
        { name: 'Win', value: currentStreak.type === 'win' ? currentStreak.value : 0, color: '#10b981' },
        { name: 'Loss', value: currentStreak.type === 'loss' ? currentStreak.value : 0, color: '#ef4444' }
      ]
    },
    {
      title: "Trade expectancy",
      value: kpis.tradeExpectancy.formatted,
      change: 0,
      changeLabel: "",
      delay: 0.5,
      icon: ExpectancyIcon,
      customIcon: true,
      valueColor: kpis.tradeExpectancy.value >= 0 ? "#10b981" : "#ef4444",
      iconColor: "#3b82f6" // blue to match ExpectancyIcon
    }
  ]
}

// Empty state for when no trades are imported
function getEmptyAnalyticsCards(): AnalyticsCardConfig[] {
  return [
    {
      title: "NET PNL",
      value: "$0.00",
      change: 0,
      changeLabel: "No trades imported",
      delay: 0,
      icon: NetPnlIcon,
      customIcon: true,
      valueColor: "#6b7280",
      iconColor: "#10b981"
    },
    {
      title: "Win Rate",
      value: "0%",
      change: 0,
      changeLabel: "Import trades to see analytics",
      delay: 0.1,
      icon: OrdersIcon,
      customIcon: true,
      valueColor: "#6b7280",
      showSemicircularIndicator: true,
      gaugeData: [
        { name: 'Wins', value: 0, color: '#10b981' },
        { name: 'Losses', value: 0, color: '#ef4444' }
      ]
    },
    {
      title: "Profit Factor",
      value: "0.00",
      change: 0,
      changeLabel: "Upload CSV to get started",
      delay: 0.2,
      icon: VisitorsIcon,
      customIcon: true,
      valueColor: "#6b7280",
      iconColor: "#8b5cf6",
      showDonutIndicator: true,
      donutData: [
        { name: 'Profit', value: 0, color: '#10b981' },
        { name: 'Loss', value: 0, color: '#ef4444' }
      ]
    },
    {
      title: "Avg Win/Loss",
      value: "0:0",
      change: 0,
      changeLabel: "Go to Import Data",
      delay: 0.3,
      icon: RefundIcon,
      customIcon: true,
      valueColor: "#6b7280",
      iconColor: "#f59e0b",
      showHorizontalBars: true,
      horizontalBarsData: [
        { name: 'Avg Win', value: 0, color: '#10b981' },
        { name: 'Avg Loss', value: 0, color: '#ef4444' }
      ]
    },
    {
      title: "Current Streak",
      value: "0",
      change: 0,
      changeLabel: "No streak",
      delay: 0.4,
      icon: StreakIcon,
      customIcon: true,
      valueColor: "#6b7280",
      iconColor: "#10b981",
      showVerticalBars: true,
      verticalBarsData: [
        { name: 'Win', value: 0, color: '#10b981' },
        { name: 'Loss', value: 0, color: '#ef4444' }
      ]
    },
    {
      title: "Trade Expectancy",
      value: "$0.00",
      change: 0,
      changeLabel: "Import trades first",
      delay: 0.5,
      icon: ExpectancyIcon,
      customIcon: true,
      valueColor: "#6b7280",
      iconColor: "#3b82f6"
    }
  ]
}

// Legacy export for components that haven't been updated yet
export const analyticsCardsConfig: AnalyticsCardConfig[] = getAnalyticsCardsConfig()
import { NetPnlIcon, OrdersIcon, VisitorsIcon, RefundIcon, StreakIcon, ExpectancyIcon } from './custom-icons'
import { StreakDisplay } from './streak-display'

export interface AnalyticsCardConfig {
  title: string
  value: string
  change: number
  changeLabel: string
  delay: number
  icon: React.ComponentType<{ className?: string; size?: number }>
  customIcon: boolean
  valueColor?: string
  showSemicircularIndicator?: boolean
  gaugeData?: Array<{ name: string; value: number; color: string }>
  showDonutIndicator?: boolean
  donutData?: Array<{ name: string; value: number; color: string }>
  showHorizontalBars?: boolean
  horizontalBarsData?: Array<{ name: string; value: number; color: string }>
  showCustomContent?: boolean
  customContent?: React.ReactNode
}

export const analyticsCardsConfig: AnalyticsCardConfig[] = [
  {
    title: "NET PNL",
    value: "$120,784.02",
    change: 12.3,
    changeLabel: "$145309 today",
    delay: 0,
    icon: NetPnlIcon,
    customIcon: true,
    valueColor: "#1FC16B"
  },
  {
    title: "Winrate",
    value: "57%",
    change: 20.1,
    changeLabel: "2,676 today",
    delay: 0.1,
    icon: OrdersIcon,
    customIcon: true,
    showSemicircularIndicator: true,
    gaugeData: [
      { name: 'Wins', value: 68, color: '#10b981' },
      { name: 'Draws', value: 1, color: '#3b82f6' },
      { name: 'Losses', value: 57, color: '#ef4444' }
    ]
  },
  {
    title: "Profit Factor",
    value: "2.3:1",
    change: 8.2,
    changeLabel: "vs last month",
    delay: 0.2,
    icon: VisitorsIcon,
    customIcon: true,
    valueColor: "#10b981",
    showDonutIndicator: true,
    donutData: [
      { name: 'Profit', value: 70, color: '#10b981' },
      { name: 'Loss', value: 30, color: '#ef4444' }
    ]
  },
  {
    title: "Avg Win/Loss",
    value: "2.04:1",
    change: 1.9,
    changeLabel: "vs last month",
    delay: 0.3,
    icon: RefundIcon,
    customIcon: true,
    showHorizontalBars: true,
    horizontalBarsData: [
      { name: 'Avg Win', value: 1000, color: '#10b981' },
      { name: 'Avg Loss', value: 789, color: '#ef4444' }
    ]
  },
  {
    title: "Current streak",
    value: "1",
    change: 0,
    changeLabel: "2 days",
    delay: 0.4,
    icon: StreakIcon,
    customIcon: true,
    valueColor: "#10b981",
    showCustomContent: true,
    customContent: (
      <StreakDisplay 
        streakDays={1}
        streakDaysLabel="2 days"
        streakTrades={1}
        streakTradesLabel="4 trades"
      />
    )
  },
  {
    title: "Trade expectancy",
    value: "$218.48",
    change: 0,
    changeLabel: "",
    delay: 0.5,
    icon: ExpectancyIcon,
    customIcon: true,
    valueColor: "#10b981"
  }
]
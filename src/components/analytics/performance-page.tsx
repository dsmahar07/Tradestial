'use client'

import { useState } from 'react'
import { PerformanceChart } from './performance-chart'
import { MetricGrid } from './metric-card'
import { ZellaScale } from './zella-scale'
import { PerformanceTabs } from './performance-tabs'
import { PerformanceTab, PerformanceData } from '@/types/performance'

// Mock data - in real app this would come from API/props
const mockPerformanceData: PerformanceData = {
  metrics: {
    netPnL: { value: 8700, isPositive: true },
    winRate: { value: 54.17, isPositive: true },
    avgDailyWinRate: { value: 64.71, isPositive: true },
    profitFactor: { value: 2.69, isPositive: true },
    tradeExpectancy: { value: 362.5, isPositive: true },
    avgDailyWinLoss: { value: 1.65, isPositive: true },
    avgTradeWinLoss: { value: 2.28, isPositive: true },
    avgHoldTime: { value: 19, formatted: '19m' },
    avgNetTradePnL: { value: 348, isPositive: true },
    avgDailyNetPnL: { value: 483.33, isPositive: true },
    avgPlannedRMultiple: { value: 0, formatted: '0R' },
    avgRealizedRMultiple: { value: 0, formatted: '0R' },
    avgDailyVolume: { value: 1.78 },
    loggedDays: { value: 10 },
    maxDailyNetDrawdown: { value: -2725, isPositive: false },
    avgNetDrawdown: { value: -716.43, isPositive: false },
    largestLosingDay: { value: -2725, isPositive: false },
    avgTradingDaysDuration: { value: 35, formatted: '35m' },
    largestProfitableDay: { value: 3082.5, isPositive: true },
    zellaScale: { current: 7.5, max: 10, color: 'green' },
    longsWinRate: { value: 47.37, isPositive: true },
    largestProfitableTrade: { value: 3510, isPositive: true },
    largestLosingTrade: { value: -1655, isPositive: false },
    longestTradeDuration: { value: 75, formatted: '1h 15m' },
    shortsWinRate: { value: 80, isPositive: true }
  },
  charts: {
    avgPlannedRMultiple: {
      title: 'Avg. planned r-multiple',
      data: [
        { date: '2024-06-19', value: 0 },
        { date: '2024-06-25', value: 0 },
        { date: '2024-07-01', value: 0 },
        { date: '2024-07-16', value: 0 },
        { date: '2024-07-22', value: 0 },
        { date: '2024-07-29', value: 0 }
      ],
      color: '#F97316',
      timeframe: 'Day'
    },
    avgLoss: {
      title: 'Avg loss - cumulative',
      data: [
        { date: '2024-06-16', value: 10 },
        { date: '2024-06-23', value: -50 },
        { date: '2024-06-30', value: -100 },
        { date: '2024-07-07', value: -200 },
        { date: '2024-07-14', value: -300 },
        { date: '2024-07-21', value: -400 },
        { date: '2024-07-28', value: -500 },
        { date: '2024-08-04', value: -580 },
        { date: '2024-08-11', value: -560 }
      ],
      color: '#F97316',
      timeframe: 'Week'
    }
  }
}

interface PerformancePageProps {
  data?: PerformanceData
}

export function PerformancePage({ data = mockPerformanceData }: PerformancePageProps) {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('Summary')

  const getSummaryMetrics = () => [
    { label: 'Net P&L', value: data.metrics.netPnL, hasTooltip: true },
    { label: 'Trade expectancy', value: data.metrics.tradeExpectancy, hasTooltip: true },
    { label: 'Avg net trade P&L', value: data.metrics.avgNetTradePnL, hasTooltip: true },
    { label: 'Avg daily volume', value: data.metrics.avgDailyVolume, hasTooltip: true },
    { label: 'Win %', value: data.metrics.winRate, hasTooltip: true },
    { label: 'Avg daily win/loss', value: data.metrics.avgDailyWinLoss, hasTooltip: true },
    { label: 'Avg daily net P&L', value: data.metrics.avgDailyNetPnL, hasTooltip: true },
    { label: 'Logged days', value: data.metrics.loggedDays, hasTooltip: true },
    { label: 'Avg daily win %', value: data.metrics.avgDailyWinRate, hasTooltip: true },
    { label: 'Avg trade win/loss', value: data.metrics.avgTradeWinLoss, hasTooltip: true },
    { label: 'Avg. planned r-multiple', value: data.metrics.avgPlannedRMultiple, hasTooltip: true },
    { label: 'Max daily net drawdown', value: data.metrics.maxDailyNetDrawdown, hasTooltip: true },
    { label: 'Profit factor', value: data.metrics.profitFactor, hasTooltip: true },
    { label: 'Avg hold time', value: data.metrics.avgHoldTime, hasTooltip: true },
    { label: 'Avg. realized r-multiple', value: data.metrics.avgRealizedRMultiple, hasTooltip: true },
    { label: 'Avg net drawdown', value: data.metrics.avgNetDrawdown, hasTooltip: true }
  ]

  const getDaysMetrics = () => [
    { label: 'Avg daily win %', value: data.metrics.avgDailyWinRate, hasTooltip: true },
    { label: 'Avg daily win/loss', value: data.metrics.avgDailyWinLoss, hasTooltip: true },
    { label: 'Largest profitable day', value: data.metrics.largestProfitableDay, hasTooltip: true, hasExternalLink: true },
    { label: 'Avg daily net P&L', value: data.metrics.avgDailyNetPnL, hasTooltip: true },
    { label: 'Largest losing day', value: data.metrics.largestLosingDay, hasTooltip: true, hasExternalLink: true },
    { label: 'Average trading days duration', value: data.metrics.avgTradingDaysDuration, hasTooltip: true }
  ]

  const getTradesMetrics = () => [
    { label: 'Win %', value: data.metrics.winRate, hasTooltip: true },
    { label: 'Avg trade win/loss', value: data.metrics.avgTradeWinLoss, hasTooltip: true },
    { label: 'Largest profitable trade', value: data.metrics.largestProfitableTrade, hasTooltip: true, hasExternalLink: true },
    { label: 'Longest trade duration', value: data.metrics.longestTradeDuration, hasTooltip: true },
    { label: 'Longs win %', value: data.metrics.longsWinRate, hasTooltip: true },
    { label: 'Trade expectancy', value: data.metrics.tradeExpectancy, hasTooltip: true },
    { label: 'Largest losing trade', value: data.metrics.largestLosingTrade, hasTooltip: true, hasExternalLink: true },
    { label: 'Shorts win %', value: data.metrics.shortsWinRate, hasTooltip: true },
    { label: 'Avg net trade P&L', value: data.metrics.avgNetTradePnL, hasTooltip: true },
    { label: 'Average trading days duration', value: data.metrics.avgTradingDaysDuration, hasTooltip: true }
  ]

  const getCurrentMetrics = () => {
    switch (activeTab) {
      case 'Days':
        return getDaysMetrics()
      case 'Trades':
        return getTradesMetrics()
      default:
        return getSummaryMetrics()
    }
  }

  const getMetricColumns = () => {
    switch (activeTab) {
      case 'Days':
        return 3
      case 'Trades':
        return 5
      default:
        return 4
    }
  }

  const showZellaScale = () => activeTab === 'Days' || activeTab === 'Trades'

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={data.charts.avgPlannedRMultiple} />
        <PerformanceChart data={data.charts.avgLoss} />
      </div>

      {/* Tabs */}
      <PerformanceTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      {/* Metrics Section */}
      <MetricGrid 
        metrics={getCurrentMetrics()} 
        columns={getMetricColumns()}
        zellaScale={showZellaScale() ? data.metrics.zellaScale : undefined}
      />
    </div>
  )
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}
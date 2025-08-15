/**
 * Centralized chart configuration and sample data
 * Replaces hardcoded chart data throughout the application
 */

import { themeColors } from './theme'

export interface PnLTrendDataPoint {
  period: string
  value: number
}

export interface ChartConfig {
  colors: {
    primary: string
    danger: string
    success: string
    warning: string
  }
  defaults: {
    height: number
    strokeWidth: number
  }
}

/**
 * Default chart configuration
 */
export const defaultChartConfig: ChartConfig = {
  colors: {
    primary: themeColors.primary,
    danger: themeColors.charts.danger,
    success: themeColors.charts.success,
    warning: themeColors.charts.warning
  },
  defaults: {
    height: 32,
    strokeWidth: 2
  }
}

/**
 * Sample P&L trend data showing decline
 * Used in statistics and trading dashboards
 */
export const samplePnLTrendData: PnLTrendDataPoint[] = [
  { period: '1', value: 100 },
  { period: '2', value: 80 },
  { period: '3', value: 50 },
  { period: '4', value: 20 },
  { period: '5', value: -200 },
  { period: '6', value: -400 },
  { period: '7', value: -666.56 }
]

/**
 * Sample P&L trend data showing growth
 * Alternative dataset for positive scenarios
 */
export const samplePositivePnLTrendData: PnLTrendDataPoint[] = [
  { period: '1', value: -100 },
  { period: '2', value: -50 },
  { period: '3', value: 25 },
  { period: '4', value: 120 },
  { period: '5', value: 280 },
  { period: '6', value: 450 },
  { period: '7', value: 666.56 }
]

/**
 * Chart color schemes for different chart types
 */
export const chartColorSchemes = {
  profit: {
    stroke: themeColors.charts.success,
    fill: `${themeColors.charts.success}20`, // 20% opacity
    gradient: [themeColors.charts.success, `${themeColors.charts.success}00`]
  },
  loss: {
    stroke: themeColors.charts.danger,
    fill: `${themeColors.charts.danger}20`, // 20% opacity
    gradient: [themeColors.charts.danger, `${themeColors.charts.danger}00`]
  },
  neutral: {
    stroke: themeColors.primary,
    fill: `${themeColors.primary}20`, // 20% opacity
    gradient: [themeColors.primary, `${themeColors.primary}00`]
  }
}

/**
 * Helper function to determine chart color scheme based on P&L value
 */
export const getChartColorScheme = (value: number) => {
  if (value > 0) return chartColorSchemes.profit
  if (value < 0) return chartColorSchemes.loss
  return chartColorSchemes.neutral
}

/**
 * Common chart dimensions
 */
export const chartDimensions = {
  mini: { width: '100%', height: 32 },
  small: { width: '100%', height: 60 },
  medium: { width: '100%', height: 120 },
  large: { width: '100%', height: 200 },
  xlarge: { width: '100%', height: 300 }
}
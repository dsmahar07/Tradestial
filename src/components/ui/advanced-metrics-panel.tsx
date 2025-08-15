'use client'

import { motion } from 'framer-motion'
import { Calculator, TrendingUp, Shield, Zap, Activity, Target } from 'lucide-react'

interface MetricCard {
  title: string
  value: string
  description: string
  category: 'performance' | 'risk' | 'efficiency'
  trend?: number
  benchmark?: string
  icon: any
}

const advancedMetrics: MetricCard[] = [
  {
    title: 'Information Ratio',
    value: '1.47',
    description: 'Risk-adjusted return relative to benchmark',
    category: 'performance',
    trend: 8.3,
    benchmark: '> 0.5 Good',
    icon: TrendingUp
  },
  {
    title: 'Treynor Ratio',
    value: '0.186',
    description: 'Return per unit of systematic risk',
    category: 'performance',
    trend: 12.1,
    benchmark: '> 0.1 Good',
    icon: Target
  },
  {
    title: 'Jensen\'s Alpha',
    value: '3.8%',
    description: 'Excess return over expected return',
    category: 'performance',
    trend: 15.7,
    benchmark: '> 0% Good',
    icon: Zap
  },
  {
    title: 'Tracking Error',
    value: '4.2%',
    description: 'Standard deviation of excess returns',
    category: 'risk',
    trend: -2.4,
    benchmark: '< 5% Good',
    icon: Activity
  },
  {
    title: 'Ulcer Index',
    value: '2.84',
    description: 'Measure of downside risk',
    category: 'risk',
    trend: -8.9,
    benchmark: '< 5 Good',
    icon: Shield
  },
  {
    title: 'Pain Index',
    value: '1.32',
    description: 'Average drawdown magnitude',
    category: 'risk',
    trend: -5.6,
    benchmark: '< 2 Good',
    icon: Shield
  },
  {
    title: 'Profit Factor',
    value: '2.34',
    description: 'Gross profit / Gross loss ratio',
    category: 'efficiency',
    trend: 6.8,
    benchmark: '> 1.5 Good',
    icon: Calculator
  },
  {
    title: 'Expectancy',
    value: '$156.23',
    description: 'Expected value per trade',
    category: 'efficiency',
    trend: 11.2,
    benchmark: '> $50 Good',
    icon: Calculator
  },
  {
    title: 'System Quality Number',
    value: '3.2',
    description: 'Overall system performance rating',
    category: 'efficiency',
    trend: 9.4,
    benchmark: '> 2.5 Good',
    icon: Target
  }
]

const riskMetricsDetailed = [
  {
    metric: 'Conditional VaR (95%)',
    value: '$3,245',
    description: 'Expected loss beyond VaR threshold'
  },
  {
    metric: 'Maximum Adverse Excursion',
    value: '$1,847',
    description: 'Largest unrealized loss during winning trades'
  },
  {
    metric: 'Maximum Favorable Excursion',
    value: '$4,692',
    description: 'Largest unrealized profit during losing trades'
  },
  {
    metric: 'Recovery Factor',
    value: '8.7',
    description: 'Net profit / Maximum drawdown ratio'
  }
]

export function AdvancedMetricsPanel() {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
      case 'risk': return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
      case 'efficiency': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendColor = (trend: number) => {
    return trend > 0 ? 'text-green-500' : 'text-red-500'
  }

  const categories = [
    { id: 'performance', label: 'Performance', metrics: advancedMetrics.filter(m => m.category === 'performance') },
    { id: 'risk', label: 'Risk Management', metrics: advancedMetrics.filter(m => m.category === 'risk') },
    { id: 'efficiency', label: 'Efficiency', metrics: advancedMetrics.filter(m => m.category === 'efficiency') }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-white dark:bg-[#171717] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Advanced Metrics & Ratios
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive performance analysis and risk metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">All systems operational</span>
        </div>
      </div>

      <div className="space-y-8">
        {categories.map((category, categoryIndex) => (
          <div key={category.id}>
            <div className="flex items-center space-x-2 mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {category.label}
              </h4>
              <div className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(category.id)}`}>
                {category.metrics.length} metrics
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {category.metrics.map((metric, index) => {
                const IconComponent = metric.icon
                return (
                  <motion.div
                    key={metric.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 + categoryIndex * 0.1 + index * 0.05 }}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg ${getCategoryColor(metric.category)} flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {metric.trend && (
                        <div className={`text-xs font-medium ${getTrendColor(metric.trend)}`}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.title}
                      </div>
                      
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {metric.value}
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {metric.description}
                      </div>
                      
                      {metric.benchmark && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          {metric.benchmark}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Detailed Risk Metrics */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Detailed Risk Analysis
            </h4>
            <div className="px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              Advanced
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskMetricsDetailed.map((item, index) => (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.metric}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1">
                <Calculator className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Performance Assessment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Risk-Adjusted Returns</div>
                    <p className="text-blue-700 dark:text-blue-300">
                      Sharpe (1.94), Sortino (2.1), and Information Ratio (1.47) all indicate strong risk-adjusted performance above market benchmarks.
                    </p>
                  </div>
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Risk Management</div>
                    <p className="text-blue-700 dark:text-blue-300">
                      Ulcer Index (2.84) and Pain Index (1.32) show well-controlled downside risk with manageable drawdown periods.
                    </p>
                  </div>
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">System Efficiency</div>
                    <p className="text-blue-700 dark:text-blue-300">
                      Profit Factor (2.34) and positive Expectancy ($156.23) demonstrate a robust and profitable trading system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
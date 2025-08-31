'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Shield, TrendingDown, Activity } from 'lucide-react'

interface RiskMetric {
  label: string
  value: string
  subValue?: string
  status: 'good' | 'warning' | 'danger'
  description: string
}

const riskMetrics: RiskMetric[] = [
  {
    label: 'Max Drawdown',
    value: '8.7%',
    subValue: '$10,450',
    status: 'good',
    description: 'Largest peak-to-trough decline'
  },
  {
    label: 'Value at Risk (95%)',
    value: '$2,340',
    status: 'good',
    description: 'Maximum expected loss in 1 day'
  },
  {
    label: 'Risk of Ruin',
    value: '2.1%',
    status: 'good',
    description: 'Probability of losing all capital'
  },
  {
    label: 'Kelly Criterion',
    value: '12.5%',
    status: 'warning',
    description: 'Optimal position size percentage'
  },
  {
    label: 'Calmar Ratio',
    value: '2.8',
    status: 'good',
    description: 'Annual return / Max drawdown'
  },
  {
    label: 'Sortino Ratio',
    value: '1.94',
    status: 'good',
    description: 'Risk-adjusted return (downside)'
  },
  {
    label: 'Beta',
    value: '0.73',
    status: 'good',
    description: 'Correlation with market'
  },
  {
    label: 'Volatility',
    value: '18.2%',
    status: 'warning',
    description: 'Annualized standard deviation'
  }
]

export function RiskMetricsPanel() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'danger': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return Shield
      case 'warning': return AlertTriangle
      case 'danger': return TrendingDown
      default: return Activity
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 dark:bg-green-900/20'
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20'
      case 'danger': return 'bg-red-100 dark:bg-red-900/20'
      default: return 'bg-gray-100 dark:bg-gray-800'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Risk Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Portfolio risk metrics and analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Risk Level: Low</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskMetrics.map((metric, index) => {
          const StatusIcon = getStatusIcon(metric.status)
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-lg ${getStatusBg(metric.status)} flex items-center justify-center`}>
                    <StatusIcon className={`w-4 h-4 ${getStatusColor(metric.status)}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {metric.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {metric.description}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className={`text-xl font-bold ${getStatusColor(metric.status)}`}>
                  {metric.value}
                </div>
                {metric.subValue && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metric.subValue}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Risk Assessment
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Your current risk profile is within acceptable parameters. Consider reducing position sizes 
              if volatility increases above 20% or if drawdown exceeds 10%.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
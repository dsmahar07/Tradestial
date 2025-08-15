'use client'

import { EyeIcon } from '@heroicons/react/24/outline'

interface TradeExecutionsProps {
  trade: any
}

const executionData = [
  {
    dateTime: '08-12-2025 19:48:37',
    price: '$23,722',
    quantity: 1,
    grossPnl: '$0'
  },
  {
    dateTime: '08-12-2025 20:40:37',
    price: '$23,823.25',
    quantity: -1,
    grossPnl: '$2,025'
  }
]

export function TradeExecutions({ trade }: TradeExecutionsProps) {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          2 executions
        </h3>
        <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center">
          <EyeIcon className="w-4 h-4 mr-1" />
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date/Time (US/Eastern)
              </th>
              <th className="text-right py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="text-right py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantity
              </th>
              <th className="text-right py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gross P&L
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {executionData.map((execution, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-3 text-sm text-gray-900 dark:text-white">
                  {execution.dateTime}
                </td>
                <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                  {execution.price}
                </td>
                <td className="py-3 text-sm text-gray-900 dark:text-white text-right">
                  {execution.quantity}
                </td>
                <td className="py-3 text-sm font-medium text-right">
                  <span className={execution.grossPnl === '$0' ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}>
                    {execution.grossPnl}
                  </span>
                </td>
                <td className="py-3">
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span className="text-xs">⚡</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
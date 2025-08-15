'use client'

interface TradeChartProps {
  trade: any
}

export function TradeChart({ trade }: TradeChartProps) {
  return (
    <div className="p-6">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <div className="mb-4">📊</div>
        <p>Chart view for {trade.symbol} would be displayed here</p>
      </div>
    </div>
  )
}
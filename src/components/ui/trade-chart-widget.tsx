'use client'

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine,
  CartesianGrid 
} from 'recharts'

interface TradeData {
  time: string
  value: number
}

interface TradeStats {
  totalTrades: number
  winners: number
  losers: number
  winrate: string
  grossPnl: number
  volume: number
  commissions: number
  profitFactor: number
}

interface TradeChartWidgetProps {
  date: string
  netPnl: number
  isProfit: boolean
  chartData: TradeData[]
  stats: TradeStats
  className?: string
}

export function TradeChartWidget({ 
  date, 
  netPnl, 
  isProfit, 
  chartData, 
  stats, 
  className = "" 
}: TradeChartWidgetProps) {
  return (
    <div className={`bg-white dark:bg-[#171717] rounded-xl shadow-sm w-full max-w-[1059px] ${className}`}>
      {/* Card Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {date}
            </span>
            <div className={`text-lg font-semibold ${
              isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              Net P&L ${netPnl}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart and Stats Section */}
      <div className="px-6 py-4">
        <div className="flex flex-row gap-8">
          {/* Chart */}
          <div className="flex-shrink-0">
            <div className="w-full sm:w-[380px] h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 40, bottom: 5 }}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                    domain={[0, 'dataMax + 10']}
                    width={35}
                  />
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb" 
                    horizontal={true}
                    vertical={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-2">
                            <p className="text-xs font-medium">{data.time}</p>
                            <p className={`text-xs font-medium ${
                              data.value >= 0 ? "text-emerald-500" : "text-red-500"
                            }`}>
                              ${data.value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                      <stop offset="100%" stopColor="rgba(34, 197, 94, 0.3)" />
                    </linearGradient>
                    <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                      <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Green area for positive parts */}
                  <Area
                    type="monotone"
                    dataKey={(data) => data.value >= 0 ? data.value : 0}
                    stroke="none"
                    fill="url(#greenGradient)"
                    fillOpacity={0.7}
                    isAnimationActive={false}
                    baseValue={0}
                  />
                  
                  {/* Red area for negative parts */}
                  <Area
                    type="monotone"
                    dataKey={(data) => data.value < 0 ? data.value : 0}
                    stroke="none"
                    fill="url(#redGradient)"
                    fillOpacity={0.7}
                    isAnimationActive={false}
                    baseValue={0}
                  />
                  
                  {/* Main stroke line */}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2E22B9"
                    strokeWidth={2}
                    fill="transparent"
                    isAnimationActive={false}
                    dot={false}
                  />
                  
                  {/* Reference line at zero */}
                  <ReferenceLine
                    y={0}
                    stroke="#94a3b8"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* First Row */}
              <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
                <div className="pr-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total trades</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.totalTrades}
                  </div>
                </div>
                <div className="px-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winners</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.winners}
                  </div>
                </div>
                <div className="px-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross P&L</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${stats.grossPnl}
                  </div>
                </div>
                <div className="pl-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commissions</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${stats.commissions}
                  </div>
                </div>
              </div>
              
              {/* Second Row */}
              <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-gray-700">
                <div className="pr-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winrate</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.winrate}
                  </div>
                </div>
                <div className="px-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Losers</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.losers}
                  </div>
                </div>
                <div className="px-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Volume</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.volume}
                  </div>
                </div>
                <div className="pl-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit factor</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.profitFactor}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState, useCallback } from 'react';
import { useTheme } from '@/hooks/use-theme';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn, formatCurrencyValue } from '@/lib/utils';
import { usePnLData } from '@/components/hooks/usePnLData';

interface PnLChartProps {
  className?: string;
  title?: string;
  timeRange?: '7D' | '1M' | '3M' | 'YTD' | 'ALL';
}

const PnLChart: React.FC<PnLChartProps> = React.memo(({ 
  className, 
  title = "Cumulative P&L",
  timeRange = 'ALL'
}) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [hoverInfo, setHoverInfo] = useState<null | { date: string, value: number }>(null);
  
  const { chartData, hasData, isLoading, error } = usePnLData(timeRange);

  const handleMouseMove = useCallback((data: any) => {
    if (data?.activePayload?.[0]) {
      const payload = data.activePayload[0].payload;
      setHoverInfo({
        date: payload.fullDate,
        value: payload.pnl
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  if (isLoading) {
    return (
      <div className={cn("h-96 flex items-center justify-center", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("h-96 flex items-center justify-center text-red-500", className)}>
        Error loading chart data: {error}
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={cn("h-96 flex items-center justify-center text-gray-500", className)}>
        No trading data available
      </div>
    );
  }

  const lastPoint = chartData[chartData.length - 1];
  const firstPoint = chartData[0];
  const totalPnL = lastPoint?.pnl || 0;
  const change = totalPnL - (firstPoint?.pnl || 0);
  const isPositive = change >= 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4 space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold">
            {formatCurrencyValue(totalPnL)}
          </div>
          <div className={cn(
            "flex items-center space-x-1 text-sm px-2 py-1 rounded",
            isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
          )}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span>{formatCurrencyValue(Math.abs(change))}</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? "#10b981" : "#ef4444"} 
                  stopOpacity={0.8}
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? "#10b981" : "#ef4444"} 
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDarkTheme ? '#9ca3af' : '#6b7280' }}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDarkTheme ? '#9ca3af' : '#6b7280' }}
              tickFormatter={(value) => formatCurrencyValue(value)}
            />
            
            <ReferenceLine 
              y={0} 
              stroke={isDarkTheme ? '#374151' : '#d1d5db'} 
              strokeDasharray="3 3" 
            />
            
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                return (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                    <p className="text-sm font-medium">{label}</p>
                    <p className={cn(
                      "text-sm font-semibold",
                      payload[0].value >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      P&L: {formatCurrencyValue(payload[0].value as number)}
                    </p>
                  </div>
                );
              }}
            />
            
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill="url(#pnlGradient)"
              dot={false}
              activeDot={{ r: 4, fill: isPositive ? "#10b981" : "#ef4444" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

PnLChart.displayName = 'PnLChart';

export default PnLChart;
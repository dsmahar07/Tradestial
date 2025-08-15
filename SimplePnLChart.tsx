import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { ArrowUp, ArrowDown, LineChart } from 'lucide-react';
// import { getImportedTrades, subscribeToTradeUpdates, getAccountStartingBalance } from '@/components/modals/ImportTradesModal';
import { cn } from '@/lib/utils';
// import { ChartWidget } from '@/components/dashboard/ChartWidget';
// import { prepareEquityCurveData } from '@/lib/tradeAnalyticsService';

// Temporary utility functions
const formatNumber = (num: number) => num.toLocaleString();
const formatCurrencyValue = (num: number) => `$${num.toLocaleString()}`;
const logger = { error: console.error, debug: console.log };

// Temporary placeholder functions for missing imports
const getImportedTrades = (): any[] => [];
const subscribeToTradeUpdates = (callback: (trades: any[]) => void) => {
  // Return a cleanup function
  return () => {};
};
const getAccountStartingBalance = () => 10000;
const prepareEquityCurveData = (trades: any[]): any[] => [];

interface SimplePnLChartProps {
  className?: string;
  title?: string;
}

interface DataPoint {
  date: string;
  fullDate: string;
  pnl: number;
  pnlFormatted: string;
  equity?: number;
  equityFormatted?: string;
}

type TimeRangeType = '7D' | '1M' | '3M' | 'YTD' | 'ALL';

const SimplePnLChart: React.FC<SimplePnLChartProps> = ({ className, title = "Cumulative P&L" }) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const [trades, setTrades] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('ALL');
  const [hasData, setHasData] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<null | { date: string, value: number }>(null);
  const [selectedPoint, setSelectedPoint] = useState<null | { date: string, value: number }>(null);
  const [zoomedDate, setZoomedDate] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the global starting balance
  const [startingBalance, setStartingBalance] = useState(getAccountStartingBalance());
  
  // Update starting balance when it changes globally
  useEffect(() => {
    const updateStartingBalance = () => {
      setStartingBalance(getAccountStartingBalance());
    };
    
    // Subscribe to trade updates which would also trigger when starting balance changes
    const unsubscribe = subscribeToTradeUpdates(() => {
      updateStartingBalance();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Subscribe to trade updates
  useEffect(() => {
    // Set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      // Get initial trades
      const initialTrades = getImportedTrades();
              logger.debug('Raw imported trades:', initialTrades);
      
      // Validate trades data
      const validTrades = initialTrades.filter(trade => {
        // Check if trade has required fields
        const hasRequiredFields = 
          trade && 
          trade.date && 
          trade.pnl !== undefined;
        
        // Check if PnL is a valid number
        const isPnLValid = 
          typeof trade.pnl === 'number' && 
          !isNaN(trade.pnl);
        
        return hasRequiredFields && isPnLValid;
      });
      
      // Log total P&L of all trades to verify data
      if (validTrades && validTrades.length > 0) {
        const totalPnL = validTrades.reduce((sum, trade) => {
          // Use type assertion to access properties that might not be in the type definition
          const anyTrade = trade as any;
          const pnl = anyTrade.Profit !== undefined 
            ? parseFloat(anyTrade.Profit.toString()) 
            : (trade.pnl !== undefined ? parseFloat(trade.pnl.toString()) : 0);
          return sum + pnl;
        }, 0);
                 logger.debug(`VERIFICATION: Total P&L across all ${validTrades.length} trades: $${totalPnL.toFixed(2)}`);
      }
      
      setTrades(validTrades);
      setHasData(validTrades && validTrades.length > 0);
      setIsLoading(false);
      
      // Subscribe to updates
      const unsubscribe = subscribeToTradeUpdates((updatedTrades) => {
        try {
                     logger.debug('Trade updates received:', updatedTrades.length);
          
          // Filter for valid trades
          const validUpdatedTrades = updatedTrades.filter(trade => {
            // Check if trade has required fields
            const hasRequiredFields = 
              trade && 
              trade.date && 
              trade.pnl !== undefined;
            
            // Check if PnL is a valid number
            const isPnLValid = 
              typeof trade.pnl === 'number' && 
              !isNaN(trade.pnl);
            
            return hasRequiredFields && isPnLValid;
          });
          
          setTrades(validUpdatedTrades);
          setHasData(validUpdatedTrades && validUpdatedTrades.length > 0);
          setIsLoading(false);
        } catch (err) {
          logger.error("Error processing trade updates:", err);
          // Don't show error for trade update issues - just set empty state
          setError(null);
          setIsLoading(false);
          setTrades([]);
          setHasData(false);
        }
      });
      
      // Listen for account switches
      const handleAccountSwitch = () => {
        logger.debug("SimplePnLChart: Account switched, reloading data");
        window.location.reload(); // Force full reload for this complex component
      };
      
      window.addEventListener('account-switched', handleAccountSwitch);
      window.addEventListener('trades-force-reload', handleAccountSwitch);
      
      return () => {
        unsubscribe();
        window.removeEventListener('account-switched', handleAccountSwitch);
        window.removeEventListener('trades-force-reload', handleAccountSwitch);
      };
    } catch (err) {
      logger.error("Error loading trades:", err);
      // Don't show error for empty trades - just set empty state
      setError(null);
      setIsLoading(false);
      setTrades([]);
      setHasData(false);
    }
  }, []);
  
  // Calculate cumulative P&L data properly
  const filteredData = useMemo<DataPoint[]>(() => {
    try {
      if (!trades || !trades.length) return [];
      
      logger.debug('SimplePnLChart: Processing trades:', trades.length);
      logger.debug('SimplePnLChart: Starting balance:', startingBalance);
      
      // Sort trades chronologically
      const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Add starting point at zero
      const result: DataPoint[] = [{
        date: "Start",
        fullDate: "Starting Point",
        pnl: 0,
        pnlFormatted: formatCurrencyValue(0),
        equity: startingBalance,
        equityFormatted: formatCurrencyValue(startingBalance)
      }];
      
      // Calculate cumulative P&L
      let cumulativePnL = 0;
      
      sortedTrades.forEach((trade, index) => {
        cumulativePnL += trade.pnl;
        const tradeDate = new Date(trade.date);
        
        result.push({
          date: `${tradeDate.getMonth() + 1}/${tradeDate.getDate()}`,
          fullDate: tradeDate.toISOString().split('T')[0],
          pnl: Number(cumulativePnL.toFixed(2)), // Cumulative P&L from zero
          pnlFormatted: formatCurrencyValue(cumulativePnL),
          equity: startingBalance + cumulativePnL,
          equityFormatted: formatCurrencyValue(startingBalance + cumulativePnL)
        });
      });
      
      logger.debug('SimplePnLChart: Final cumulative P&L:', cumulativePnL);
      logger.debug('SimplePnLChart: Data points:', result.length);
      
      // Verify against direct sum for debugging
      const directSum = trades.reduce((sum, trade) => sum + trade.pnl, 0);
      logger.debug('SimplePnLChart: Direct sum verification:', directSum);
      logger.debug('SimplePnLChart: Difference from cumulative:', Math.abs(cumulativePnL - directSum));
      
      return result;
    } catch (err) {
      logger.error("Error preparing filtered data:", err);
      return [{
        date: new Date().toLocaleDateString('en-US'),
        fullDate: new Date().toISOString().split('T')[0],
        pnl: 0,
        pnlFormatted: formatCurrencyValue(0),
        equity: startingBalance,
        equityFormatted: formatCurrencyValue(startingBalance)
      }];
    }
  }, [trades, startingBalance]);
  
  // Memo-ize the processed data with zero-crossing points for proper gradient locking
  const processedData = useMemo<DataPoint[]>(() => {
    if (!filteredData.length) return filteredData;
    
    const result: DataPoint[] = [];
    
    for (let i = 0; i < filteredData.length; i++) {
      const current = filteredData[i];
      const next = filteredData[i + 1];
      
      result.push(current);
      
      // Add zero-crossing point when transitioning from negative to positive or vice versa
      if (next && 
          ((current.pnl < 0 && next.pnl > 0) || (current.pnl > 0 && next.pnl < 0))) {
        
        // Calculate interpolated date between current and next
        const currentDate = new Date(current.fullDate || current.date);
        const nextDate = new Date(next.fullDate || next.date);
        const midDate = new Date((currentDate.getTime() + nextDate.getTime()) / 2);
        
        // Add zero-crossing point
        result.push({
          date: `${midDate.getMonth() + 1}/${midDate.getDate()}`,
          fullDate: midDate.toISOString().split('T')[0],
          pnl: 0,
          pnlFormatted: formatCurrencyValue(0),
          equity: startingBalance,
          equityFormatted: formatCurrencyValue(startingBalance)
        });
      }
    }
    
    return result;
  }, [filteredData, startingBalance]);
  
  // Verify calculation function - used for debugging
  const verifyEquityCalculation = () => {
    // Calculate the sum of all trade PnLs
    const totalPnL = trades.reduce((sum, trade) => {
      const pnl = typeof trade.pnl === 'number' ? trade.pnl : parseFloat(String(trade.pnl) || '0');
      return sum + pnl;
    }, 0);
    
    // Get the latest PnL value
    const finalPnL = processedData.length > 0 ? processedData[processedData.length - 1].pnl : 0;
    const initialPnL = processedData.length > 0 ? processedData[0].pnl : 0;
    const pnLCurveTotal = finalPnL - initialPnL;
    
    // Compare calculations and return data for debugging
    return {
      totalPnL: totalPnL,
      pnLCurveTotal: pnLCurveTotal,
      discrepancy: pnLCurveTotal - totalPnL,
      percentError: totalPnL !== 0 ? Math.abs((pnLCurveTotal - totalPnL) / totalPnL) * 100 : 0,
      verification: Math.abs(pnLCurveTotal - totalPnL) < 0.01 ? 'PASS' : 'FAIL'
    };
  };
  
  // Enable debug logging when debug mode is activated
  useEffect(() => {
    if (debugMode) {
      logger.debug('Debug mode enabled');
      logger.debug('Verification:', verifyEquityCalculation());
    }
  }, [debugMode, trades, processedData]);
  
  // Trading stats component to display below the chart
  const TradingStats = () => {
    // Safely calculate total PnL with error handling
    try {
      const totalPnL = calculateTotalPnL(filteredData);
      const totalPnLFormatted = formatCurrencyValue(totalPnL);
      const isPositive = totalPnL > 0;
      const isNegative = totalPnL < 0;
      const isBreakEven = totalPnL === 0;
      
      // Calculate trading days safely
      const tradingDays = calculateTradingDays(filteredData);
      
      return (
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Trades:</span>
            <span className="font-mono">{trades.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Days:</span>
            <span className="font-mono">{tradingDays}</span>
          </div>
          <div 
            className={cn(
              "flex items-center space-x-2",
              isPositive && "text-success",
              isNegative && "text-danger",
              isBreakEven && "text-muted-foreground"
            )}
          >
            <span className="text-sm font-medium">P&L:</span>
            <span className="font-mono flex items-center">
              {isPositive && <ArrowUp className="w-3 h-3 mr-1" />}
              {isNegative && <ArrowDown className="w-3 h-3 mr-1" />}
              {totalPnLFormatted}
            </span>
          </div>
        </div>
      );
    } catch (err) {
      logger.error("Error rendering trading stats:", err);
      // Return a simplified version on error
      return (
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Trades:</span>
            <span className="font-mono">{trades.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Days:</span>
            <span className="font-mono">-</span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <span className="text-sm font-medium">P&L:</span>
            <span className="font-mono">-</span>
          </div>
        </div>
      );
    }
  };
  
  // Calculate total PnL correctly - use the final cumulative value
  const calculateTotalPnL = (data: any[]): number => {
    try {
      // Handle empty datasets
      if (!data || data.length === 0) return 0;
      
      // For cumulative P&L data, just use the last value
      if (data.length > 0 && data[data.length - 1].pnl !== undefined) {
        return Number(data[data.length - 1].pnl.toFixed(2));
      }
      
      return 0;
    } catch (err) {
      logger.error("Error calculating total PnL:", err);
      return 0;
    }
  };
  
  // Calculate number of unique trading days
  const calculateTradingDays = (data: any[]): number => {
    try {
      // Handle empty datasets
      if (!data || data.length === 0) return 0;
      
      const uniqueDates = new Set();
      
      // For equity curve data, count all points since each is a unique day
      if (data[0].fullDate !== undefined) {
        data.forEach(item => {
          if (item.fullDate) {
            uniqueDates.add(item.fullDate);
          }
        });
        return uniqueDates.size;
      }
      
      // For raw trade data, extract unique dates
      data.forEach(item => {
        if (item.date) {
          const dateObj = item.date instanceof Date ? item.date : new Date(item.date);
          if (!isNaN(dateObj.getTime())) {
            uniqueDates.add(dateObj.toISOString().split('T')[0]);
          }
        }
      });
      
      return uniqueDates.size;
    } catch (err) {
      logger.error("Error calculating trading days:", err);
      return 0; // Return 0 on error
    }
  };

  // Render chart
  return (
    <div className={cn("w-full h-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg p-4", className)}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="h-full flex flex-col">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <LineChart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Loading data...</p>
          </div>
        ) : error ? (
          // Don't show error - treat as empty state
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <LineChart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No trade data available</p>
            <p className="text-xs mt-1">Import trades to see P&L chart</p>
          </div>
        ) : hasData && processedData.length > 0 ? (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={processedData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    stroke={isDarkTheme ? "#e2e8f0" : "#64748b"}
                    fontSize={12}
                    interval="preserveEnd"
                    minTickGap={30}
                    tickMargin={8}
                    height={30}
                    padding={{ left: 0, right: 0 }}
                    tick={{ 
                      fill: isDarkTheme ? "#e2e8f0" : "#64748b", 
                      fontWeight: 500,
                      fontSize: 12
                    }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    stroke={isDarkTheme ? "#e2e8f0" : "#64748b"}
                    fontSize={15}
                    width={85}
                    tickFormatter={formatAxisValue}
                    domain={[
                      (dataMin: number) => Math.floor(Math.min(0, dataMin) * 1.1),
                      (dataMax: number) => Math.ceil(Math.max(0, dataMax) * 1.2)
                    ]}
                    padding={{ top: 10, bottom: 10 }}
                    scale="linear"
                    mirror={false}
                    tick={{ 
                      fill: isDarkTheme ? "#e2e8f0" : "#64748b", 
                      fontWeight: 500,
                      fontSize: 15,
                      dx: -10
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 space-y-1">
                            <p className="text-sm font-medium">{data.fullDate}</p>
                            <p className={cn(
                              "text-sm font-medium",
                              data.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                              P&L: {data.pnlFormatted}
                            </p>
                            {data.equity && (
                              <p className="text-xs text-muted-foreground">
                                Balance: {data.equityFormatted}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
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
                    dataKey={(data) => data.pnl >= 0 ? data.pnl : 0}
                    stroke="none"
                    fill="url(#greenGradient)"
                    fillOpacity={0.7}
                    isAnimationActive={false}
                    baseValue={0}
                    activeDot={false}
                    connectNulls={true}
                  />
                  
                  {/* Red area for negative parts */}
                  <Area
                    type="monotone"
                    dataKey={(data) => data.pnl < 0 ? data.pnl : 0}
                    stroke="none"
                    fill="url(#redGradient)"
                    fillOpacity={0.7}
                    isAnimationActive={false}
                    baseValue={0}
                    activeDot={false}
                    connectNulls={true}
                  />
                  
                  {/* Main stroke line */}
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke="#2E22B9"
                    strokeWidth={2}
                    fill="transparent"
                    isAnimationActive={false}
                    dot={false}
                    connectNulls={true}
                    activeDot={{
                      r: 6,
                      fill: "#403DED",
                      stroke: "#fff",
                      strokeWidth: 2
                    }}
                  />
                  {/* Add reference line at zero */}
                  <ReferenceLine
                    y={0}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                  />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <LineChart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No data available for the selected time period</p>
            <p className="text-xs">Import trades to see your performance chart</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format axis values more clearly
function formatAxisValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}

// Helper function to determine chart color
function calculateChartColor(data: any[]): string {
  if (!data || data.length < 2) return '#22c55e'; // Default green
  
  const startValue = data[0].equity;
  const endValue = data[data.length - 1].equity;
  return endValue >= startValue ? '#22c55e' : '#ef4444'; // Green if positive, red if negative
}

const calculateYAxisTicks = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  // Find min and max values
  const values = data.map(item => item.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate a reasonable step size (aim for 5-7 ticks)
  const range = max - min;
  const roughStep = range / 5;
  
  // Round step to a nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  let step = magnitude;
  if (roughStep / magnitude >= 5) step = magnitude * 5;
  else if (roughStep / magnitude >= 2) step = magnitude * 2;
  
  // Generate ticks
  const ticks = [];
  let tick = Math.floor(min / step) * step;
  while (tick <= max) {
    ticks.push(tick);
    tick += step;
  }
  
  return ticks;
};

export default SimplePnLChart; 

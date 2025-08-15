import { useState, useEffect, useMemo } from 'react';
import { getImportedTrades, subscribeToTradeUpdates, getAccountStartingBalance } from '@/components/modals/ImportTradesModal';
import { prepareEquityCurveData } from '@/lib/tradeAnalyticsService';
import { logger } from '@/lib/utils';

interface DataPoint {
  date: string;
  fullDate: string;
  pnl: number;
  pnlFormatted: string;
  equity?: number;
  equityFormatted?: string;
}

type TimeRangeType = '7D' | '1M' | '3M' | 'YTD' | 'ALL';

export function usePnLData(timeRange: TimeRangeType = 'ALL') {
  const [trades, setTrades] = useState<any[]>([]);
  const [startingBalance, setStartingBalance] = useState(getAccountStartingBalance());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to trade updates
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const initialTrades = getImportedTrades();
      logger.debug('Raw imported trades:', initialTrades);
      
      const validTrades = initialTrades.filter(trade => {
        const hasRequiredFields = trade && trade.date && trade.pnl !== undefined;
        const isPnLValid = typeof trade.pnl === 'number' && !isNaN(trade.pnl);
        return hasRequiredFields && isPnLValid;
      });
      
      setTrades(validTrades);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load trade data');
      setIsLoading(false);
    }

    const unsubscribe = subscribeToTradeUpdates((updatedTrades) => {
      setTrades(updatedTrades);
      setStartingBalance(getAccountStartingBalance());
    });

    return unsubscribe;
  }, []);

  // Memoized chart data processing
  const chartData = useMemo(() => {
    if (!trades.length) return [];
    
    try {
      const data = prepareEquityCurveData(trades, startingBalance);
      
      // Apply time range filtering
      if (timeRange !== 'ALL') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (timeRange) {
          case '7D':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case '1M':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case '3M':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case 'YTD':
            cutoffDate.setFullYear(now.getFullYear(), 0, 1);
            break;
        }
        
        return data.filter(point => new Date(point.fullDate) >= cutoffDate);
      }
      
      return data;
    } catch (err) {
      logger.error('Error preparing chart data:', err);
      return [];
    }
  }, [trades, startingBalance, timeRange]);

  const hasData = chartData.length > 0;

  return {
    chartData,
    hasData,
    isLoading,
    error,
    startingBalance,
    totalTrades: trades.length
  };
}
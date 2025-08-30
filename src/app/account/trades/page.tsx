'use client'

import { useState, useEffect, useMemo } from 'react'
import { accountService, TradingAccount } from '@/services/account.service'
import { Trade } from '@/services/trade-data.service'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Basic UI Components (since shadcn is not used)
const Button = ({ onClick, children, disabled = false, className = '' }: { onClick: React.MouseEventHandler<HTMLButtonElement>, children: React.ReactNode, disabled?: boolean, className?: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${ 
      disabled 
        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
    } ${className}`}>
    {children}
  </button>
);

const Select = ({ value, onChange, children, className = '', id }: { value: string, onChange: React.ChangeEventHandler<HTMLSelectElement>, children: React.ReactNode, className?: string, id?: string }) => (
  <select 
    value={value}
    onChange={onChange}
    className={`bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none ${className}`}>
    {children}
  </select>
);

type SortableKey = 'openDate' | 'symbol' | 'netPnl' | 'accountName';

export default function TradeLogPage() {
  const router = useRouter();
  const [allTrades, setAllTrades] = useState<(Trade & { accountName: string; accountId: string })[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<(Trade & { accountName: string; accountId: string })[]>([]);
  
  const [filterAccount, setFilterAccount] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({ key: 'openDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 15;

  useEffect(() => {
    const trades = accountService.getAllTrades();
    const accs = Array.from(accountService.getAllAccountsSummary());
    setAllTrades(trades);
    setAccounts(accs.map(a => accountService.getAccountById(a.id)).filter(Boolean) as TradingAccount[]);
  }, []);

  useEffect(() => {
    let trades = [...allTrades];
    if (filterAccount !== 'all') {
      trades = trades.filter(trade => trade.accountId === filterAccount);
    }
    setFilteredTrades(trades);
    setCurrentPage(1); // Reset to first page on filter change
  }, [allTrades, filterAccount]);

  const sortedTrades = useMemo(() => {
    let sortableTrades = [...filteredTrades];
    if (sortConfig !== null) {
      sortableTrades.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTrades;
  }, [filteredTrades, sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * tradesPerPage;
    return sortedTrades.slice(startIndex, startIndex + tradesPerPage);
  }, [sortedTrades, currentPage, tradesPerPage]);

  const totalPages = Math.ceil(sortedTrades.length / tradesPerPage);

  const renderSortArrow = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Comprehensive Trade Log</h1>
      <p className="text-gray-400 mb-6">A unified view of all trades across all your accounts.</p>

      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="account-filter" className="font-medium">Filter by Account:</label>
        <Select id="account-filter" value={filterAccount} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterAccount(e.target.value)}>
          <option value="all">All Accounts</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </Select>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th onClick={() => requestSort('openDate')} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer">Date {renderSortArrow('openDate')}</th>
                <th onClick={() => requestSort('accountName')} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer">Account {renderSortArrow('accountName')}</th>
                <th onClick={() => requestSort('symbol')} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer">Symbol {renderSortArrow('symbol')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Side</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Entry Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Exit Price</th>
                <th onClick={() => requestSort('netPnl')} className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer">Net P&L {renderSortArrow('netPnl')}</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {paginatedTrades.map(trade => (
                <tr key={trade.id} className="hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(trade.openDate).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{trade.accountName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{trade.symbol}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${trade.side === 'LONG' ? 'text-[#10B981]' : 'text-red-400'}`}>{trade.side}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">{trade.entryPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">{trade.exitPrice.toFixed(2)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${trade.netPnl >= 0 ? 'text-[#10B981]' : 'text-red-400'}`}>
                    {trade.netPnl >= 0 ? '+' : ''}{trade.netPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paginatedTrades.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No trades found.</p>
            <p>Try adjusting your filters or importing some data.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
            <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

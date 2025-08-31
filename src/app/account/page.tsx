'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { accountService, type AccountSummary, TradingAccount } from '@/services/account.service'
import { Trade } from '@/services/trade-data.service'
import { cn } from '@/lib/utils'
import { PNLOverviewIcon, OrdersIcon, BudgetIncomeIcon, StreakIcon } from '@/components/ui/custom-icons'
import * as FancyButton from '@/components/ui/fancy-button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'

// Local controls (minimal, no shadcn)

function Button({ variant = 'primary', className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'danger' }) {
  const base = 'inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#1C1C1C] focus:ring-[#3559E9] disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    primary: 'bg-[#3559E9] text-white hover:bg-[#2947d1]',
    outline: 'border border-gray-300 dark:border-[#2a2a2a] bg-transparent hover:bg-gray-100 dark:hover:bg-[#2a2a2a]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return <button className={cn(base, variants[variant], className)} {...rest} />
}


function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-white dark:bg-[#171717] p-4 rounded-lg shadow-sm">
      <div className="flex items-center">
        <div className="w-10 h-10 flex items-center justify-center mr-4">
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  )
}

// Trade Log Modal Component
type SortableKey = 'openDate' | 'symbol' | 'netPnl' | 'accountName';

function TradeLogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [allTrades, setAllTrades] = useState<(Trade & { accountName: string; accountId: string })[]>([])
  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [filteredTrades, setFilteredTrades] = useState<(Trade & { accountName: string; accountId: string })[]>([])
  const [filterAccount, setFilterAccount] = useState('all')
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({ key: 'openDate', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const tradesPerPage = 10

  useEffect(() => {
    if (isOpen) {
      const trades = accountService.getAllTrades()
      const accs = Array.from(accountService.getAllAccountsSummary())
      setAllTrades(trades)
      setAccounts(accs.map(a => accountService.getAccountById(a.id)).filter(Boolean) as TradingAccount[])
    }
  }, [isOpen])

  useEffect(() => {
    let trades = [...allTrades]
    if (filterAccount !== 'all') {
      trades = trades.filter(trade => trade.accountId === filterAccount)
    }
    setFilteredTrades(trades)
    setCurrentPage(1)
  }, [allTrades, filterAccount])

  const sortedTrades = useMemo(() => {
    const sortableTrades = [...filteredTrades]
    if (sortConfig !== null) {
      sortableTrades.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableTrades
  }, [filteredTrades, sortConfig])

  const requestSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * tradesPerPage
    return sortedTrades.slice(startIndex, startIndex + tradesPerPage)
  }, [sortedTrades, currentPage, tradesPerPage])

  const totalPages = Math.ceil(sortedTrades.length / tradesPerPage)

  const renderSortArrow = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? <ChevronUp className="inline ml-1 h-3 w-3" /> : <ChevronDown className="inline ml-1 h-3 w-3" />
  }
  
  const accountOptions = useMemo(
    () => [
      { label: 'All Accounts', value: 'all' },
      ...accounts.map(acc => ({ label: acc.name, value: acc.id }))
    ],
    [accounts]
  )

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden font-sans">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Comprehensive Trade Log
          </DialogTitle>
          <DialogClose />
        </DialogHeader>
        
        <div className="flex flex-col h-full overflow-hidden">
          <div className="mb-4 flex items-center gap-4">
            <label htmlFor="account-filter" className="font-medium text-gray-700 dark:text-gray-300">Filter by Account:</label>
            <CustomSelect
              id="account-filter"
              value={filterAccount}
              onChange={(val) => setFilterAccount(val)}
              options={accountOptions}
              className=""
              buttonClassName="w-56"
            />
          </div>

          <div className="flex-1 overflow-hidden bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
            <div className="overflow-auto h-full">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                <thead className="bg-gray-50 dark:bg-[#2a2a2a] sticky top-0">
                  <tr>
                    <th onClick={() => requestSort('openDate')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333]">
                      Date {renderSortArrow('openDate')}
                    </th>
                    <th onClick={() => requestSort('accountName')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333]">
                      Account {renderSortArrow('accountName')}
                    </th>
                    <th onClick={() => requestSort('symbol')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333]">
                      Symbol {renderSortArrow('symbol')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Side</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entry Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exit Price</th>
                    <th onClick={() => requestSort('netPnl')} className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333]">
                      Net P&L {renderSortArrow('netPnl')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                  {paginatedTrades.map(trade => (
                    <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-[#222] transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {new Date(trade.openDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{trade.accountName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{trade.symbol}</td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-bold ${trade.side === 'LONG' ? 'text-[#10B981]' : 'text-red-500'}`}>
                        {trade.side}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-300">
                        ${trade.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-300">
                        ${trade.exitPrice.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${trade.netPnl >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                        {trade.netPnl >= 0 ? '+' : ''}${trade.netPnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {paginatedTrades.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg">No trades found.</p>
                  <p>Try adjusting your filters or importing some data.</p>
                </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border-t border-gray-200 dark:border-[#333] flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm rounded-md bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm rounded-md bg-white dark:bg-[#171717] border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AccountManagementPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<AccountSummary[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [isTradeLogModalOpen, setIsTradeLogModalOpen] = useState(false);

  useEffect(() => {
    const updateAccounts = () => {
      setAccounts(accountService.getAllAccountsSummary());
      setActiveAccountId(accountService.getActiveAccount()?.id || null);
    };

    updateAccounts();
    const unsubscribe = accountService.subscribe(updateAccounts);
    return () => unsubscribe();
  }, []);

  const totalStats = useMemo(() => accountService.getCombinedStats(), [accounts]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#1C1C1C] font-inter">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <OrdersIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Management</h1>
                  <p className="text-gray-600 dark:text-gray-400">A summary of all your trading accounts.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button onClick={() => setIsTradeLogModalOpen(true)}>View Full Trade Log</Button>
                <FancyButton.Root 
                  variant="primary" 
                  size="medium"
                  onClick={() => router.push('/import-data')}
                >
                  <FancyButton.Icon as={Plus} />
                  Add Account
                </FancyButton.Root>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Accounts" value={totalStats.totalAccounts.toString()} icon={OrdersIcon} />
              <StatCard title="Total Trades" value={totalStats.totalTrades.toString()} icon={StreakIcon} />
              <StatCard title="Total P&L" value={`$${totalStats.totalPnl.toFixed(2)}`} icon={PNLOverviewIcon} />
              <StatCard title="Avg. Win Rate" value={`${totalStats.avgWinRate.toFixed(2)}%`} icon={BudgetIncomeIcon} />
            </div>

            {/* Accounts List */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => (
                  <Link key={acc.id} href={`/account/${acc.id}`}>
                    <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-5 flex flex-col h-full hover:ring-2 hover:ring-[#3559E9] transition-all font-inter">
                      <div className="flex items-center mb-4">
                        {acc.brokerLogo && acc.brokerLogo.startsWith('/') ? (
                          <Image src={acc.brokerLogo} alt={acc.broker} width={40} height={40} className="mr-4 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 mr-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-lg">{acc.broker.charAt(0)}</div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold truncate">
                            <span className="bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent">{acc.name}</span>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{acc.broker}</p>
                        </div>
                        {acc.id === activeAccountId && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] ml-2 flex-shrink-0" title="Active Account"></div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-auto">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Balance</p>
                          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">${acc.balance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Net P&L</p>
                          <p className={`font-bold text-lg ${acc.netPnl >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                            {acc.netPnl >= 0 ? '+' : ''}${acc.netPnl.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Trades</p>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{acc.totalTrades}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Win Rate</p>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{acc.winRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <TradeLogModal 
        isOpen={isTradeLogModalOpen} 
        onClose={() => setIsTradeLogModalOpen(false)} 
      />
    </div>
  )
}

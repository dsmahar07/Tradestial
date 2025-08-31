'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { accountService, type TradingAccount } from '@/services/account.service'
import { AccountBalanceChart } from '@/components/ui/account-balance-chart'
import { cn } from '@/lib/utils'
import { PNLOverviewIcon, OrdersIcon, BudgetIncomeIcon } from '@/components/ui/custom-icons'
import { Trade } from '@/services/trade-data.service'
import { ChevronDown, MoreVertical, Edit, Trash2, Upload, DollarSign } from 'lucide-react'
import * as FileUpload from '@/components/ui/file-upload'
import * as Notification from '@/components/ui/notification'
import * as Modal from '@/components/ui/modal'

// Local controls (minimal, no shadcn)
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      {...rest}
      className={cn(
        'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3559E9] focus:border-transparent text-sm',
        className
      )}
    />
  )
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return (
    <textarea
      {...rest}
      className={cn(
        'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3559E9] focus:border-transparent text-sm',
        className
      )}
    />
  )
}

function Button({ variant = 'primary', className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'danger' }) {
  const base = 'inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#171717] focus:ring-[#3559E9] disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    primary: 'bg-[#3559E9] text-white hover:bg-[#2947d1]',
    outline: 'border border-gray-300 dark:border-[#2a2a2a] bg-transparent hover:bg-gray-100 dark:hover:bg-[#2a2a2a]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return <button className={cn(base, variants[variant], className)} {...rest} />
}

// Advanced Dropdown Menu Component
function AdvancedDropdownMenu({ onEdit, onDelete, onCsvUpload, onBalanceAdjust }: {
  onEdit: () => void;
  onDelete: () => void;
  onCsvUpload: () => void;
  onBalanceAdjust: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: Edit, label: 'Edit Account', onClick: onEdit, color: 'text-gray-700 dark:text-gray-300' },
    { icon: Upload, label: 'Upload CSV', onClick: onCsvUpload, color: 'text-blue-600 dark:text-blue-400' },
    { icon: DollarSign, label: 'Adjust Starting Balance', onClick: onBalanceAdjust, color: 'text-green-600 dark:text-green-400' },
    { icon: Trash2, label: 'Delete Account', onClick: onDelete, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none focus:ring-0 focus:ring-offset-0"
      >
        <MoreVertical className="w-4 h-4" />
        Actions
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg z-50">
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors ${item.color} focus:outline-none focus:ring-0 focus:ring-offset-0`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] p-4 rounded-lg shadow-sm">
      <div className="flex items-center">
        <div className="w-10 h-10 flex items-center justify-center mr-4">
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  )
}

function TradeHistoryWidget({ trades }: { trades: Trade[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;

  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * tradesPerPage;
    const sortedTrades = [...trades].sort((a, b) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime());
    return sortedTrades.slice(startIndex, startIndex + tradesPerPage);
  }, [trades, currentPage, tradesPerPage]);

  const totalPages = Math.ceil(trades.length / tradesPerPage);

  if (trades.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade History</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">No trades found for this account.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-lg shadow-sm mt-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-[#2a2a2a] dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Symbol</th>
              <th scope="col" className="px-6 py-3">Side</th>
              <th scope="col" className="px-6 py-3">Entry</th>
              <th scope="col" className="px-6 py-3">Exit</th>
              <th scope="col" className="px-6 py-3 text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrades.map(trade => (
              <tr key={trade.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]">
                <td className="px-6 py-4">{new Date(trade.openDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{trade.symbol}</td>
                <td className={`px-6 py-4 font-medium ${trade.side === 'LONG' ? 'text-[#10B981]' : 'text-red-500'}`}>{trade.side}</td>
                <td className="px-6 py-4">{trade.entryPrice.toFixed(2)}</td>
                <td className="px-6 py-4">{trade.exitPrice.toFixed(2)}</td>
                <td className={`px-6 py-4 font-medium text-right ${trade.netPnl >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                  {trade.netPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4">
          <span className="text-sm text-gray-700 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;

  const [account, setAccount] = useState<TradingAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [showBalanceAdjust, setShowBalanceAdjust] = useState(false);
  const [newStartingBalance, setNewStartingBalance] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; status: 'success' | 'warning' | 'error' | 'information' | 'feature' | 'default'; title: string; description?: string }>>([])
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const addToast = (
    status: 'success' | 'warning' | 'error' | 'information' | 'feature' | 'default',
    title: string,
    description?: string,
  ) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.floor(Math.random() * 1000), status, title, description }])
  }

  useEffect(() => {
    if (!accountId) return;

    const updateAccount = () => {
      const acc = accountService.getAccountById(accountId);
      if (acc) {
        setAccount(acc);
      } else {
        // Account not found, maybe redirect
        router.push('/account');
      }
    };

    updateAccount();
    const unsubscribe = accountService.subscribe(updateAccount);
    return () => unsubscribe();
  }, [accountId, router]);

  const handleDeleteAccount = () => {
    if (!account) return
    setIsDeleteOpen(true)
  };

  const confirmDelete = async () => {
    if (!account) return
    await accountService.deleteAccount(account.id)
    setIsDeleteOpen(false)
    router.push('/account')
  }

  const handleSaveEdit = async () => {
    if (editingAccount) {
      await accountService.updateAccount(editingAccount.id, {
        name: editingAccount.name,
        description: editingAccount.description,
      });
      setEditingAccount(null);
    }
  };

  const handleCsvUpload = () => {
    setShowCsvUpload(true);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !account) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        addToast('warning', 'Invalid CSV', 'CSV must include a header and at least one data row.');
        return;
      }

      // Simple CSV parsing - assumes TradingView format
      const headers = lines[0].split(',').map(h => h.trim());
      const trades: Trade[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        const entryPrice = parseFloat(values[3]) || 0;
        const exitPrice = parseFloat(values[4]) || 0;
        const netPnl = parseFloat(values[5]) || 0;
        const netRoi = entryPrice !== 0 ? (netPnl / entryPrice) * 100 : 0;

        const trade: Trade = {
          id: `trade_${Date.now()}_${i}`,
          openDate: values[0] || new Date().toISOString(),
          closeDate: values[0] || new Date().toISOString(), // Use same date if closeDate not provided
          symbol: values[1] || 'UNKNOWN',
          status: netPnl >= 0 ? 'WIN' : 'LOSS',
          side: (values[2]?.toUpperCase() === 'LONG' || values[2]?.toUpperCase() === 'SHORT') ? values[2].toUpperCase() as 'LONG' | 'SHORT' : 'LONG',
          entryPrice,
          exitPrice,
          netPnl,
          netRoi,
        };

        trades.push(trade);
      }

      if (trades.length > 0) {
        await accountService.addTradesToAccount(account.id, trades);
        addToast('success', 'Import complete', `Imported ${trades.length} trade${trades.length !== 1 ? 's' : ''}.`);
      } else {
        addToast('information', 'No trades imported', 'No valid rows were found in the CSV.');
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      addToast('error', 'CSV parsing failed', 'Please check the file format and try again.');
    }

    setShowCsvUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBalanceAdjust = () => {
    if (account) {
      setNewStartingBalance(account.balance.starting.toString());
      setShowBalanceAdjust(true);
    }
  };

  const handleSaveBalanceAdjust = async () => {
    if (!account || !newStartingBalance) return;

    const newBalance = parseFloat(newStartingBalance);
    if (isNaN(newBalance)) {
      addToast('warning', 'Invalid amount', 'Please enter a valid number for the starting balance.')
      return;
    }

    const netPnl = account.trades.reduce((sum, trade) => sum + trade.netPnl, 0);
    
    await accountService.updateAccount(account.id, {
      balance: {
        starting: newBalance,
        current: newBalance + netPnl,
        netPnl: netPnl
      }
    });

    setShowBalanceAdjust(false);
    setNewStartingBalance('');
  };

  if (!account) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#171717]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <p>Loading account...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#171717]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/account" className="text-sm text-[#3559E9] hover:underline">← Back to Accounts</Link>
            </div>

            {editingAccount ? (
              <div className="bg-white dark:bg-[#0f0f0f] rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Account</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                    <TextInput
                      value={editingAccount.name}
                      onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <TextArea
                      rows={3}
                      value={editingAccount.description || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditingAccount(null)}>Cancel</Button>
                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-[#0f0f0f] rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{account.name}</h2>
                      <p className="text-gray-500 dark:text-gray-400">{account.description || 'No description'}</p>
                    </div>
                    <AdvancedDropdownMenu
                      onEdit={() => setEditingAccount(account)}
                      onDelete={handleDeleteAccount}
                      onCsvUpload={handleCsvUpload}
                      onBalanceAdjust={handleBalanceAdjust}
                    />
                  </div>
                  <div className="mt-6">
                    <div style={{ height: '300px' }}>
                      <AccountBalanceChart accountId={account.id} title="" />
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Key Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <StatCard title="Current Balance" value={`$${account.balance.current.toFixed(2)}`} icon={PNLOverviewIcon} />
                      <StatCard title="Net P&L" value={`$${account.balance.netPnl.toFixed(2)}`} icon={BudgetIncomeIcon} />
                      <StatCard title="Total Trades" value={account.stats.totalTrades.toString()} icon={OrdersIcon} />
                      <StatCard title="Win Rate" value={`${account.stats.winRate.toFixed(2)}%`} icon={BudgetIncomeIcon} />
                      <StatCard title="Profit Factor" value={account.stats.profitFactor.toFixed(2)} icon={PNLOverviewIcon} />
                      <StatCard title="Max Drawdown" value={`$${account.stats.maxDrawdown.toFixed(2)}`} icon={PNLOverviewIcon} />
                    </div>
                  </div>
                </div>
                <TradeHistoryWidget trades={account.trades} />
              </>
            )}

            {/* CSV Upload Modal */}
            {showCsvUpload && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-6 w-full max-w-lg mx-4 font-sans">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Upload CSV File</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upload a CSV file with trade data. Expected columns: Date, Symbol, Side, Entry Price, Exit Price, Net P&L
                  </p>

                  <FileUpload.Root className="select-none">
                    <FileUpload.Icon as={Upload} className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Drag and drop your CSV here</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">or</p>
                    </div>
                    <FileUpload.Button className="pointer-events-auto">
                      Choose file
                    </FileUpload.Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </FileUpload.Root>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setShowCsvUpload(false)} className="focus:outline-none focus:ring-0 focus:ring-offset-0">Cancel</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Adjustment Modal */}
            {showBalanceAdjust && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-[#0f0f0f] rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Adjust Starting Balance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Current starting balance: ${account?.balance.starting.toFixed(2)}
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Starting Balance
                    </label>
                    <TextInput
                      type="number"
                      step="0.01"
                      value={newStartingBalance}
                      onChange={(e) => setNewStartingBalance(e.target.value)}
                      placeholder="Enter new starting balance"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowBalanceAdjust(false)}>Cancel</Button>
                    <Button onClick={handleSaveBalanceAdjust}>Save Changes</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        {/* Delete Confirmation Modal (AlignUI Modal) */}
        <Modal.Root open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Modal.Content>
            <Modal.Header
              title="Delete this account?"
              description="This action cannot be undone and will remove all trades associated with this account."
            />
            <Modal.Body>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please confirm you want to permanently delete the account
                {account ? ` "${account.name}"` : ''}.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-gray-300 dark:border-[#2a2a2a] bg-transparent text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
        {/* Notifications */}
        <Notification.Provider swipeDirection="right">
          {toasts.map((t) => (
            <Notification.Root
              key={t.id}
              status={t.status}
              variant={t.status === 'success' ? 'filled' : 'soft'}
              duration={3000}
              title={t.title}
              description={t.description}
              onOpenChange={(open) => {
                if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }}
              open
            />
          ))}
          <Notification.Viewport />
        </Notification.Provider>
      </div>
    </div>
  )
}

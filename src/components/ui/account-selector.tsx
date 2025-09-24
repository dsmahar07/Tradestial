'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown, Building2, TrendingUp, TrendingDown, Plus, User } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { accountService, type AccountSummary } from '@/services/account.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/fancy-select'
import { Button } from '@/components/ui/button'

interface AccountSelectorProps {
  onAccountChange?: (accountId: string) => void
  className?: string
}

export function AccountSelector({ onAccountChange, className }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([])
  const [activeAccount, setActiveAccount] = useState<AccountSummary | null>(null)

  useEffect(() => {
    const loadAccounts = () => {
      const allAccounts = accountService.getAllAccountsSummary()
      const active = accountService.getActiveAccount()
      
      setAccounts(allAccounts)
      setActiveAccount(active ? {
        id: active.id,
        name: active.name,
        broker: active.broker,
        brokerLogo: active.brokerLogo,
        balance: active.balance.current,
        netPnl: active.balance.netPnl,
        totalTrades: active.stats.totalTrades,
        winRate: active.stats.winRate,
        lastUpdated: active.lastUpdated,
        isActive: active.isActive
      } : null)
    }

    loadAccounts()

    // Subscribe to account changes
    const unsubscribe = accountService.subscribe(loadAccounts)
    return unsubscribe
  }, [])

  const handleAccountSelect = async (accountId: string) => {
    if (accountId === 'add-account') {
      window.location.href = '/import-data'
      return
    }
    if (accountId === 'manage-accounts') {
      window.location.href = '/account'
      return
    }

    const success = await accountService.switchToAccount(accountId)
    if (success) {
      const newActiveAccount = accounts.find(acc => acc.id === accountId)
      if (newActiveAccount) {
        setActiveAccount(newActiveAccount)
        onAccountChange?.(accountId)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!activeAccount && accounts.length === 0) {
    return (
      <Button
        variant="outline"
        className={cn("h-10 px-3 justify-between min-w-[200px] dark:bg-[#0f0f0f] dark:border-[#2a2a2a] dark:hover:bg-[#171717]", className)}
        onClick={() => window.location.href = '/import-data'}
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Account</span>
        </div>
      </Button>
    )
  }

  return (
    <Select value={activeAccount?.id || ''} onValueChange={handleAccountSelect}>
      <SelectTrigger className={cn("min-w-[240px] max-w-[320px] focus:outline-none focus:ring-0 focus-visible:ring-0 [&>svg]:hidden", className)}>
        <SelectValue>
          {activeAccount ? (
            <div className="flex items-center gap-3 min-w-0">
              {activeAccount.brokerLogo ? (
                <div className="w-5 h-5 flex-shrink-0">
                  <Image
                    src={activeAccount.brokerLogo}
                    alt={`${activeAccount.broker} logo`}
                    width={20}
                    height={20}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3 w-3 text-gray-500" />
                </div>
              )}
              <span className="text-sm font-semibold bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent truncate">
                {activeAccount.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">Select Account</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent className="w-[320px]">
        <SelectGroup>
          <SelectLabel>Trading Accounts</SelectLabel>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-3">
                {account.brokerLogo ? (
                  <div className="w-6 h-6 flex-shrink-0">
                    <Image
                      src={account.brokerLogo}
                      alt={`${account.broker} logo`}
                      width={24}
                      height={24}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-gray-500" />
                  </div>
                )}
                <span className={cn(
                  "font-semibold text-sm",
                  activeAccount?.id === account.id 
                    ? "bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E] bg-clip-text text-transparent"
                    : "text-gray-900 dark:text-gray-100"
                )}>
                  {account.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
        
        <SelectSeparator />
        
        <SelectGroup>
          <SelectItem value="add-account">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-blue-600">Add New Account</span>
                <span className="text-xs text-gray-500">Import trading data</span>
              </div>
            </div>
          </SelectItem>
          
          <SelectItem value="manage-accounts">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Manage Accounts</span>
                <span className="text-xs text-gray-500">View all accounts</span>
              </div>
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

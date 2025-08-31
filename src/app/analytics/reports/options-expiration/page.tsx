'use client'

import { useMemo } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/header'
import { AnalyticsTabNavigation } from '@/components/ui/analytics-tab-navigation'
import { analyticsNavigationConfig } from '@/config/analytics-navigation'
import { usePageTitle } from '@/hooks/use-page-title'
import { useAnalytics } from '@/hooks/use-analytics'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

export default function OptionsExpirationPage() {
  usePageTitle('Analytics - Options: Days till expiration')
  const { trades, loading, error } = useAnalytics()
  
  const handleTabChange = (tabId: string) => {
    console.log('Active tab:', tabId)
  }

  const handleDropdownItemClick = (tabId: string, itemId: string) => {
    console.log(`Selected ${itemId} from ${tabId} tab`)
  }
 

  const bins = useMemo(
    () => ['Same day','1 day','2 days','3 days','4 days','5 days','6 days','7 days','8 days','9 days','10+ days'],
    []
  )

  function dteLabel(days: number): string {
    if (days <= 0) return 'Same day'
    if (days === 1) return '1 day'
    if (days >= 10) return '10+ days'
    return `${days} days`
  }

  const { distributionData, performanceData } = useMemo(() => {
    const distMap = new Map<string, number>()
    const perfMap = new Map<string, number>()

    bins.forEach(b => { distMap.set(b, 0); perfMap.set(b, 0) })

    if (trades) {
      for (const t of trades) {
        if (!t.expirationDate) continue
        const open = new Date(t.openDate)
        const exp = new Date(t.expirationDate)
        if (isNaN(open.getTime()) || isNaN(exp.getTime())) continue
        // Normalize to midnight to avoid partial-day skew
        open.setHours(0,0,0,0)
        exp.setHours(0,0,0,0)
        const diffDays = Math.max(0, Math.round((exp.getTime() - open.getTime()) / 86400000))
        const label = dteLabel(diffDays)
        distMap.set(label, (distMap.get(label) || 0) + 1)
        perfMap.set(label, (perfMap.get(label) || 0) + (t.netPnl || 0))
      }
    }

    const distributionData = bins.map(label => ({ label, count: distMap.get(label) || 0 }))
    const performanceData = bins.map(label => ({ label, pnl: perfMap.get(label) || 0 }))
    return { distributionData, performanceData }
  }, [trades, bins])
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="bg-white dark:bg-[#0f0f0f]">
          <AnalyticsTabNavigation 
            tabs={analyticsNavigationConfig.map(tab => ({
              ...tab,
              isActive: tab.id === 'reports'
            }))}
            onTabChange={handleTabChange}
            onDropdownItemClick={handleDropdownItemClick}
          />
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 bg-gray-50 dark:bg-[#171717]">
          <div className="w-full space-y-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Options: Days till expiration</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Options trading performance by days to expiration
              </p>
            </div>
            {/* Charts - side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
            {/* Distribution by DTE */}
            <section className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">TRADE DISTRIBUTION BY DTE</h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">(ALL DATES)</span>
              </div>
              <div className="h-[546px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                  ) : error ? (
                    <div className="h-full flex items-center justify-center text-sm text-red-500">{error}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={85} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} formatter={(v: any) => [v, 'Trades']} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
              </div>
            </section>

            {/* Performance by DTE */}
            <section className="bg-white dark:bg-[#0f0f0f] rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">PERFORMANCE BY DTE</h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">(ALL DATES)</span>
              </div>
              <div className="h-[546px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                  ) : error ? (
                    <div className="h-full flex items-center justify-center text-sm text-red-500">{error}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${Math.abs(v).toLocaleString()}`} />
                        <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={85} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} formatter={(v: any) => [`$${Math.abs(Number(v)).toLocaleString()}`, 'Net P&L']} />
                        <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="4 4" />
                        <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
              </div>
            </section>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
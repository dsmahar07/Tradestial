'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DayDetailModal } from '@/components/ui/day-detail-modal'
import { cn } from '@/lib/utils'

type TradingDay = {
  date: string // ISO date or parsable date string
  pnl: number
}

interface TradeDashboardCalendarProps {
  className?: string
  tradingDays?: TradingDay[]
}

// Sample trading data for demonstration
const defaultTradingDays: TradingDay[] = [
  { date: '2025-08-15', pnl: 450 },
  { date: '2025-08-16', pnl: -200 },
  { date: '2025-08-17', pnl: 780 },
  { date: '2025-08-14', pnl: 320 },
  { date: '2025-08-13', pnl: -150 },
  { date: '2025-08-12', pnl: 600 },
  { date: '2025-08-09', pnl: 250 },
  { date: '2025-08-08', pnl: -400 },
  { date: '2025-08-07', pnl: 890 },
]

export function TradeDashboardCalendar({ className, tradingDays = defaultTradingDays }: TradeDashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPnl, setSelectedPnl] = useState<number | undefined>(undefined)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Normalize trading days to a map for quick lookup
  const tradingMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const td of tradingDays) {
      const d = new Date(td.date)
      if (isNaN(d.getTime())) continue
      const key = d.toISOString().split('T')[0]
      map.set(key, (map.get(key) || 0) + td.pnl)
    }
    return map
  }, [tradingDays])

  // Build calendar grid (6 weeks * 7 days)
  const calendar = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startWeekday = firstDayOfMonth.getDay() // 0-6

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      pnl?: number
    }> = []

    // previous month days
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      })
    }
    // current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d)
      const key = dateObj.toISOString().split('T')[0]
      const pnl = tradingMap.get(key)
      days.push({
        date: dateObj,
        isCurrentMonth: true,
        isToday: dateObj.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === dateObj.toDateString(),
        pnl,
      })
    }
    // next month filler days
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(currentYear, currentMonth + 1, d)
      days.push({
        date: dateObj,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      })
    }
    return days
  }, [currentMonth, currentYear, selectedDate, today, tradingMap])

  // Weekly stats for the sidebar (6 weeks)
  const weeklyStats = useMemo(() => {
    const weeks: Array<{ label: string; pnl: number; days: number }> = []
    for (let w = 0; w < 6; w++) {
      const start = w * 7
      const end = start + 7
      const slice = calendar.slice(start, end)
      let sum = 0
      let daysWithTrades = 0
      for (const c of slice) {
        if (c.isCurrentMonth && typeof c.pnl === 'number') {
          sum += c.pnl
          daysWithTrades += 1
        }
      }
      weeks.push({ label: `Week ${w + 1}`, pnl: sum, days: daysWithTrades })
    }
    return weeks
  }, [calendar])

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  const handleToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))

  const monthlyTotal = useMemo(() => {
    return weeklyStats.reduce((sum, w) => sum + w.pnl, 0)
  }, [weeklyStats])

  const weeks = useMemo(() => Array.from({ length: 6 }, (_, i) => calendar.slice(i * 7, i * 7 + 7)), [calendar])

  const openModalFor = (d: Date, pnl?: number) => {
    setSelectedDate(d)
    setSelectedPnl(pnl)
    setIsModalOpen(true)
  }

  return (
    <div className={cn('bg-white dark:bg-[#171717] rounded-xl p-4 sm:p-6 h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px]">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'text-xs sm:text-sm font-semibold',
              monthlyTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            Monthly stats: {monthlyTotal === 0 ? '$0' : `${monthlyTotal > 0 ? '+' : '-'}`}${Math.abs(monthlyTotal)}
          </div>
          <Button variant="outline" size="sm" onClick={handleToday}>
            This month
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" /> 1 day
          </Button>
        </div>
      </div>

      <DayDetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} date={selectedDate} pnl={selectedPnl} />

      {/* Mobile/tablet: show simple grid without weekly column */}
      <div className="lg:hidden">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendar.map((c, idx) => {
            const pnl = c.pnl
            const isPositive = typeof pnl === 'number' && pnl > 0
            const isNegative = typeof pnl === 'number' && pnl < 0
            return (
              <button
                key={idx}
                onClick={() => c.isCurrentMonth && openModalFor(c.date, c.pnl)}
                disabled={!c.isCurrentMonth}
                className={cn(
                  'relative h-20 sm:h-24 w-full rounded-xl border text-sm flex items-start justify-start p-2',
                  c.isCurrentMonth ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800',
                  !c.isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/40 text-gray-400 dark:text-gray-600 cursor-default',
                  c.isToday && 'ring-1 ring-gray-400/50',
                  isPositive && 'bg-green-50 dark:bg-green-900/20',
                  isNegative && 'bg-red-50 dark:bg-red-900/20'
                )}
              >
                <div className="relative w-full h-full p-1">
                  <span className={cn('absolute top-1 left-1 text-xs font-medium', c.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600')}>{c.date.getDate()}</span>
                  {typeof pnl === 'number' && (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn('text-sm font-bold', isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                          {pnl > 0 ? '+' : ''}${Math.abs(pnl)}
                        </span>
                      </div>
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400">
                        3 trades
                      </span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop: 8-column rows with perfect alignment */}
      <div className="hidden lg:block flex-1 min-h-0">
        {/* Header row */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
              {d}
            </div>
          ))}
          <div />
        </div>

        {/* Week rows */}
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-8 gap-2 mb-2">
            {week.map((c, idx) => {
              const pnl = c.pnl
              const isPositive = typeof pnl === 'number' && pnl > 0
              const isNegative = typeof pnl === 'number' && pnl < 0
              return (
                <button
                  key={idx}
                  onClick={() => c.isCurrentMonth && openModalFor(c.date, c.pnl)}
                  disabled={!c.isCurrentMonth}
                  className={cn(
                    'relative h-24 w-full rounded-xl border text-sm flex items-start justify-start p-2',
                    c.isCurrentMonth ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800',
                    !c.isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/40 text-gray-400 dark:text-gray-600 cursor-default',
                    c.isToday && 'ring-1 ring-gray-400/50',
                    isPositive && 'bg-green-50 dark:bg-green-900/20',
                    isNegative && 'bg-red-50 dark:bg-red-900/20'
                  )}
                >
                  <div className="relative w-full h-full p-2">
                    <span className={cn('absolute top-2 left-2 text-sm font-medium', c.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600')}>{c.date.getDate()}</span>
                    {typeof pnl === 'number' && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn('text-base font-bold', isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                            {pnl > 0 ? '+' : ''}${Math.abs(pnl)}
                          </span>
                        </div>
                        <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400">
                          3 trades
                        </span>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
            {/* Week summary cell */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 h-24 px-3 py-2 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Week {i + 1}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{weeklyStats[i]?.days ?? 0} {(weeklyStats[i]?.days ?? 0) === 1 ? 'day' : 'days'}</div>
              </div>
              <div className={cn('text-base font-semibold', (weeklyStats[i]?.pnl ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {(weeklyStats[i]?.pnl ?? 0) === 0 ? '$0' : `${(weeklyStats[i]?.pnl ?? 0) > 0 ? '+' : '-'}$${Math.abs(weeklyStats[i]?.pnl ?? 0)}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TradeDashboardCalendar



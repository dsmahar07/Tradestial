'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DayDetailModal } from '@/components/ui/day-detail-modal'
import { cn } from '@/lib/utils'
import { DataStore } from '@/services/data-store.service'
import { Trade } from '@/services/trade-data.service'
import { parseLocalDate } from '@/utils/date-utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Checkbox from '@radix-ui/react-checkbox'

type TradingDay = {
  date: string // ISO date or parsable date string
  pnl: number
  tradesCount: number
}

interface TradeDashboardCalendarProps {
  className?: string
  tradingDays?: TradingDay[]
}

// Helper: format date to local YYYY-MM-DD
const toYMD = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Generate trading days from real trade data
const generateTradingDays = (trades: Trade[]): TradingDay[] => {
  if (trades.length === 0) return []

  const dailyMap = new Map<string, { pnl: number; tradesCount: number }>()

  trades.forEach(trade => {
    // DataStore normalizes dates to YYYY-MM-DD strings already
    const dateKey = (trade.closeDate || trade.openDate).substring(0, 10)

    const existing = dailyMap.get(dateKey) || { pnl: 0, tradesCount: 0 }
    existing.pnl += trade.netPnl
    existing.tradesCount += 1
    dailyMap.set(dateKey, existing)
  })

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    pnl: Math.round(data.pnl),
    tradesCount: data.tradesCount
  }))
}

export function TradeDashboardCalendar({ className, tradingDays }: TradeDashboardCalendarProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const calendarRef = useRef<HTMLDivElement | null>(null)

  // Load trades and subscribe to changes
  useEffect(() => {
    setTrades(DataStore.getAllTrades())
    const unsubscribe = DataStore.subscribe(() => {
      setTrades(DataStore.getAllTrades())
    })
    return unsubscribe
  }, [])

  // Use provided trading days or generate from real trades
  const realTradingDays = useMemo(() => {
    return tradingDays || generateTradingDays(trades)
  }, [tradingDays, trades])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPnl, setSelectedPnl] = useState<number | undefined>(undefined)
  const [selectedTrades, setSelectedTrades] = useState<Trade[] | undefined>(undefined)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Normalize trading days to a map for quick lookup
  const tradingMap = useMemo(() => {
    const map = new Map<string, { pnl: number; tradesCount: number }>()
    for (const td of realTradingDays) {
      const d = parseLocalDate(td.date)
      if (isNaN(d.getTime())) continue
      const key = toYMD(d)
      const existing = map.get(key) || { pnl: 0, tradesCount: 0 }
      existing.pnl += td.pnl
      existing.tradesCount += td.tradesCount
      map.set(key, existing)
    }
    return map
  }, [realTradingDays])

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
      tradesCount?: number
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
      const key = toYMD(dateObj)
      const tradingData = tradingMap.get(key)
      days.push({
        date: dateObj,
        isCurrentMonth: true,
        isToday: dateObj.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === dateObj.toDateString(),
        pnl: tradingData?.pnl,
        tradesCount: tradingData?.tradesCount,
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

  // Export the calendar card as a PNG on a gradient background
  const exportCalendarAsImage = async () => {
    try {
      const node = calendarRef.current
      if (!node) return

      // Dynamically import html-to-image on client
      const { toPng } = await import('html-to-image')

      // Temporarily hide export buttons
      const hiddenElements: HTMLElement[] = []
      node.querySelectorAll('.export-hidden').forEach(el => {
        const element = el as HTMLElement
        if (element.style.display !== 'none') {
          hiddenElements.push(element)
          element.style.display = 'none'
        }
      })

      // Create a canvas to compose the final image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Set canvas dimensions
      canvas.width = 1400 * 2 // 2x for high DPI
      canvas.height = 900 * 2
      ctx.scale(2, 2) // Scale for high DPI

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1400, 900)
      gradient.addColorStop(0, '#0F172A')
      gradient.addColorStop(0.5, '#1E40AF')
      gradient.addColorStop(1, '#06B6D4')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1400, 900)

      // Capture the calendar as PNG
      const calendarDataUrl = await toPng(node, {
        cacheBust: false,
        pixelRatio: 2,
        quality: 1,
        skipFonts: true
      })

      // Load the calendar image
      const img = new Image()
      img.onload = () => {
        // Calculate position to center the calendar
        const calendarWidth = Math.min(img.width / 2, 1200) // Max width 1200px
        const calendarHeight = (img.height / 2) * (calendarWidth / (img.width / 2))
        const x = (1400 - calendarWidth) / 2
        const y = (900 - calendarHeight) / 2

        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
        ctx.shadowBlur = 50
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 25

        // Draw the calendar image on the gradient
        ctx.drawImage(img, x, y, calendarWidth, calendarHeight)

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const monthLabel = `${monthNames[currentMonth]}-${currentYear}`.replace(/\s+/g, '-')
            a.download = `tradestial-calendar-${monthLabel}.png`
            a.href = url
            a.click()
            URL.revokeObjectURL(url)
          }
        }, 'image/png', 1)
      }

      img.onerror = () => {
        throw new Error('Failed to load calendar image')
      }

      img.src = calendarDataUrl

      // Restore hidden elements
      hiddenElements.forEach(el => {
        el.style.display = ''
      })

    } catch (err) {
      try {
        // eslint-disable-next-line no-console
        console.error('[Calendar] Export failed', err)
      } catch {}
      setFeedbackMessage('Failed to export image')
      setTimeout(() => setFeedbackMessage(null), 2000)
    }
  }

  const monthlyTotal = useMemo(() => {
    return weeklyStats.reduce((sum, w) => sum + w.pnl, 0)
  }, [weeklyStats])

  const weeks = useMemo(() => Array.from({ length: 6 }, (_, i) => calendar.slice(i * 7, i * 7 + 7)), [calendar])

  // Helper: compact format like 10k, 10.1k
  const formatCompact = (n: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(n))
  const formatMonthlyDisplay = (n: number) => {
    if (n === 0) return '$0'
    const sign = n > 0 ? '+' : '-'
    return `${sign}$${formatCompact(n)}`
  }

  const handleHeaderIconClick = () => {
    try {
      // eslint-disable-next-line no-console
      console.log('[Calendar] Header icon clicked')
    } catch {}
  }

  // Settings state (placeholder; can be lifted to context if needed)
  const [settings, setSettings] = useState({
    rMultiple: false,
    ticks: false,
    pips: false,
    points: false,
    tradesCount: false,
    dayWinrate: false,
  })

  // Determine how many metrics are enabled to adapt cell layout
  const enabledSecondaryCount = useMemo(() => {
    return (
      (settings.rMultiple ? 1 : 0) +
      (settings.ticks ? 1 : 0) +
      (settings.pips ? 1 : 0) +
      (settings.points ? 1 : 0)
    )
  }, [settings])
  const hasBottomMeta = useMemo(() => (settings.tradesCount || settings.dayWinrate), [settings])
  const useCompact = enabledSecondaryCount >= 3 || (enabledSecondaryCount >= 2 && hasBottomMeta)

  const toggleSetting = (key: keyof typeof settings, checked: boolean | 'indeterminate') => {
    setSettings(prev => ({ ...prev, [key]: Boolean(checked) }))
  }

  const openModalFor = (d: Date, pnl?: number) => {
    setSelectedDate(d)
    setSelectedPnl(pnl)
    // Build local YYYY-MM-DD key (avoid UTC shift from toISOString)
    const toYMD = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    const key = toYMD(d)
    // Compare against DataStore's normalized dates (YYYY-MM-DD)
    const dayTrades = trades.filter(t => (t.closeDate || t.openDate || '').startsWith(key))
    // Debug: log filtering details (remove after verification)
    try {
      // eslint-disable-next-line no-console
      console.log('[Calendar] Selected date', key, 'Total trades', trades.length, 'Matched', dayTrades.length, dayTrades.slice(0, 3))
    } catch {}
    setSelectedTrades(dayTrades)
    setIsModalOpen(true)
  }

  const handleDayClick = (c: any) => {
    if (!c.isCurrentMonth) return
    
    if (typeof c.pnl === 'number') {
      openModalFor(c.date, c.pnl)
    } else {
      // Show feedback for non-traded days
      const dateStr = c.date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })
      setFeedbackMessage(`No trades on ${dateStr}`)
      setTimeout(() => setFeedbackMessage(null), 2000)
    }
  }

  return (
    <div ref={calendarRef} className={cn('bg-white dark:bg-[#0f0f0f] rounded-xl p-4 sm:p-6 h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 rounded-md border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-gray-800">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-lg font-semibold text-gray-900 dark:text-white min-w-[140px]">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <button onClick={handleNextMonth} className="p-2 rounded-md border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-gray-800">
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="bg-white text-gray-900 border-gray-200 hover:bg-gray-50
                       dark:bg-[#0f0f0f] dark:text-white dark:border-[#2a2a2a] dark:hover:bg-[#171717]"
          >
            This month
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-xs text-gray-900 dark:text-white bg-[#3559E9]/20 hover:bg-[#3559E9]/30 rounded-lg px-2 py-1 h-7">
            1 day
          </Button>
          <div
            className={cn(
              'text-xs sm:text-sm font-semibold border rounded-md px-2 py-1 border-gray-200 dark:border-[#2a2a2a]',
              monthlyTotal >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'
            )}
          >
            {formatMonthlyDisplay(monthlyTotal)}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                onClick={handleHeaderIconClick}
                aria-label="Header action"
                className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent export-hidden"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.5672 14.54V9.46002C20.5665 8.72983 20.3737 8.01267 20.0083 7.38049C19.6429 6.74831 19.1176 6.22334 18.4853 5.85825L14.0819 3.30786C13.449 2.9424 12.7309 2.75 12 2.75C11.2691 2.75 10.551 2.9424 9.91805 3.30786L5.51472 5.85825C4.88235 6.22334 4.35711 6.74831 3.99169 7.38049C3.62627 8.01267 3.43352 8.72983 3.43277 9.46002V14.54C3.43352 15.2702 3.62627 15.9873 3.99169 16.6195C4.35711 17.2517 4.88235 17.7767 5.51472 18.1418L9.91805 20.6921C10.551 21.0576 11.2691 21.25 12 21.25C12.7309 21.25 13.449 21.0576 14.0819 20.6921L18.4853 18.1418C19.1176 17.7767 19.6429 17.2517 20.0083 16.6195C20.3737 15.9873 20.5665 15.2702 20.5672 14.54Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.9057 8.34621H11.0944C10.7275 8.34475 10.3668 8.44026 10.0487 8.62306C9.73061 8.80586 9.46649 9.06947 9.28306 9.38718L8.37741 10.9591C8.19468 11.2756 8.09848 11.6346 8.09848 12C8.09848 12.3655 8.19468 12.7245 8.37741 13.041L9.28306 14.6129C9.46649 14.9306 9.73061 15.1942 10.0487 15.377C10.3668 15.5598 10.7275 15.6553 11.0944 15.6539H12.9057C13.2725 15.6553 13.6332 15.5598 13.9513 15.377C14.2694 15.1942 14.5335 14.9306 14.7169 14.6129L15.6226 13.041C15.8053 12.7245 15.9015 12.3655 15.9015 12C15.9015 11.6346 15.8053 11.2756 15.6226 10.9591L14.7169 9.38718C14.5335 9.06947 14.2694 8.80586 13.9513 8.62306C13.6332 8.44026 13.2725 8.34475 12.9057 8.34621Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="end"
                className="z-50 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] shadow-lg p-2 w-56
                data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
                data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
                data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
              >
                <div className="px-2 pt-1 pb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Display stats</div>
                <div className="flex flex-col gap-1">
                  {[
                    { key: 'rMultiple', label: 'R Multiple' },
                    { key: 'ticks', label: 'Ticks' },
                    { key: 'pips', label: 'Pips' },
                    { key: 'points', label: 'Points' },
                    { key: 'tradesCount', label: 'Number of trades' },
                    { key: 'dayWinrate', label: 'Day winrate' },
                  ].map(({ key, label }) => (
                    <DropdownMenu.Item
                      key={key}
                      className="outline-none"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <label
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox.Root
                          checked={settings[key as keyof typeof settings]}
                          onCheckedChange={(c) => toggleSetting(key as keyof typeof settings, c)}
                          className="h-4 w-4 rounded-[4px] border border-gray-300 dark:border-[#2a2a2a] data-[state=checked]:bg-[#2547D0] data-[state=checked]:border-[#2547D0] flex items-center justify-center"
                        >
                          <Checkbox.Indicator>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
                      </label>
                    </DropdownMenu.Item>
                  ))}
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          <button
            onClick={exportCalendarAsImage}
            aria-label="Export calendar as image"
            className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent export-hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.83333 19.7083H18.1667C18.9844 19.7083 19.7687 19.3834 20.3469 18.8052C20.9252 18.227 21.25 17.4427 21.25 16.625V9.43051C21.25 8.61276 20.9252 7.82851 20.3469 7.25027C19.7687 6.67203 18.9844 6.34718 18.1667 6.34718H16.7483C16.3396 6.34682 15.9477 6.18416 15.6589 5.89496L14.5078 4.74385C14.2189 4.45465 13.8271 4.29199 13.4183 4.29163H10.5817C10.1729 4.29199 9.78106 4.45465 9.49222 4.74385L8.34111 5.89496C8.05227 6.18416 7.6604 6.34682 7.25167 6.34718H5.83333C5.01558 6.34718 4.23132 6.67203 3.65309 7.25027C3.07485 7.82851 2.75 8.61276 2.75 9.43051V16.625C2.75 17.4427 3.07485 18.227 3.65309 18.8052C4.23132 19.3834 5.01558 19.7083 5.83333 19.7083Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16.6251C14.2705 16.6251 16.1111 14.7844 16.1111 12.5139C16.1111 10.2434 14.2705 8.40283 12 8.40283C9.7295 8.40283 7.88889 10.2434 7.88889 12.5139C7.88889 14.7844 9.7295 16.6251 12 16.6251Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in-0 slide-in-from-top-2">
          {feedbackMessage}
        </div>
      )}

      <DayDetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} date={selectedDate} pnl={selectedPnl} trades={selectedTrades} />

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
                onClick={() => handleDayClick(c)}
                disabled={!c.isCurrentMonth}
                className={cn(
                  'h-24 w-full rounded-lg border text-xs flex flex-col p-1.5',
                  c.isCurrentMonth ? 'border-gray-200 dark:border-[#2a2a2a]' : 'border-gray-100 dark:border-[#2a2a2a]',
                  !c.isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/40 text-gray-400 dark:text-gray-600 cursor-default',
                  c.isToday && 'ring-1 ring-gray-400/50'
                )}
              >
                <span className={cn('text-[11px] font-medium self-start', c.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600')}>{c.date.getDate()}</span>
                {typeof pnl === 'number' && (
                  <div className="flex-grow flex flex-col items-center justify-center -mt-2">
                    {/* P&L display - always at top */}
                    <div className={cn(useCompact ? 'text-center text-sm font-bold mb-1' : 'text-center text-base font-bold mb-1', isPositive ? 'text-[#10B981]' : 'text-[#FB3748]')}>
                      {pnl > 0 ? '+' : ''}${Math.abs(pnl) >= 1000 ? `${(Math.abs(pnl)/1000).toFixed(1)}k` : Math.abs(pnl)}
                    </div>
                    {/* Secondary metrics in organized grid */}
                    {(settings.rMultiple || settings.ticks || settings.pips || settings.points) && (
                      <div className={cn('grid text-center w-full', useCompact ? 'grid-cols-2 gap-x-1 gap-y-0.5 text-[9px]' : 'grid-cols-2 gap-x-1 gap-y-0.5 text-[10px]')}>
                        {settings.rMultiple && (
                          <span className="text-gray-600 dark:text-gray-400">R {(pnl / 100).toFixed(1)}</span>
                        )}
                        {settings.ticks && (
                          <span className="text-gray-600 dark:text-gray-400">T {Math.abs(Math.round(pnl / 12.5))}</span>
                        )}
                        {settings.pips && (
                          <span className="text-gray-600 dark:text-gray-400">P {Math.abs(Math.round(pnl / 10))}</span>
                        )}
                        {settings.points && (
                          <span className="text-gray-600 dark:text-gray-400">{Math.abs(Math.round(pnl / 25))} pt</span>
                        )}
                      </div>
                    )}
                    {/* Bottom info - trade count and winrate */}
                    {(settings.tradesCount || settings.dayWinrate) && (
                      <div className={cn('flex justify-center mt-0.5', useCompact ? 'gap-1 text-[9px]' : 'gap-1 text-[10px]')}>
                        {settings.tradesCount && (
                          <span className="text-gray-500 dark:text-gray-400">{c.tradesCount || 1}T</span>
                        )}
                        {settings.dayWinrate && (
                          <span className="text-gray-500 dark:text-gray-400">WR:{isPositive ? '100' : '0'}%</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                  onClick={() => handleDayClick(c)}
                  disabled={!c.isCurrentMonth}
                  className={cn(
                    'h-28 w-full rounded-xl border text-sm flex flex-col p-2',
                    c.isCurrentMonth ? 'border-gray-200 dark:border-[#2a2a2a]' : 'border-gray-100 dark:border-[#2a2a2a]',
                    !c.isCurrentMonth && 'bg-gray-50/50 dark:bg-gray-900/40 text-gray-400 dark:text-gray-600 cursor-default',
                    c.isToday && 'ring-1 ring-gray-400/50'
                  )}
                >
                  <span className={cn('text-sm font-medium self-start', c.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600')}>{c.date.getDate()}</span>
                  {typeof pnl === 'number' && (
                    <div className="flex-grow flex flex-col gap-0.5 mt-1">
                      {/* Row 1: R 2.1 | 10 pts | +$250 */}
                      <div className="flex items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 w-12">
                          {settings.rMultiple ? `R ${(pnl / 100).toFixed(1)}` : ''}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 w-16 -ml-2">
                          {settings.points ? `${Math.abs(Math.round(pnl / 25))} pts` : ''}
                        </span>
                        <span className={cn('font-bold text-xl font-inter ml-auto mr-2 mt-3', isPositive ? 'text-[#10B981]' : 'text-[#FB3748]')}>
                          {pnl > 0 ? '+' : ''}${Math.abs(pnl) >= 1000 ? `${(Math.abs(pnl)/1000).toFixed(1)}k` : Math.abs(pnl)}
                        </span>
                      </div>
                      {/* Row 2: T 20 | 5 trades | */}
                      <div className="flex items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 w-12">
                          {settings.ticks ? `T ${Math.abs(Math.round(pnl / 12.5))}` : ''}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 w-16 -ml-2">
                          {settings.tradesCount ? `${c.tradesCount || 1} trades` : ''}
                        </span>
                      </div>
                      {/* Row 3: P 25 | WR: 100% | */}
                      <div className="flex items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 w-12">
                          {settings.pips ? `P ${Math.abs(Math.round(pnl / 10))}` : ''}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 w-16 -ml-2">
                          {settings.dayWinrate ? `WR: ${isPositive ? '100%' : '0%'}` : ''}
                        </span>
                      </div>
                    </div>
                  )}

                </button>
              )
            })}
            {/* Week summary cell */}
            <div className="rounded-xl h-28 px-3 py-2 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Week {i + 1}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{weeklyStats[i]?.days ?? 0} {(weeklyStats[i]?.days ?? 0) === 1 ? 'day' : 'days'}</div>
              </div>
              <div className={cn('text-base font-semibold', (weeklyStats[i]?.pnl ?? 0) >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]')}>
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



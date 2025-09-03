'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn, formatCurrencyValue } from '@/lib/utils'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts'
import { FileText, Settings, Bold, Italic, Underline, Strikethrough, Eraser, Palette, Type, Minus, Plus, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo, Redo, Link as LinkIcon, Code, Quote, ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@/hooks/use-theme'
import Image from 'next/image'
import { Trade } from '@/services/trade-data.service'

type DayDetailModalProps = {
  open: boolean
  onClose: () => void
  date: Date | null
  pnl?: number
  trades?: Trade[]
}

type ChartPoint = { time: string; value: number; positiveValue?: number | null; negativeValue?: number | null }

function formatLocalTime(iso?: string | null): string {
  if (!iso) return '—'
  const utc = new Date(iso)
  if (isNaN(utc.getTime())) return '—'
  // Read user-selected timezone offset (minutes from UTC). Fallback to current app default if missing.
  let targetOffset = (() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('import:timezoneOffsetMinutes')
        if (stored != null && stored !== '') return parseInt(stored)
      }
    } catch {}
    return -new Date().getTimezoneOffset()
  })()

  // Convert UTC -> target timezone by adding offset minutes, then format as UTC to avoid applying browser offset again.
  const shifted = new Date(utc.getTime() + targetOffset * 60 * 1000)
  return shifted.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

function buildChartDataFromTrades(trades: Trade[] | undefined, fallbackPnl?: number): ChartPoint[] {
  if (!trades || trades.length === 0) {
    // fallback to previous simple curve if no trades for the day
    const baseline = [0, -200, -400, -600, -800, -1000]
    const positive = [0, 200, 350, 500, 650, 800]
    const negative = [0, -300, -600, -1000, -800, -600]
    const src = typeof fallbackPnl === 'number' ? (fallbackPnl >= 0 ? positive : negative) : baseline
    return src.map((v, idx) => ({ 
      time: `${9 + idx}:00`, 
      value: v,
      positiveValue: v > 0 ? v : null,
      negativeValue: v < 0 ? v : null
    }))
  }

  // Sort trades by closeTime/exitTime/closeDate, fallback to openDate
  const sorted = [...trades].sort((a, b) => {
    const ta = new Date(a.closeDate || a.openDate).getTime()
    const tb = new Date(b.closeDate || b.openDate).getTime()
    return ta - tb
  })

  let cumulative = 0
  const points: ChartPoint[] = []
  let prevValue: number | null = null
  
  sorted.forEach((t, idx) => {
    cumulative += t.netPnl || 0
    const roundedCumulative = Math.round(cumulative * 100) / 100 // Precise rounding
    
    // Build a readable time label
    const tLabel = t.closeTime || t.exitTime || t.openTime || new Date(t.closeDate || t.openDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || `T${idx + 1}`
    
    // Insert zero crossing point if needed for proper gradient separation
    if (prevValue !== null && 
        Math.abs(prevValue) > 0.01 && 
        Math.abs(roundedCumulative) > 0.01 && 
        ((prevValue > 0 && roundedCumulative < 0) || (prevValue < 0 && roundedCumulative > 0))) {
      points.push({
        time: `${tLabel}-cross`,
        value: 0,
        positiveValue: 0,
        negativeValue: 0
      })
    }
    
    points.push({ 
      time: tLabel, 
      value: roundedCumulative,
      positiveValue: roundedCumulative > 0 ? roundedCumulative : null,
      negativeValue: roundedCumulative < 0 ? roundedCumulative : null
    })
    
    prevValue = roundedCumulative
  })
  
  // Ensure we at least have a starting zero point for nicer area start
  points.unshift({ time: 'Start', value: 0, positiveValue: 0, negativeValue: 0 })
  return points
}

export function DayDetailModal({ open, onClose, date, pnl, trades }: DayDetailModalProps) {
  const isPositive = typeof pnl === 'number' && pnl >= 0
  const chartData = buildChartDataFromTrades(trades, pnl)
  const { theme } = useTheme()
  // Determine dark mode via document class when available, otherwise fallback to explicit theme value
  const isDarkTheme = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : theme === 'dark'
  
  // Generate unique gradient IDs to prevent conflicts with other charts
  const gradientId = useMemo(() => `dayDetail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, [])

  // Compute dynamic Y-axis ticks (matching cumulative PnL chart)
  const yTicks = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0]
    const values: number[] = []
    for (const d of chartData) {
      if (typeof d.value === 'number' && isFinite(d.value)) values.push(d.value)
    }
    if (values.length === 0) return [0]

    const min = Math.min(...values)
    const max = Math.max(...values)

    // Guard single-value or flat series
    if (min === max) {
      const pad = Math.max(1, Math.abs(min) * 0.1)
      return [min - 2 * pad, min - pad, min, min + pad, min + 2 * pad]
    }

    // Nice step calculation for ~6 segments
    const range = max - min
    const rawStep = range / 6
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, Math.abs(rawStep)))))
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude

    // Expand to nice bounds
    const niceMin = Math.floor(min / niceStep) * niceStep
    const niceMax = Math.ceil(max / niceStep) * niceStep

    const ticks: number[] = []
    for (let v = niceMin; v <= niceMax + 1e-9; v += niceStep) {
      // Round to avoid floating point precision issues
      const roundedTick = Math.round(Number(v.toFixed(10)))
      // Avoid duplicate ticks
      if (!ticks.includes(roundedTick)) {
        ticks.push(roundedTick)
      }
    }
    return ticks
  }, [chartData])

  // Smart currency formatter matching cumulative PnL chart
  const formatCurrency = (value: number): string => {
    if (!isFinite(value) || isNaN(value)) return '$0'
    const absValue = Math.abs(value)
    if (absValue >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (absValue >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (absValue >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
    if (absValue < 1 && absValue > 0) return `$${value.toFixed(2)}`
    return `$${Math.round(value).toLocaleString()}`
  }

  // Full price formatter for entry/exit prices (no abbreviations)
  const formatPrice = (value: number): string => {
    if (!isFinite(value) || isNaN(value)) return '$0.00'
    return `$${value.toFixed(2)}`
  }

  // Note editor state
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false)
  const [noteContent, setNoteContent] = useState<string>('')
  const [fontFamily, setFontFamily] = useState<string>('Arial')
  const FONT_SIZES = [12, 14, 15, 16, 18, 20, 24]
  const [fontSizeIndex, setFontSizeIndex] = useState<number>(2)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Minimal sanitizer to strip scripts, event handlers, and unsafe URLs
  const sanitizeHtml = useCallback((dirty: string): string => {
    if (!dirty) return ''
    try {
      const doc = new DOMParser().parseFromString(dirty, 'text/html')
      const nodes = doc.body.querySelectorAll('*')
      nodes.forEach((el) => {
        const tag = el.tagName.toLowerCase()
        if (tag === 'script' || tag === 'style') {
          el.remove()
          return
        }
        ;[...el.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase()
          const val = (attr.value || '').trim()
          if (name.startsWith('on')) el.removeAttribute(attr.name)
          if ((name === 'src' || name === 'href') && val) {
            const lower = val.toLowerCase()
            const http = lower.startsWith('http://') || lower.startsWith('https://')
            const dataImg = lower.startsWith('data:image/')
            const local = lower.startsWith('/') || lower.startsWith('./')
            if (!(http || dataImg || local)) el.removeAttribute(attr.name)
            if (name === 'href' && lower.startsWith('javascript:')) el.removeAttribute(attr.name)
          }
        })
      })
      return doc.body.innerHTML
    } catch {
      return ''
    }
  }, [])

  const storageKey = date ? `day-note:${new Date(date).toISOString().split('T')[0]}` : undefined

  // Load note when date changes or modal opens
  useEffect(() => {
    if (!storageKey) return
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    const safe = sanitizeHtml(saved || '')
    setNoteContent(safe)
    // sync editor DOM
    if (editorRef.current) {
      editorRef.current.innerHTML = safe
    }
  }, [storageKey, open, sanitizeHtml])

  const handleSaveNote = () => {
    if (!storageKey) return
    const content = editorRef.current?.innerHTML ?? noteContent
    localStorage.setItem(storageKey, sanitizeHtml(content || ''))
  }

  // Auto-save with debounce when content changes
  useEffect(() => {
    if (!storageKey) return
    const timer = setTimeout(() => {
      const content = editorRef.current?.innerHTML ?? noteContent
      localStorage.setItem(storageKey, sanitizeHtml(content || ''))
    }, 1000)
    return () => clearTimeout(timer)
  }, [noteContent, storageKey, sanitizeHtml])

  // Ensure save on close/unmount
  useEffect(() => {
    if (!storageKey) return
    if (!open) return
    return () => {
      const content = editorRef.current?.innerHTML ?? noteContent
      localStorage.setItem(storageKey, sanitizeHtml(content || ''))
    }
  }, [open, storageKey, noteContent, sanitizeHtml])

  const onEditorInput = useCallback(() => {
    if (editorRef.current) {
      const safe = sanitizeHtml(editorRef.current.innerHTML)
      if (editorRef.current.innerHTML !== safe) {
        editorRef.current.innerHTML = safe
      }
      setNoteContent(safe)
    }
  }, [sanitizeHtml])

  const exec = (command: string, value?: string) => {
    try {
      document.execCommand(command, false, value)
      editorRef.current?.focus()
      onEditorInput()
    } catch {}
  }

  const insertHTMLAtCursor = (html: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const el = document.createElement('div')
    el.innerHTML = sanitizeHtml(html)
    const frag = document.createDocumentFragment()
    let node: ChildNode | null
    let lastNode: ChildNode | null = null
    while ((node = el.firstChild)) {
      lastNode = frag.appendChild(node)
    }
    range.insertNode(frag)
    if (lastNode) {
      range.setStartAfter(lastNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      if (src.startsWith('data:image/')) {
        insertHTMLAtCursor(`<img src="${src}" style="max-width:100%;height:auto;border-radius:8px;" alt="Uploaded image" />`)
      }
      onEditorInput()
    }
    reader.readAsDataURL(file)
    // reset value so selecting same file again triggers change
    e.target.value = ''
  }

  const setHighlight = (color: string) => {
    // hiliteColor works in most modern browsers; fallback to backColor
    exec('hiliteColor', color)
    exec('backColor', color)
  }

  const applyFontFamily = (family: string) => {
    setFontFamily(family)
    exec('fontName', family)
  }

  const applyFontSize = (index: number) => {
    const clamped = Math.max(0, Math.min(FONT_SIZES.length - 1, index))
    setFontSizeIndex(clamped)
    exec('fontSize', String(clamped + 1))
  }

  // Real stats from trades
  const totalTrades = trades?.length ?? 0
  const winners = (trades || []).filter(t => t.status === 'WIN').length
  const losers = (trades || []).filter(t => t.status === 'LOSS').length
  const grossPnl = Math.round((trades || []).reduce((sum, t) => sum + (t.grossPnl ?? t.netPnl ?? 0), 0))
  const commissions = Math.round(Math.abs((trades || []).reduce((sum, t) => sum + (t.commissions || 0), 0)))
  const totalWinAmt = (trades || []).filter(t => t.netPnl > 0).reduce((s, t) => s + t.netPnl, 0)
  const totalLossAmt = Math.abs((trades || []).filter(t => t.netPnl < 0).reduce((s, t) => s + t.netPnl, 0))
  const profitFactor = totalLossAmt > 0 ? totalWinAmt / totalLossAmt : totalWinAmt > 0 ? Infinity : 0
  const winrate = totalTrades ? Math.round((winners / totalTrades) * 100) : 0

  // Only show the last 3 trades in the table (most recent by close/open date)
  const displayedTrades = useMemo<Trade[]>(() => {
    const list = [...(trades || [])]
    list.sort((a, b) => {
      const ta = new Date(a.closeDate || a.openDate).getTime()
      const tb = new Date(b.closeDate || b.openDate).getTime()
      return tb - ta // desc: newest first
    })
    return list.slice(0, 3)
  }, [trades])

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-7xl w-full p-0 overflow-hidden bg-white dark:bg-[#0f0f0f]">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-lg">
              <span className="font-semibold">{date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }) : '—'}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className={cn('text-sm font-semibold', isPositive ? 'text-[#10B981]' : 'text-[#FB3748]')}>
                Net P&L {typeof pnl === 'number' ? `${pnl >= 0 ? '+' : '-'}${formatCurrencyValue(Math.abs(pnl))}`.replace('$-', '-') : '$0'}
              </span>
            </div>
            <div className="flex items-center gap-2 mr-4 sm:mr-6">
              <Button size="sm" className="bg-[#3559E9] hover:bg-[#2947d1] text-white" onClick={() => setIsNoteMode((v) => !v)}>
                <FileText className="w-4 h-4 mr-2" />
                {isNoteMode ? 'Hide note' : 'View note'}
              </Button>
              {/* Custom Tradestial Logo */}
              <div className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="w-6 h-6 relative">
                  <Image
                    src="/new-tradtrace-logo.png"
                    alt="Tradestial Logo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
              </div>
              <DialogClose aria-label="Close" onClick={onClose} className="focus:outline-none focus:ring-0 ring-0 focus:ring-offset-0 outline-none" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 bg-white dark:bg-[#0f0f0f] [--grid:#e5e7eb] dark:[--grid:#262626]">
          <AnimatePresence initial={false}>
          {isNoteMode && (
            <motion.div
              key="note-area"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="mb-6 overflow-hidden"
              layout
            >
              {/* Toolbar */}
              <div className="rounded-md bg-white dark:bg-[#0f0f0f] px-2 py-1.5 [&_*:focus]:outline-none [&_*:focus-visible]:outline-none [&_*:focus]:ring-0 [&_*:focus-visible]:ring-0 border border-transparent">
                <div className="flex flex-wrap items-center gap-1">
                  {/* Undo/Redo */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('undo')}><Undo className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('redo')}><Redo className="w-4 h-4" /></Button>
                  <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

                  {/* Font family */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#0f0f0f] text-xs text-gray-700 dark:text-gray-300">
                        <Type className="w-4 h-4 text-gray-500" /> {fontFamily}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#2a2a2a]">
                      {[
                        { label: 'Arial', value: 'Arial' },
                        { label: 'Inter', value: 'Inter' },
                        { label: 'Times New Roman', value: 'Times New Roman' },
                        { label: 'Courier New', value: 'Courier New' },
                      ].map(({ label, value }) => (
                        <DropdownMenuItem key={value} onClick={() => applyFontFamily(value)} className="cursor-pointer">
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Font size stepper */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-1 h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#0f0f0f] text-xs text-gray-700 dark:text-gray-300">
                        {FONT_SIZES[fontSizeIndex]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#2a2a2a]">
                      {FONT_SIZES.map((s, idx) => (
                        <DropdownMenuItem key={s} onClick={() => applyFontSize(idx)} className="cursor-pointer">
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

                  {/* Inline styles */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('bold')}><Bold className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('italic')}><Italic className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('underline')}><Underline className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('strikeThrough')}><Strikethrough className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('removeFormat')}><Eraser className="w-4 h-4" /></Button>

                  {/* Text color */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-1 h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#0f0f0f] text-xs text-gray-700 dark:text-gray-300">
                        <Palette className="w-4 h-4 text-gray-500" /> Text
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-2 grid grid-cols-8 gap-2 w-64 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a]">
                      {['#000000','#1F2937','#4B5563','#6B7280','#9CA3AF','#111827','#10b981','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#22c55e','#eab308'].map(c => (
                        <button key={c} className="h-6 w-6 rounded-sm border border-gray-200 dark:border-[#2a2a2a]" style={{ backgroundColor: c }} onClick={() => exec('foreColor', c)} />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Highlight color */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-1 h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#0f0f0f] text-xs text-gray-700 dark:text-gray-300">
                        <Palette className="w-4 h-4 text-yellow-500" /> Highlight
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-2 grid grid-cols-8 gap-2 w-64 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a]">
                      {['#fff59d','#fde68a','#fef08a','#fde047','#facc15','#fde68a80','#fff176','#ffd54f','#ffecb3','#fff9c4','#fff3e0','#ffe0b2','#fecaca','#dcfce7','#dbeafe','#f5d0fe'].map(c => (
                        <button key={c} className="h-6 w-6 rounded-sm border border-gray-200 dark:border-[#2a2a2a]" style={{ backgroundColor: c }} onClick={() => setHighlight(c)} />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

                  {/* Alignment */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('justifyLeft')}><AlignLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('justifyCenter')}><AlignCenter className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('justifyRight')}><AlignRight className="w-4 h-4" /></Button>

                  <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

                  {/* Lists and code */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('insertUnorderedList')}><List className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('insertOrderedList')}><ListOrdered className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('formatBlock', 'blockquote')}><Quote className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('formatBlock', 'pre')}><Code className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => {
                    const url = prompt('Enter URL')
                    if (url) exec('createLink', url)
                  }}><LinkIcon className="w-4 h-4" /></Button>

                  {/* Insert image via URL */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => {
                    const url = prompt('Paste image URL')
                    if (url) {
                      const u = url.trim()
                      const lower = u.toLowerCase()
                      if (lower.startsWith('http://') || lower.startsWith('https://')) {
                        insertHTMLAtCursor(`<img src='${u}' style='max-width:100%;height:auto;border-radius:8px;' alt='Image' />`)
                      }
                    }
                  }}><ImagePlus className="w-4 h-4" /></Button>

                  {/* Hidden file input for image upload */}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs focus:outline-none focus:ring-0" onClick={() => fileInputRef.current?.click()}>Upload</Button>

                  {/* Heading */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-1 h-8 px-2 inline-flex items-center rounded-md bg-white dark:bg-[#0f0f0f] text-xs text-gray-700 dark:text-gray-300">Paragraph</button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#2a2a2a]">
                      {[
                        { label: 'Paragraph', value: 'p' },
                        { label: 'H1', value: 'h1' },
                        { label: 'H2', value: 'h2' },
                        { label: 'H3', value: 'h3' },
                      ].map(({ label, value }) => (
                        <DropdownMenuItem key={value} onClick={() => exec('formatBlock', value)} className="cursor-pointer">
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                onInput={onEditorInput}
                className="mt-3 min-h-[520px] max-h-[70vh] overflow-y-auto rounded-lg bg-white dark:bg-[#0f0f0f] p-4 text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 border border-transparent smooth-scrollbar"
                style={{ fontFamily }}
              />
            </motion.div>
          )}
          </AnimatePresence>
          {/* Top section: chart + stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 5, left: -10, bottom: 20 }}>
                    <defs>
                      {/* Green gradient for positive areas */}
                      <linearGradient id={`${gradientId}-positive`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.6}/>
                        <stop offset="100%" stopColor="#06d6a0" stopOpacity={0.15}/>
                      </linearGradient>
                      {/* Red gradient for negative areas */}
                      <linearGradient id={`${gradientId}-negative`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF4757" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#FF4757" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    
                    {/* Disable default grid entirely */}
                    <CartesianGrid stroke="none" vertical={false} horizontal={false} />
                    
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#9ca3af' }} 
                      className="dark:fill-gray-400"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#9ca3af' }} 
                      className="dark:fill-gray-400"
                      tickFormatter={(value: number) => {
                        if (value === 0) return '$0';
                        return formatCurrency(value);
                      }}
                      domain={[Math.min(...yTicks), Math.max(...yTicks)]}
                      ticks={yTicks}
                      scale="linear"
                      allowDecimals={false}
                    />
                    
                    {/* Draw horizontal grid lines explicitly for each labeled Y tick (including $0) */}
                    {yTicks.map((t) => (
                      <ReferenceLine
                        key={`grid-${t}`}
                        y={t}
                        stroke="var(--grid)"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                        ifOverflow="visible"
                      />
                    ))}
                    
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const p = payload[0].payload as ChartPoint
                      return (
                        <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
                          <div className="font-medium mb-0.5">{p.time}</div>
                          <div className={cn('font-semibold', p.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                            {formatCurrency(p.value)}
                          </div>
                        </div>
                      )
                    }} cursor={false} />
                    
                    {/* Positive area - clip to line using split series */}
                    <Area
                      type="linear"
                      dataKey="positiveValue"
                      stroke="none"
                      fill={`url(#${gradientId}-positive)`}
                      fillOpacity={1}
                      connectNulls={false}
                      isAnimationActive={false}
                      baseValue={0}
                    />
                    
                    {/* Negative area - clip to line using split series */}
                    <Area
                      type="linear"
                      dataKey="negativeValue"
                      stroke="none"
                      fill={`url(#${gradientId}-negative)`}
                      fillOpacity={1}
                      connectNulls={false}
                      isAnimationActive={false}
                      baseValue={0}
                    />
                    
                    {/* Main line stroke - enhanced styling */}
                    <Area
                      type="linear"
                      dataKey="value"
                      stroke="#5B2CC9"
                      strokeWidth={1.5}
                      fill="none"
                      connectNulls={true}
                      isAnimationActive={false}
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#5B2CC9",
                        stroke: "#fff",
                        strokeWidth: 3,
                        filter: "drop-shadow(0 2px 4px rgba(91, 44, 201, 0.3))"
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="md:col-span-5 md:pl-10 md:border-l md:border-gray-200 dark:md:border-[#2a2a2a] flex items-center">
              <div className="w-full grid grid-cols-4 gap-x-6 pr-2 text-gray-900 dark:text-gray-100">
                {/* Column 1 */}
                <div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Total trades</div>
                      <div className="text-lg font-semibold">{totalTrades}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Winrate</div>
                      <div className="text-lg font-semibold">{winrate}%</div>
                    </div>
                  </div>
                </div>
                {/* Column 2 */}
                <div className="border-l border-gray-200 dark:border-[#2a2a2a] pl-6">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Winners</div>
                      <div className="text-lg font-semibold">{winners}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Losers</div>
                      <div className="text-lg font-semibold">{losers}</div>
                    </div>
                  </div>
                </div>
                {/* Column 3 */}
                <div className="border-l border-gray-200 dark:border-[#2a2a2a] pl-4">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Gross P&L</div>
                      <div className={cn('text-lg font-semibold', (grossPnl ?? 0) >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]')}>
                        {(grossPnl ?? 0) >= 0 ? '+' : '-'}{formatCurrencyValue(Math.abs(grossPnl))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Volume</div>
                      <div className="text-lg font-semibold">{(trades || []).reduce((sum, t) => sum + (t.volume || 0), 0)}</div>
                    </div>
                  </div>
                </div>
                {/* Column 4 */}
                <div className="border-l border-gray-200 dark:border-[#2a2a2a] pl-6 pr-3 min-w-[210px]">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Commissions</div>
                      <div className="text-lg font-semibold">{formatCurrencyValue(commissions)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Profit factor</div>
                      <div className="text-lg font-semibold">{Number.isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trades table (matching trades page styling) */}
          <div className="mt-6">
            <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="max-h-[180px] overflow-y-auto">
                  <table className="w-full" style={{ minWidth: '1200px' }}>
                    <thead className="bg-white dark:bg-[#0f0f0f] border-b-2 border-gray-300 dark:border-[#2a2a2a] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] whitespace-nowrap">
                          Symbol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                          Open Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[90px] whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                          Close Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                          Entry Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                          Exit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] whitespace-nowrap">
                          Net P&L
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] whitespace-nowrap">
                          Net ROI
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] whitespace-nowrap">
                          Scale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#0f0f0f] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                      {(trades || []).map((trade) => {
                        const avgEntry = trade.averageEntry ?? trade.entryPrice
                        const avgExit = trade.averageExit ?? trade.exitPrice
                        const netRoi = trade.netRoi || 0
                        
                        return (
                          <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                            <td className="px-4 py-4 min-w-[120px]">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                  trade.symbol === 'ES' ? 'bg-blue-500' :
                                  trade.symbol === 'NQ' ? 'bg-purple-500' :
                                  trade.symbol === 'YM' ? 'bg-green-500' :
                                  trade.symbol === 'RTY' ? 'bg-orange-500' :
                                  'bg-gray-500'
                                }`}>
                                  {trade.symbol?.slice(0, 2) || 'TR'}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{trade.symbol}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                              {new Date(trade.openDate).toLocaleDateString('en-US', { 
                                day: '2-digit', 
                                month: 'short'
                              })}
                            </td>
                            <td className="px-4 py-4 min-w-[90px]">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  trade.status === 'WIN' ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <span className="text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  {trade.status === 'WIN' ? 'Win' : trade.status === 'LOSS' ? 'Loss' : trade.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                              {new Date(trade.closeDate).toLocaleDateString('en-US', { 
                                day: '2-digit', 
                                month: 'short'
                              })}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                              {formatPrice(avgEntry || 0)}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                              {formatPrice(avgExit || 0)}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-medium min-w-[120px] whitespace-nowrap">
                              <span className={`${trade.netPnl >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'} font-semibold`}>
                                {formatCurrency(trade.netPnl)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-sm min-w-[80px] whitespace-nowrap">
                              <span className={`${netRoi >= 0 ? 'text-[#10B981]' : 'text-[#FB3748]'} font-semibold`}>
                                {(netRoi * 100).toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-gray-900 dark:text-gray-100 min-w-[100px] whitespace-nowrap">
                              <div className="flex justify-center">
                                <div className="relative h-2 w-16 bg-gray-200 dark:bg-neutral-800 rounded-full">
                                  <div 
                                    className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-[#4F7DFF] via-[#8B5CF6] to-[#F6B51E]"
                                    style={{ width: `${(() => {
                                      // Calculate dynamic scale based on trade performance
                                      const roi = netRoi || 0
                                      
                                      // Base scale on ROI performance
                                      if (roi >= 0.15) return 100 // Excellent (5/5)
                                      if (roi >= 0.10) return 80  // Very Good (4/5)
                                      if (roi >= 0.05) return 60  // Good (3/5)
                                      if (roi >= 0) return 40     // Fair (2/5)
                                      if (roi >= -0.05) return 20 // Poor (1/5)
                                      return 10                   // Very Poor (0.5/5)
                                    })()}%` }}
                                  ></div>
                                  <span
                                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 block h-3 w-3 rounded-full border-2 bg-white"
                                    style={{ 
                                      left: `${(() => {
                                        const roi = netRoi || 0
                                        if (roi >= 0.15) return 100
                                        if (roi >= 0.10) return 80
                                        if (roi >= 0.05) return 60
                                        if (roi >= 0) return 40
                                        if (roi >= -0.05) return 20
                                        return 10
                                      })()}%`,
                                      borderColor: '#693EE0'
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="dark:bg-[#0f0f0f] dark:border-[#2a2a2a]">Cancel</Button>
              <Button className="bg-[#3559E9] hover:bg-[#2947d1] text-white">View Details</Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DayDetailModal



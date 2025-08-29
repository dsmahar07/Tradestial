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

type ChartPoint = { time: string; value: number }

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
    return src.map((v, idx) => ({ time: `${9 + idx}:00`, value: v }))
  }

  // Sort trades by closeTime/exitTime/closeDate, fallback to openDate
  const sorted = [...trades].sort((a, b) => {
    const ta = new Date(a.closeDate || a.openDate).getTime()
    const tb = new Date(b.closeDate || b.openDate).getTime()
    return ta - tb
  })

  let cumulative = 0
  const points: ChartPoint[] = []
  sorted.forEach((t, idx) => {
    cumulative += t.netPnl || 0
    // Build a readable time label
    const tLabel = t.closeTime || t.exitTime || t.openTime || new Date(t.closeDate || t.openDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || `T${idx + 1}`
    points.push({ time: tLabel, value: Math.round(cumulative) })
  })
  // Ensure we at least have a starting zero point for nicer area start
  points.unshift({ time: 'Start', value: 0 })
  return points
}

export function DayDetailModal({ open, onClose, date, pnl, trades }: DayDetailModalProps) {
  const isPositive = typeof pnl === 'number' && pnl >= 0
  const chartData = buildChartDataFromTrades(trades, pnl)
  const { theme } = useTheme()
  // Determine dark mode via document class when available, otherwise fallback to explicit theme value
  const isDarkTheme = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : theme === 'dark'

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
      <DialogContent className="max-w-7xl w-full p-0 overflow-hidden bg-white dark:bg-[#121212]">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-lg">
              <span className="font-semibold">{date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }) : '—'}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className={cn('text-sm font-semibold', isPositive ? 'text-[#3559E9]' : 'text-[#FB3748]')}>
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

        <div className="px-8 pb-8 bg-white dark:bg-[#121212]">
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
              <div className="rounded-md bg-white dark:bg-[#121212] px-2 py-1.5 [&_*:focus]:outline-none [&_*:focus-visible]:outline-none [&_*:focus]:ring-0 [&_*:focus-visible]:ring-0 border border-transparent">
                <div className="flex flex-wrap items-center gap-1">
                  {/* Undo/Redo */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('undo')}><Undo className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus:ring-0" onClick={() => exec('redo')}><Redo className="w-4 h-4" /></Button>
                  <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

                  {/* Font family */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#131313] text-xs text-gray-700 dark:text-gray-300">
                        <Type className="w-4 h-4 text-gray-500" /> {fontFamily}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#2a2a2a]">
                      {['Arial','Inter','Times New Roman','Courier New'].map(f => (
                        <DropdownMenuItem key={f} onClick={() => applyFontFamily(f)} className="cursor-pointer">
                          {f}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Font size stepper */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-1 h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#131313] text-xs text-gray-700 dark:text-gray-300">
                        {FONT_SIZES[fontSizeIndex]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#2a2a2a]">
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
                      <button className="ml-1 h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#131313] text-xs text-gray-700 dark:text-gray-300">
                        <Palette className="w-4 h-4 text-gray-500" /> Text
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-2 grid grid-cols-8 gap-2 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]">
                      {['#000000','#1F2937','#4B5563','#6B7280','#9CA3AF','#111827','#10b981','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#22c55e','#eab308'].map(c => (
                        <button key={c} className="h-6 w-6 rounded-sm border border-gray-200 dark:border-[#2a2a2a]" style={{ backgroundColor: c }} onClick={() => exec('foreColor', c)} />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Highlight color */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-1 h-8 px-2 inline-flex items-center gap-1 rounded-md bg-white dark:bg-[#131313] text-xs text-gray-700 dark:text-gray-300">
                        <Palette className="w-4 h-4 text-yellow-500" /> Highlight
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-2 grid grid-cols-8 gap-2 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]">
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
                      <button className="ml-1 h-8 px-2 inline-flex items-center rounded-md bg-white dark:bg-[#131313] text-xs text-gray-700 dark:text-gray-300">Paragraph</button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#2a2a2a]">
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
                className="mt-3 min-h-[520px] max-h-[70vh] overflow-y-auto rounded-lg bg-white dark:bg-[#121212] p-4 text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 border border-transparent"
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
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dayDetailGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDarkTheme ? '#9ca3af' : '#6b7280' }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: isDarkTheme ? '#9ca3af' : '#6b7280' }} 
                      tickFormatter={(v: number) => `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString()}`}
                      domain={[ 
                        (dataMin: number) => Math.min(0, Math.floor(dataMin * 1.15)), 
                        (dataMax: number) => Math.max(0, Math.ceil(dataMax * 1.15)) 
                      ]}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#374151' : '#e5e7eb'} vertical={false} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const p = payload[0].payload as ChartPoint
                      return (
                        <div className="bg-white dark:bg-[#171717] border rounded-md px-2 py-1 text-xs shadow">
                          <div className="font-medium mb-0.5">{p.time}</div>
                          <div className={cn(p.value >= 0 ? 'text-[#3559E9]' : 'text-[#FB3748]')}>{`${p.value >= 0 ? '+' : '-'}${formatCurrencyValue(Math.abs(p.value))}`}</div>
                        </div>
                      )
                    }} />
                    <Area type="monotone" dataKey="value" stroke="#6F52ED" strokeWidth={2} fill="url(#dayDetailGradient)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="md:col-span-5 md:pl-10 md:border-l md:border-gray-200 dark:md:border-gray-700 flex items-center">
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
                <div className="border-l border-gray-200 dark:border-[#2a2a2a] pl-6">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Gross P&L</div>
                      <div className={cn('text-lg font-semibold', (grossPnl ?? 0) >= 0 ? 'text-[#3559E9]' : 'text-[#FB3748]')}>
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

          {/* Trades table (real data) */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400">
                  {['Symbol','Average entry','Best exit P&L','Best exit (%)','Best exit Price','Best exit Time','Close time','Custom tags','Average exit','Net P&L'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedTrades.map((t) => {
                  const avgEntry = t.averageEntry ?? t.entryPrice
                  const avgExit = t.averageExit ?? t.exitPrice
                  const bestExitPnl = t.bestExitPnl ?? null
                  const bestExitPercent = t.bestExitPercent ?? null
                  const bestExitPrice = t.bestExitPrice ?? null
                  const bestExitTime = t.bestExitTime ?? null
                  const closeTime = t.closeTime || t.exitTime || ''
                  const tags = (t.customTags && t.customTags.length > 0) ? t.customTags.join(', ') : (t.tags && t.tags.length > 0 ? t.tags.join(', ') : '—')
                  return (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-[#2a2a2a]">
                      <td className="py-2 px-3">{t.symbol}</td>
                      <td className="py-2 px-3">{typeof avgEntry === 'number' ? formatCurrencyValue(avgEntry) : '—'}</td>
                      <td className="py-2 px-3">{typeof bestExitPnl === 'number' ? formatCurrencyValue(bestExitPnl) : '—'}</td>
                      <td className="py-2 px-3">{bestExitPercent ?? '—'}</td>
                      <td className="py-2 px-3">{typeof bestExitPrice === 'number' ? formatCurrencyValue(bestExitPrice) : '—'}</td>
                      <td className="py-2 px-3">{formatLocalTime(bestExitTime)}</td>
                      <td className="py-2 px-3">{closeTime || '—'}</td>
                      <td className="py-2 px-3">{tags}</td>
                      <td className="py-2 px-3">{typeof avgExit === 'number' ? formatCurrencyValue(avgExit) : '—'}</td>
                      <td className={cn('py-2 px-3 font-medium', (t.netPnl ?? 0) >= 0 ? 'text-[#3559E9]' : 'text-[#FB3748]')}>
                        {(t.netPnl ?? 0) >= 0 ? '+' : '-'}{formatCurrencyValue(Math.abs(t.netPnl || 0))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-4 flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button className="bg-[#3559E9] hover:bg-[#2947d1] text-white">View Details</Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DayDetailModal



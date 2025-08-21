'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn, formatCurrencyValue } from '@/lib/utils'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts'
import { FileText, Settings, Bold, Italic, Underline, Strikethrough, Eraser, Palette, Type, Minus, Plus, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo, Redo, Link as LinkIcon, Code, Quote, ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '@/hooks/use-theme'
import Image from 'next/image'

type DayDetailModalProps = {
  open: boolean
  onClose: () => void
  date: Date | null
  pnl?: number
}

type ChartPoint = { time: string; value: number }

function buildChartData(pnl?: number): ChartPoint[] {
  // Generate a simple day equity curve based on sign of P&L
  const baseline = [0, -200, -400, -600, -800, -1000]
  const positive = [0, 200, 350, 500, 650, 800]
  const negative = [0, -300, -600, -1000, -800, -600]
  const src = typeof pnl === 'number' ? (pnl >= 0 ? positive : negative) : baseline
  return src.map((v, idx) => ({ time: `${9 + idx}:00`, value: v }))
}

export function DayDetailModal({ open, onClose, date, pnl }: DayDetailModalProps) {
  const isPositive = typeof pnl === 'number' && pnl >= 0
  const chartData = buildChartData(pnl)
  const { theme } = useTheme()
  const isDarkTheme = theme === 'dark' || (theme === 'system' && typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))

  // Note editor state
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false)
  const [noteContent, setNoteContent] = useState<string>('')
  const [fontFamily, setFontFamily] = useState<string>('Arial')
  const FONT_SIZES = [12, 14, 15, 16, 18, 20, 24]
  const [fontSizeIndex, setFontSizeIndex] = useState<number>(2)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storageKey = date ? `day-note:${new Date(date).toISOString().split('T')[0]}` : undefined

  // Load note when date changes or modal opens
  useEffect(() => {
    if (!storageKey) return
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    setNoteContent(saved || '')
    // sync editor DOM
    if (editorRef.current) {
      editorRef.current.innerHTML = saved || ''
    }
  }, [storageKey, open])

  const handleSaveNote = () => {
    if (!storageKey) return
    const content = editorRef.current?.innerHTML ?? noteContent
    localStorage.setItem(storageKey, content || '')
  }

  // Auto-save with debounce when content changes
  useEffect(() => {
    if (!storageKey) return
    const timer = setTimeout(() => {
      const content = editorRef.current?.innerHTML ?? noteContent
      localStorage.setItem(storageKey, content || '')
    }, 1000)
    return () => clearTimeout(timer)
  }, [noteContent, storageKey])

  // Ensure save on close/unmount
  useEffect(() => {
    if (!storageKey) return
    if (!open) return
    return () => {
      const content = editorRef.current?.innerHTML ?? noteContent
      localStorage.setItem(storageKey, content || '')
    }
  }, [open, storageKey, noteContent])

  const onEditorInput = useCallback(() => {
    if (editorRef.current) {
      setNoteContent(editorRef.current.innerHTML)
    }
  }, [])

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
    el.innerHTML = html
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
      insertHTMLAtCursor(`<img src="${src}" style="max-width:100%;height:auto;border-radius:8px;" />`)
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

  // Simple mock stats (can be wired to real data later)
  const totalTrades = typeof pnl === 'number' && pnl !== 0 ? 2 : 0
  const winners = isPositive ? 1 : 1
  const losers = isPositive ? 1 : 1
  const grossPnl = Math.round((pnl ?? 0) * 0.86)
  const commissions = Math.abs(Math.round((pnl ?? 0) * 0.14))
  const profitFactor = isPositive ? 1.45 : 0.68
  const winrate = totalTrades ? Math.round((winners / totalTrades) * 100) : 0

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-7xl w-full p-0 overflow-hidden bg-white dark:bg-[#121212]">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-lg">
              <span className="font-semibold">{date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }) : '—'}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className={cn('text-sm font-semibold', isPositive ? 'text-green-600' : 'text-red-600')}>
                Net P&L {typeof pnl === 'number' ? `${pnl >= 0 ? '+' : '-'}${formatCurrencyValue(Math.abs(pnl))}`.replace('$-', '-') : '$0'}
              </span>
            </div>
            <div className="flex items-center gap-2 mr-4 sm:mr-6">
              <Button size="sm" className="bg-[#3559E9] hover:bg-[#2947d1] text-white" onClick={() => setIsNoteMode((v) => !v)}>
                <FileText className="w-4 h-4 mr-2" />
                {isNoteMode ? 'Hide note' : 'View note'}
              </Button>
              {/* Custom Tradtrace Logo */}
              <div className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="w-6 h-6 relative">
                  <Image
                    src="/new-tradtrace-logo.png"
                    alt="Tradtrace Logo"
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
                    if (url) insertHTMLAtCursor(`<img src='${url}' style='max-width:100%;height:auto;border-radius:8px;' />`)
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
                          <div className={cn(p.value >= 0 ? 'text-green-600' : 'text-red-600')}>{`${p.value >= 0 ? '+' : '-'}${formatCurrencyValue(Math.abs(p.value))}`}</div>
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
                      <div className={cn('text-lg font-semibold', (pnl ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                        {(pnl ?? 0) >= 0 ? '+' : '-'}{formatCurrencyValue(Math.abs(grossPnl))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Volume</div>
                      <div className="text-lg font-semibold">21</div>
                    </div>
                  </div>
                </div>
                {/* Column 4 */}
                <div className="border-l border-gray-200 dark:border-[#2a2a2a] pl-6 pr-3 min-w-[210px]">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Commissions</div>
                      <div className="text-lg font-semibold">${commissions}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Profit factor</div>
                      <div className="text-lg font-semibold">{profitFactor.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trades table (placeholder) */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400">
                  {['Average entry','Best exit P&L','Best exit (%)','Best exit Price','Best exit Time','Close time','Custom_tags','Average exit'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0,1].map((i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-[#2a2a2a]">
                    <td className="py-2 px-3">$23,61{7 + i}.25</td>
                    <td className="py-2 px-3">{i === 0 ? '-' : '$0'}</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">$0</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3">07:{i === 0 ? '21:03' : '14:27'}</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3">$23,61{1 + i}.43</td>
                  </tr>
                ))}
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



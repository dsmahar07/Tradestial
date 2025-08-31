'use client'

import {
  Share2,
  Download,
  MoreHorizontal,
  Edit3,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Link,
  Code,
  Camera,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Hash,
  CheckSquare,
  Smile,
  Copy,
  FileText,
  Trash2,
  ChevronDown,
  Calendar,
  Plus,
  X,
  Save,
  MoreVertical
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Button } from '@/components/ui/button'
import { TemplateSelector } from '@/components/features/notes/TemplateSelector'
import { SimpleTemplateEditor } from '@/components/features/notes/SimpleTemplateEditor'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Note } from '@/app/notes/page'
import type { TradeJournalingTemplate } from '@/lib/templates'
import type { TemplateInstance } from '@/types/templates'
import { useState, useRef, useEffect, useCallback } from 'react'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { cn } from '@/lib/utils'
import { encodeNoteToToken } from '@/lib/note-share'
import { DataStore } from '@/services/data-store.service'
import { accountService } from '@/services/account.service'

interface NotebookEditorProps {
  note: Note | null
  onUpdateNote?: (id: string, content: string, title?: string, color?: string, tags?: string[]) => void
  onDeleteNote?: (id: string, noteTitle: string) => void
  useDatePicker?: boolean
  onDateChange?: (selectedDate: Date) => void
  useRangePicker?: boolean
  onRangeChange?: (startDate: Date, endDate: Date) => void
  // When using Sessions Recap, parent can pass the active range so sharing has stats even if user didn't open picker here
  rangeFrom?: Date
  rangeTo?: Date
  hideNetPnl?: boolean
  headerStats?: React.ReactNode
  netPnlValue?: number
  netPnlIsProfit?: boolean
  // Template creation props (optional)
  onCreateNote?: () => void
  onCreateNoteFromTemplate?: (template: TradeJournalingTemplate, templateInstance: TemplateInstance, generatedContent: string) => void
  onQuickApplyTemplate?: (template: TradeJournalingTemplate, content: string) => void
  onDeleteTemplate?: (template: TradeJournalingTemplate) => void
  templates?: TradeJournalingTemplate[]
}

export function NotebookEditor({ note, onUpdateNote, onDeleteNote, useDatePicker = false, onDateChange, useRangePicker = false, onRangeChange, rangeFrom, rangeTo, hideNetPnl = false, headerStats, netPnlValue, netPnlIsProfit, onCreateNote, onCreateNoteFromTemplate, onQuickApplyTemplate, onDeleteTemplate, templates }: NotebookEditorProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [content, setContent] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  // Template editor state
  const [selectedTemplate, setSelectedTemplate] = useState<TradeJournalingTemplate | null>(null)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  // Clipboard helper to avoid runtime errors in non-secure/unsupported contexts
  const safeCopyToClipboard = useCallback(async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && (window as any).isSecureContext !== false) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      // fall back to execCommand
    }
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }, [])

  const handleTitleEdit = () => {
    if (note) {
      if (useRangePicker) {
        setShowRangePicker(!showRangePicker)
        setShowDatePicker(false)
      } else if (useDatePicker) {
        setShowDatePicker(!showDatePicker)
        setShowRangePicker(false)
      } else {
        setTempTitle(note.title)
        setIsEditingTitle(true)
      }
    }
  }

  // Compute tradingData snapshot for sharing when the note doesn't already have it.
  // Supports both single-day and range (Sessions Recap) contexts.
  const computeTradingDataForShare = useCallback((n: Note | null) => {
    if (!n) return undefined
    if (n.tradingData) return n.tradingData
    // If we're in Sessions Recap and have a selected range, compute range stats
    if (useRangePicker) {
      const start = dateRange.from || rangeFrom
      const end = dateRange.to || rangeTo
      if (start && end) {
        const trades = DataStore.getTradesByDateRange(start, end)
      if (!Array.isArray(trades) || trades.length === 0) return undefined

      const totalTrades = trades.length
      const winners = trades.filter((t: any) => t.netPnl > 0).length
      const losers = trades.filter((t: any) => t.netPnl < 0).length
      const winrate = totalTrades > 0 ? `${Math.round((winners / totalTrades) * 100)}%` : '0%'
      const grossPnl = trades.reduce((s: number, t: any) => s + (t.grossPnl ?? t.netPnl ?? 0), 0)
      const commissions = trades.reduce((s: number, t: any) => s + (t.commissions ?? 0), 0)
      const volume = trades.reduce((s: number, t: any) => s + (t.contractsTraded ?? 0), 0)
      const avgWin = winners > 0 ? trades.filter((t: any) => t.netPnl > 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0) / winners : 0
      const avgLoss = losers > 0 ? Math.abs(trades.filter((t: any) => t.netPnl < 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0)) / losers : 0
      const profitFactor = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0

      const points = trades
        .map((t: any) => ({
          time: (t.entryTime || t.openTime || t.closeTime || '16:00')?.slice(0, 5),
          pnl: t.netPnl ?? 0,
        }))
        .sort((a: any, b: any) => a.time.localeCompare(b.time))

      let running = 0
      const chartData = points.map((p: any) => {
        running += p.pnl
        return { time: p.time, value: Math.round(running) }
      })

      const netPnl = Math.round(trades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0))

      const fmt = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      }

      return {
        netPnl,
        isProfit: netPnl >= 0,
        stats: {
          totalTrades,
          winners,
          losers,
          winrate,
          grossPnl: Math.round(grossPnl),
          volume,
          commissions: Math.round(commissions),
          profitFactor,
        },
        chartData,
        trades,
        date: `${fmt(start)}..${fmt(end)}`,
      }
      }
    }

    // Otherwise, infer a single journal day in a robust way
    let day: Date | null = null
    const parsedFromTitle = Date.parse(n.title || '')
    if (!isNaN(parsedFromTitle)) {
      day = new Date(parsedFromTitle)
    } else if (n.createdAt) {
      const parsedCreated = Date.parse(String(n.createdAt))
      if (!isNaN(parsedCreated)) day = new Date(parsedCreated)
    } else if (n.updatedAt) {
      const parsedUpdated = Date.parse(String(n.updatedAt))
      if (!isNaN(parsedUpdated)) day = new Date(parsedUpdated)
    }
    if (!day) return undefined
    const trades = DataStore.getTradesByDateRange(day, day)
    if (!Array.isArray(trades) || trades.length === 0) return undefined

    const totalTrades = trades.length
    const winners = trades.filter((t: any) => t.netPnl > 0).length
    const losers = trades.filter((t: any) => t.netPnl < 0).length
    const winrate = totalTrades > 0 ? `${Math.round((winners / totalTrades) * 100)}%` : '0%'
    const grossPnl = trades.reduce((s: number, t: any) => s + (t.grossPnl ?? t.netPnl ?? 0), 0)
    const commissions = trades.reduce((s: number, t: any) => s + (t.commissions ?? 0), 0)
    const volume = trades.reduce((s: number, t: any) => s + (t.contractsTraded ?? 0), 0)
    const avgWin = winners > 0 ? trades.filter((t: any) => t.netPnl > 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0) / winners : 0
    const avgLoss = losers > 0 ? Math.abs(trades.filter((t: any) => t.netPnl < 0).reduce((s: number, t: any) => s + (t.netPnl ?? 0), 0)) / losers : 0
    const profitFactor = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0

    const points = trades
      .map((t: any) => ({
        time: (t.entryTime || t.openTime || t.closeTime || '16:00')?.slice(0, 5),
        pnl: t.netPnl ?? 0,
      }))
      .sort((a: any, b: any) => a.time.localeCompare(b.time))

    let running = 0
    const chartData = points.map((p: any) => {
      running += p.pnl
      return { time: p.time, value: Math.round(running) }
    })

    const netPnl = Math.round(trades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0))
    const y = day.getFullYear()
    const m = String(day.getMonth() + 1).padStart(2, '0')
    const d = String(day.getDate()).padStart(2, '0')

    return {
      netPnl,
      isProfit: netPnl >= 0,
      stats: {
        totalTrades,
        winners,
        losers,
        winrate,
        grossPnl: Math.round(grossPnl),
        volume,
        commissions: Math.round(commissions),
        profitFactor,
      },
      chartData,
      trades,
      date: `${y}-${m}-${d}`,
    }
  }, [])

  const handleTemplateSelect = (template: TradeJournalingTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateEditor(true)
  }

  const handleTemplateEditorSave = (content: string) => {
    if (selectedTemplate && onCreateNoteFromTemplate) {
      const templateInstance: TemplateInstance = {
        templateId: selectedTemplate.id,
        fieldValues: {},
        customFields: [],
      }
      onCreateNoteFromTemplate(selectedTemplate, templateInstance, content)
    }
    setShowTemplateEditor(false)
    setSelectedTemplate(null)
  }

  const handleTemplateEditorCancel = () => {
    setShowTemplateEditor(false)
    setSelectedTemplate(null)
  }

  const handleDateSelect = (selectedDate: Date) => {
    if (note) {
      if (useDatePicker && onDateChange) {
        onDateChange(selectedDate)
      } else {
        const formattedDate = selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        onUpdateNote?.(note.id, note.content, formattedDate)
      }
      setShowDatePicker(false)
    }
  }

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })

  const handleRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (range.from && range.to && onRangeChange) {
      onRangeChange(range.from, range.to)
      setDateRange(range)
      setShowRangePicker(false)
    }
  }

  // Generate calendar for date picker
  const generateCalendarDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({
        date: prevDate.getDate(),
        fullDate: prevDate,
        isCurrentMonth: false
      })
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day)
      days.push({
        date: day,
        fullDate,
        isCurrentMonth: true
      })
    }
    
    // Next month's days to complete the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({
        date: day,
        fullDate: nextDate,
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const handleTitleSave = () => {
    if (note && tempTitle.trim() && tempTitle !== note.title) {
      onUpdateNote?.(note.id, note.content, tempTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setTempTitle('')
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }
  const [showTagInput, setShowTagInput] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fontSize, setFontSize] = useState('15px')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Basic, dependency-free HTML sanitizer to prevent XSS
  const sanitizeHtml = useCallback((html: string): string => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null)
      const dangerousTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'])
      const dangerousAttrs = [/^on/i, /javascript:/i, /data:text\/html/i]
      let node = walker.currentNode as HTMLElement | null
      while (node) {
        const el = node as HTMLElement
        // Remove dangerous elements entirely
        if (dangerousTags.has(el.tagName.toLowerCase())) {
          const toRemove = el
          node = walker.nextNode() as HTMLElement | null
          toRemove.remove()
          continue
        }
        // Strip dangerous attributes
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name
          const value = attr.value
          if (dangerousAttrs.some((re) => re.test(name)) || dangerousAttrs.some((re) => re.test(value))) {
            el.removeAttribute(name)
            continue
          }
          if (name === 'src' || name === 'href') {
            const lowered = value.trim().toLowerCase()
            if (lowered.startsWith('javascript:') || lowered.startsWith('data:text/html')) {
              el.removeAttribute(name)
            }
          }
        }
        node = walker.nextNode() as HTMLElement | null
      }
      return doc.body.innerHTML
    } catch {
      return ''
    }
  }, [])

  // Load note content when note changes
  useEffect(() => {
    if (note) {
      const noteContent = note.content || ''
      setContent(noteContent)
      setIsEditing(false) // Reset editing state when switching notes
    } else {
      setContent('')
      setIsEditing(false)
    }
  }, [note?.id, note?.content]) // Only watch for note changes, not editing state

  // Manage editor innerHTML directly to prevent content loss
  useEffect(() => {
    if (editorRef.current && content && !isEditing) {
      // Only update innerHTML if it's different and we're not actively editing
      const sanitized = sanitizeHtml(content)
      if (editorRef.current.innerHTML !== sanitized) {
        editorRef.current.innerHTML = sanitized
      }
    } else if (editorRef.current && !content && !isEditing) {
      editorRef.current.innerHTML = ''
    }
  }, [content, isEditing, sanitizeHtml])

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (note && content && content !== note.content && isEditing && content.trim() !== '' && content !== '<p><br></p>') {
      const timeoutId = setTimeout(() => {
        onUpdateNote?.(note.id, content)
        setLastSaved(new Date())
      }, 2000) // Increased delay to reduce rapid saves

      return () => clearTimeout(timeoutId)
    }
  }, [content, note?.id, onUpdateNote, isEditing])

  const handleEditorClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      if (editorRef.current) {
        // Clear any placeholder content and focus
        if (!content || content.trim() === '') {
          editorRef.current.innerHTML = ''
        }
        editorRef.current.focus()
        // Place cursor at end
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }
  }

  const handleEditorInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!note) return

    try {
      const target = e.currentTarget
      if (target) {
        let newContent = sanitizeHtml(target.innerHTML || '')

        // Normalize content to preserve emojis and clean up browser-specific HTML
        // Remove zero-width spaces and other invisible characters that browsers might add
        newContent = newContent.replace(/[\u200B-\u200D\uFEFF]/g, '')

        // Only update if content actually changed and we're in editing mode
        if (newContent !== content && isEditing) {
          setContent(newContent)
        }
      }
    } catch (error) {
      console.error('Error in handleEditorInput:', error)
    }
  }, [content, note, isEditing, sanitizeHtml])

  const handleEditorBlur = useCallback((e: React.FocusEvent) => {
    // Only set editing to false if focus is leaving the editor entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !editorRef.current?.contains(relatedTarget)) {
      setTimeout(() => setIsEditing(false), 100) // Small delay to prevent flicker
    }
  }, [])

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()

    try {
      // Try to get HTML content first, then fall back to plain text
      const htmlPaste = e.clipboardData.getData('text/html')
      const plainPaste = e.clipboardData.getData('text/plain')

      const selection = window.getSelection()

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()

        if (htmlPaste) {
          // For HTML content, sanitize before insert
          const safe = sanitizeHtml(htmlPaste)
          document.execCommand('insertHTML', false, safe)
        } else if (plainPaste) {

          // For plain text, check if it contains emojis and convert them to Apple emojis
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu

          if (emojiRegex.test(plainPaste)) {
            // Convert emojis to Apple emoji images
            const convertedContent = plainPaste.replace(emojiRegex, (emoji) => {
              return getAppleEmojiHTML(emoji)
            })
            document.execCommand('insertHTML', false, sanitizeHtml(convertedContent))
          } else {

            // Regular text, insert as text node
            const textNode = document.createTextNode(plainPaste)
            range.insertNode(textNode)
            range.setStartAfter(textNode)
            range.collapse(true)

            selection.removeAllRanges()
            selection.addRange(range)
          }
        }

        // Update content with delay
        setTimeout(() => {
          if (editorRef.current) {
            const newContent = sanitizeHtml(editorRef.current.innerHTML)
            setContent(newContent)
            setIsEditing(true)
          }
        }, 0)
      }
    } catch (error) {

      console.error('Error handling paste:', error)
      // Fallback to default paste behavior
      try {
        document.execCommand('paste')
        setTimeout(() => {
          if (editorRef.current) {
            const newContent = sanitizeHtml(editorRef.current.innerHTML)
            setContent(newContent)
            setIsEditing(true)
          }
        }, 0)
      } catch (fallbackError) {
        console.error('Fallback paste also failed:', fallbackError)
      }
    }
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatText('bold')
          break
        case 'i':
          e.preventDefault()
          formatText('italic')
          break
        case 'u':
          e.preventDefault()
          formatText('underline')
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            formatText('redo')
          } else {
            formatText('undo')
          }
          break
      }
    }
  }

  const formatText = useCallback((command: string, value?: string) => {
    if (!editorRef.current || !note) return

    try {
      // Ensure editor is focused
      editorRef.current.focus()

      // Save current selection
      const selection = window.getSelection()

      if (!selection || selection.rangeCount === 0) return

      // Execute the command
      document.execCommand(command, false, value)

      // Get the updated content and update state
      setTimeout(() => {
        if (editorRef.current) {
          const newContent = sanitizeHtml(editorRef.current.innerHTML)
          setContent(newContent)
          setIsEditing(true)
        }
      }, 10)

    } catch (error) {
      console.error(`Error executing command ${command}:`, error)
    }
  }, [note, sanitizeHtml])

  // Helper function to convert emoji to Apple emoji image HTML
  const getAppleEmojiHTML = useCallback((emoji: string) => {
    // Handle compound emojis (with variation selectors) properly
    const getEmojiCodepoints = (emoji: string): string[] => {
      const codepoints = []
      for (let i = 0; i < emoji.length; ) {
        const codepoint = emoji.codePointAt(i)
        if (codepoint) {
          // Skip variation selectors (U+FE0F) for image URLs
          if (codepoint !== 0xFE0F) {
            codepoints.push(codepoint.toString(16).toLowerCase())
          }
          i += codepoint > 0xFFFF ? 2 : 1
        } else {
          i++
        }
      }
      return codepoints
    }

    const codepoints = getEmojiCodepoints(emoji)
    if (codepoints.length === 0) return emoji // fallback

    const primaryCodepoint = codepoints[0].padStart(4, '0')
    // No inline event handlers; safe src only
    return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryCodepoint}.png" alt="${emoji}" class="inline-block w-5 h-5 align-text-bottom" style="display: inline-block; width: 20px; height: 20px; vertical-align: text-bottom; margin: 0 1px;" />`
  }, [])

  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

  const insertContent = useCallback((content: string) => {

    if (!editorRef.current || !note) {
      if (isDev) console.debug('insertContent: missing editor or note', { editor: !!editorRef.current, note: !!note })
      return
    }

    if (isDev) console.debug('insertContent called with:', content)

    try {
      // Ensure editor is focused and in editing mode
      editorRef.current.focus()
      setIsEditing(true)

      // Check if content is a single emoji
      const isEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u.test(content.trim())

      if (isEmoji && content.length <= 2) {
        // For emojis, insert as Apple emoji image
        const emojiHTML = getAppleEmojiHTML(content)
        document.execCommand('insertHTML', false, sanitizeHtml(emojiHTML))
      } else {
        // For other content, use insertHTML
        document.execCommand('insertHTML', false, sanitizeHtml(content))
      }

      // Force content update
      setTimeout(() => {
        if (editorRef.current) {
          const newContent = sanitizeHtml(editorRef.current.innerHTML)
          if (isDev) console.debug('Content after insert:', newContent)
          setContent(newContent)
        }
      }, 0)

    } catch (error) {
      if (isDev) console.error('Error inserting content:', error)

      // Ultimate fallback: directly modify innerHTML
      try {
        if (editorRef.current) {
          const selection = window.getSelection()

          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)

            // Check if it's an emoji and create appropriate content
            const isEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u.test(content.trim())

            if (isEmoji && content.length <= 2) {
              // Insert as Apple emoji image
              const emojiHTML = getAppleEmojiHTML(content)
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = sanitizeHtml(emojiHTML)
              const emojiElement = tempDiv.firstChild

              if (emojiElement) {
                range.insertNode(emojiElement)
                range.setStartAfter(emojiElement)
                range.collapse(true)
                selection.removeAllRanges()
                selection.addRange(range)
              }
            } else {
              // Insert as text
              const textNode = document.createTextNode(content)

              range.insertNode(textNode)

              range.setStartAfter(textNode)
              range.collapse(true)
              selection.removeAllRanges()
              selection.addRange(range)
            }
          }

          const newContent = sanitizeHtml(editorRef.current.innerHTML)
          if (isDev) console.debug('Fallback content after insert:', newContent)
          setContent(newContent)
          setIsEditing(true)
        }
      } catch (fallbackError) {
        if (isDev) console.error('Ultimate fallback failed:', fallbackError)
      }
    }
  }, [note, getAppleEmojiHTML, sanitizeHtml])

  const handleImageUpload = useCallback(() => {
    if (!editorRef.current || !note) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          const imageHtml = `<div><img src="${imageUrl}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" alt="Uploaded image" /></div><p><br></p>`

          // Use the safer insertContent method
          insertContent(imageHtml)
        }
        reader.readAsDataURL(file)
      } else {
        if (isDev) console.debug('Please select an image file under 5MB')
      }
    }
    input.click()
  }, [note, insertContent])

  const handleEmojiInsert = useCallback(() => {
    const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '💡', '✅', '❌', '⭐', '📝', '💼', '🚀']
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    insertContent(emoji)
  }, [insertContent])

  const handleLinkInsert = useCallback(() => {
    const url = prompt('Enter URL:')
    if (url) {
      const u = url.trim()
      const lower = u.toLowerCase()
      if (lower.startsWith('http://') || lower.startsWith('https://')) {
        const selection = window.getSelection()
        const selectedText = selection?.toString() || u
        const linkHtml = `<a href="${u}" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;" target="_blank">${selectedText}</a>`
        insertContent(linkHtml)
      }
    }
  }, [insertContent])

  if (!note) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a note to start editing</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="flex-1 min-h-0 min-w-0 bg-white dark:bg-[#171717] flex flex-col">
      {/* Trading Journal Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#171717]">
        {/* Top Header with Date and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 relative">
            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 min-w-0 flex-1"
                autoFocus
              />
            ) : (
              <div className="relative">
                <h1 
                  className={cn(
                    "text-xl font-semibold text-gray-900 dark:text-white cursor-pointer px-2 py-1 rounded transition-colors flex items-center space-x-2",
                    useDatePicker 
                      ? "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={handleTitleEdit}
                  title={useDatePicker ? "Click to select date" : "Click to edit title"}
                >
                  <span>{note.title}</span>
                </h1>
                
                {/* Date Picker Dropdown - positioned as overlay */}
                {showDatePicker && useDatePicker && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDatePicker(false)}
                    />
                    
                    {/* Date Picker */}
                    <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-4 min-w-[320px] animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Select Date</h3>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {/* Calendar Headers */}
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {/* Calendar Days */}
                          {generateCalendarDays().map((day, index) => {
                            const isToday = day.fullDate.toDateString() === new Date().toDateString()
                            const isCurrentMonth = day.isCurrentMonth
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleDateSelect(day.fullDate)}
                                className={cn(
                                  "h-8 w-8 rounded-md text-sm transition-all duration-150 hover:scale-110",
                                  isCurrentMonth 
                                    ? "text-gray-900 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-900" 
                                    : "text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700",
                                  isToday && "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                                )}
                              >
                                {day.date}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDateSelect(new Date())}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          Today
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDatePicker(false)}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Range Picker - using Radix UI component */}
                {showRangePicker && useRangePicker && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowRangePicker(false)}
                    />
                    {/* Range Picker Container */}
                    <div className="absolute top-full left-0 mt-2 z-20">
                      <DateRangePicker
                        value={dateRange}
                        onValueChange={handleRangeChange}
                        placeholder="Select date range"
                        className="w-auto"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Tags in header - display existing tags */}
            {note && note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-md">
                {note.tags.map((tag, index) => {
                  // Define color palette with sync button styling structure
                  const tagColors = [
                    { bg: '#FB3748', hover: '#e12d3f' }, // Red
                    { bg: '#1FC16B', hover: '#1ba85c' }, // Green
                    { bg: '#F6B51E', hover: '#e0a31b' }, // Orange/Yellow
                    { bg: '#7D52F4', hover: '#6b45e0' }, // Purple
                    { bg: '#FB4BA3', hover: '#e73d92' }, // Pink
                    { bg: '#3559E9', hover: '#2947d1' }  // Original blue
                  ]
                  
                  // Calculate color index based on tag content for consistency
                  const colorIndex = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % tagColors.length
                  const selectedColor = tagColors[colorIndex]
                  
                  return (
                    <span
                      key={index}
                      className="relative inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white border-none shadow-sm overflow-hidden group transition-colors before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                      style={{
                        backgroundColor: selectedColor.bg,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = selectedColor.hover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selectedColor.bg
                      }}
                    >
                      <span className="relative z-10">{tag}</span>
                      <button
                        onClick={() => {
                          if (note) {
                            const updatedTags = note.tags.filter((_, i) => i !== index)
                            onUpdateNote?.(note.id, note.content, note.title, note.color, updatedTags)
                            console.log('Removing tag:', tag, 'from note:', note.id)
                          }
                        }}
                        className="ml-1 w-3 h-3 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100 relative z-10"
                        title="Remove tag"
                      >
                        <span className="text-xs leading-none text-white">×</span>
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Add tag button */}
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setShowTagInput(!showTagInput)}
              className="text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white px-2 py-1 h-7 text-xs border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-md"
              disabled={!note}
            >
              <Hash className="w-3 h-3 mr-1" />
              Tag
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-[#CCCCCC] hover:text-gray-800 dark:hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#171717] border-gray-200 dark:border-[#404040]">
                {templates && templates.length > 0 && (
                  <DropdownMenuItem onClick={() => setShowTemplatePicker(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Create from template
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-blue-600 dark:text-blue-400 dark:hover:bg-[#2A2A2A]"
                  onClick={() => {
                    if (note) {
                      // Ensure latest edits are persisted
                      onUpdateNote?.(note.id, content)
                      const active = accountService.getActiveAccount()
                      const sharerName = active?.name || 'Anonymous'
                      const initials = sharerName
                        .split(/\s+/)
                        .map(s => s[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                      const token = encodeNoteToToken({
                        title: note.title,
                        content: content,
                        tags: note.tags,
                        tradingData: (note as any).tradingData || computeTradingDataForShare(note),
                        color: note.color,
                        createdAt: note.createdAt,
                        updatedAt: note.updatedAt,
                        sharedBy: { name: sharerName, initials },
                      })
                      const url = `${window.location.origin}/notes/share/${token}`
                      setShareUrl(url)
                      setShowShareModal(true)
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (note) {
                      // Ensure latest edits are persisted
                      onUpdateNote?.(note.id, content)
                      const active = accountService.getActiveAccount()
                      const sharerName = active?.name || 'Anonymous'
                      const initials = sharerName
                        .split(/\s+/)
                        .map(s => s[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                      const token = encodeNoteToToken({
                        title: note.title,
                        content: content,
                        tags: note.tags,
                        tradingData: (note as any).tradingData || computeTradingDataForShare(note),
                        color: note.color,
                        createdAt: typeof (note as any).createdAt === 'string' ? (note as any).createdAt : new Date((note as any).createdAt).toISOString(),
                        updatedAt: typeof (note as any).updatedAt === 'string' ? (note as any).updatedAt : new Date((note as any).updatedAt).toISOString(),
                        sharedBy: { name: sharerName, initials },
                      })
                      const url = `${window.location.origin}/notes/share/${token}`
                      safeCopyToClipboard(url)
                      console.log('View-only link copied to clipboard!')
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (note) {
                      const printWindow = window.open('', '_blank')
                      printWindow?.document.write(`
                        <html>
                          <head><title>${note.title}</title></head>
                          <body>
                            <h1>${note.title}</h1>
                            <p>Created: ${new Date(note.createdAt).toLocaleString()}</p>
                            <hr/>
                            <div>${content}</div>
                          </body>
                        </html>
                      `)
                      printWindow?.document.close()
                      printWindow?.print()
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (note) {
                      const lexicalData = JSON.stringify({
                        id: note.id,
                        title: note.title,
                        content: content,
                        createdAt: note.createdAt,
                        updatedAt: note.updatedAt,
                        folder: note.folder,
                        tags: note.tags
                      }, null, 2)

                      const blob = new Blob([lexicalData], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${note.title}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Lexical
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    if (note) {
                      onDeleteNote?.(note.id, note.title)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats rendering moved to collapsible under Net P&L */}

        {/* Tag input field - positioned below header when active */}
        {showTagInput && (
          <div className="px-6 pb-3">
            <input
              type="text"
              placeholder="Enter tag name..."
              className="px-3 py-1 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#171717] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 max-w-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const tagName = e.currentTarget.value.trim()
                  if (tagName && note) {
                    const currentTags = note.tags || []
                    if (!currentTags.includes(tagName)) {
                      const updatedTags = [...currentTags, tagName]
                      onUpdateNote?.(note.id, note.content, note.title, note.color, updatedTags)
                      console.log('Adding tag:', tagName, 'to note:', note.id)
                    }
                    e.currentTarget.value = ''
                    setShowTagInput(false)
                  }
                } else if (e.key === 'Escape') {
                  setShowTagInput(false)
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowTagInput(false), 150)
              }}
            />
          </div>
        )}



        {/* Meta and optional Net P&L */}
        {note && (
          <div className="mb-4">
            {!hideNetPnl && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                <button
                  type="button"
                  onClick={() => setStatsOpen((v) => !v)}
                  className="inline-flex items-center gap-2 group cursor-pointer select-none"
                  aria-expanded={statsOpen}
                  title={statsOpen ? 'Hide stats' : 'Show stats'}
                >
                  <span>Net P&L</span>
                  {typeof netPnlValue === 'number' ? (
                    <span className={(netPnlIsProfit ?? netPnlValue >= 0) ? 'text-[#10B981]' : 'text-red-600 dark:text-red-400'}>
                      {netPnlValue >= 0 ? '+' : ''}${Math.abs(netPnlValue).toLocaleString('en-US')}
                    </span>
                  ) : (note as any)?.tradingData ? (
                    <span className={(note as any)?.tradingData.isProfit ? 'text-[#10B981]' : 'text-red-600 dark:text-red-400'}>
                      {(note as any)?.tradingData.netPnl >= 0 ? '+' : ''}${(note as any)?.tradingData.netPnl}
                    </span>
                  ) : null}
                  <svg
                    className={`w-4 h-4 transition-transform ${statsOpen ? 'rotate-180' : 'rotate-0'} text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200`}
                    viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </h2>
            )}
            <div className="text-sm text-gray-500 dark:text-[#888888] space-x-4">
              <span>Created: {formatDate(note.createdAt)}</span>
              <span>Last updated: {formatDate(note.updatedAt)}</span>
            </div>
          </div>
        )}

        {/* Collapsible Stats + Table (headerStats) */}
        {headerStats && statsOpen && (
          <div className="mb-4">
            {headerStats}
          </div>
        )}

        {/* Stats toggle removed for strategy notebook usage */}

        {/* Trading Statistics removed */}
        {false && (
          <div className="mb-4 p-4">
          <div className="flex items-start space-x-8">
            {/* Chart Section */}
            <div className="flex-shrink-0 w-64">
              {/* P&L Chart with Dashboard Styling */}
              <div className="h-40 bg-white dark:bg-[#171717] rounded-lg overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(note as any)?.tradingData ? (note as any).tradingData.chartData : [
                      { time: '9:30', value: 0 },
                      { time: '10:00', value: -50 },
                      { time: '10:30', value: -120 },
                      { time: '11:00', value: -180 },
                      { time: '11:30', value: -250 },
                      { time: '12:00', value: -320 },
                      { time: '12:30', value: -380 },
                      { time: '13:00', value: -420 },
                      { time: '13:30', value: -480 },
                      { time: '14:00', value: -520 },
                      { time: '14:30', value: -580 },
                      { time: '15:00', value: -620 },
                      { time: '15:30', value: -650 },
                      { time: '16:00', value: -680 }
                    ]}
                    margin={{ top: 5, right: 15, left: 0, bottom: 25 }}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ee7b7" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#86efac" stopOpacity={0.6}/>
                      </linearGradient>
                      <linearGradient id="negativeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fca5a5" stopOpacity={0.6}/>
                        <stop offset="100%" stopColor="#f87171" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      height={25}
                      tickMargin={5}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickFormatter={(value) => {
                        if (value === 0) return '$0';
                        return `$${(value/100).toFixed(0)}`;
                      }}
                      domain={[
                        (dataMin) => Math.floor(Math.min(0, dataMin) * 1.1),
                        (dataMax) => Math.ceil(Math.max(0, dataMax) * 1.2)
                      ]}
                      padding={{ top: 5, bottom: 5 }}
                      width={40}
                    />
                    <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={1} />
                    
                    {/* Green area for positive parts */}
                    <Area
                      type="monotone"
                      dataKey={(data) => data.value >= 0 ? data.value : 0}
                      stroke="none"
                      fill="url(#areaGradient)"
                      fillOpacity={0.7}
                      isAnimationActive={false}
                      baseValue={0}
                      activeDot={false}
                      connectNulls={true}
                    />
                    
                    {/* Red area for negative parts */}
                    <Area
                      type="monotone"
                      dataKey={(data) => data.value < 0 ? data.value : 0}
                      stroke="none"
                      fill="url(#negativeAreaGradient)"
                      fillOpacity={0.7}
                      isAnimationActive={false}
                      baseValue={0}
                      activeDot={false}
                      connectNulls={true}
                    />
                    
                    {/* Main stroke line */}
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#335CFF"
                      strokeWidth={2}
                      fill="transparent"
                      isAnimationActive={false}
                      dot={false}
                      connectNulls={true}
                      activeDot={{
                        r: 4,
                        fill: "#335CFF",
                        stroke: "#fff",
                        strokeWidth: 2
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                {/* First Row */}
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Trades</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.totalTrades : 40}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winners</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.winners : 15}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross P&L</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(note as any)?.tradingData ? (note as any).tradingData.stats.grossPnl : 101.97}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commissions</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${(note as any)?.tradingData ? (note as any).tradingData.stats.commissions : 552.94}
                  </div>
                </div>

                {/* Second Row */}
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Winrate</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.winrate : '37.50%'}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Losers</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.losers : 25}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Volume</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.volume : 5747}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Profit Factor</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(note as any)?.tradingData ? (note as any).tradingData.stats.profitFactor : 0.89}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Simple Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#171717]">
        <div className="flex items-center space-x-4">
          {/* Simple Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('undo')}
            title="Undo"
            disabled={!note}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('redo')}
            title="Redo"
            disabled={!note}
          >
            <Redo className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Font Family Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717] dark:text-white min-w-[100px] justify-between"
                disabled={!note}
              >
                {fontFamily}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px] bg-white dark:bg-[#171717] border-gray-200 dark:border-[#404040]">
              {[
                'Inter',
                'SF Pro',
                'Arial',
                'Times New Roman',
                'Helvetica',
                'Georgia',
                'Verdana',
                'Courier New'
              ].map((font) => (
                <DropdownMenuItem
                  key={font}
                  onClick={() => {
                    setFontFamily(font)
                    if (editorRef.current) {
                      // Map font names to their CSS font-family values
                      const fontFamilyMap: { [key: string]: string } = {
                        'Inter': 'Inter, sans-serif',
                        'SF Pro': '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        'Arial': 'Arial, sans-serif',
                        'Times New Roman': '"Times New Roman", Times, serif',
                        'Helvetica': 'Helvetica, Arial, sans-serif',
                        'Georgia': 'Georgia, serif',
                        'Verdana': 'Verdana, Geneva, sans-serif',
                        'Courier New': '"Courier New", Courier, monospace'
                      }

                      editorRef.current.style.fontFamily = fontFamilyMap[font] || font
                      editorRef.current.focus()
                    }
                  }}
                  className={fontFamily === font ? "bg-blue-50 dark:bg-blue-900/50 dark:text-white" : "dark:text-white"}
                >
                  <span style={{
                    fontFamily: font === 'Inter' ? 'Inter, sans-serif' :
                      font === 'SF Pro' ? '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' :
                        font
                  }}>
                    {font}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717] dark:text-white min-w-[70px] justify-between ml-2"
                disabled={!note}
              >
                {fontSize}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[80px] bg-white dark:bg-[#171717] border-gray-200 dark:border-[#404040]">
              {['10px', '12px', '14px', '15px', '16px', '18px', '20px', '24px', '28px', '32px'].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => {
                    setFontSize(size)
                    if (editorRef.current) {
                      editorRef.current.style.fontSize = size
                      editorRef.current.focus()
                    }
                  }}
                  className={fontSize === size ? "bg-blue-50 dark:bg-blue-900/50 dark:text-white" : "dark:text-white"}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('bold')}
            title="Bold (Ctrl+B)"
            disabled={!note}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('italic')}
            title="Italic (Ctrl+I)"
            disabled={!note}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('underline')}
            title="Underline (Ctrl+U)"
            disabled={!note}
          >
            <Underline className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Links */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={handleLinkInsert}
            title="Insert Link"
            disabled={!note}
          >
            <Link className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Text Alignment */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('justifyLeft')}
            title="Align Left"
            disabled={!note}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('justifyCenter')}
            title="Align Center"
            disabled={!note}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('justifyRight')}
            title="Align Right"
            disabled={!note}
          >
            <AlignRight className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('insertUnorderedList')}
            title="Bullet List"
            disabled={!note}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('insertOrderedList')}
            title="Numbered List"
            disabled={!note}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Media & Special */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={handleImageUpload}
            title="Insert Image"
            disabled={!note}
          >
            <Camera className="w-4 h-4" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
              disabled={!note}
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={(emoji) => {
                console.log('Emoji selected:', emoji)
                insertContent(emoji)
                setShowEmojiPicker(false)
              }}
            />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-[#404040] mx-2" />

          {/* Special Formatting */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => insertContent('<input type="checkbox" style="margin-right: 8px;" /> ')}
            title="Insert Checkbox"
            disabled={!note}
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('formatBlock', 'blockquote')}
            title="Quote"
            disabled={!note}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('formatBlock', 'pre')}
            title="Code Block"
            disabled={!note}
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-white dark:bg-[#171717] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:dark:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        {!note ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a note to start editing</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <div
              ref={editorRef}
              contentEditable={!!note}
              className={cn(
                "min-h-full outline-none leading-relaxed transition-colors",
                "text-gray-900 dark:text-white",
                "focus:ring-0 focus:outline-none",
                "prose prose-gray dark:prose-invert max-w-none",
                "break-words whitespace-pre-wrap",
                // Ensure emoji images display inline properly
                "[&_img[alt]]:inline-block [&_img[alt]]:align-text-bottom [&_img[alt]]:w-5 [&_img[alt]]:h-5 [&_img[alt]]:mx-0.5"
              )}
              style={{
                fontFamily: fontFamily === 'Inter' ? 'Inter, sans-serif' :
                  fontFamily === 'SF Pro' ? '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' :
                    fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' :
                      fontFamily === 'Courier New' ? '"Courier New", Courier, monospace' :
                        fontFamily,
                fontSize: fontSize,
                minHeight: '400px',
                maxHeight: 'none',
                height: 'auto',
                direction: 'ltr',
                textAlign: 'left',
                writingMode: 'horizontal-tb',
                unicodeBidi: 'embed',
                lineHeight: '1.6',
                // Ensure proper Unicode and emoji rendering
                fontFeatureSettings: '"liga" 1, "kern" 1',
                textRendering: 'optimizeLegibility',
                /* inherit font smoothing from global settings */
              }}
              suppressContentEditableWarning={true}
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              onFocus={() => {
                setIsEditing(true)
              }}
              onPaste={handleEditorPaste}
              onBlur={handleEditorBlur}
              onClick={handleEditorClick}
            />
            {note && (!content || content === '<p><br></p>' || content === '<p>Start typing...</p>' || content.trim() === '') && !isEditing && (
              <div className="absolute inset-0 pointer-events-none flex items-start justify-start">
                <p className="text-gray-400 dark:text-gray-500 text-base">Enter some text...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Selector (controlled, rendered outside dropdown) */}
      {templates && templates.length > 0 && (
        <TemplateSelector
          open={showTemplatePicker}
          onOpenChange={setShowTemplatePicker}
          useInlineTrigger={false}
          onTemplateSelect={handleTemplateSelect}
          onQuickApplyTemplate={(t, content) => onQuickApplyTemplate?.(t, content)}
          onCreateBlankNote={() => onCreateNote?.()}
          onDeleteTemplate={onDeleteTemplate}
          templates={templates}
        />
      )}

      {/* Template Editor Dialog */}
      {selectedTemplate && (
        <Dialog open={showTemplateEditor} onClose={handleTemplateEditorCancel}>
          <DialogContent className="max-w-2xl p-0 bg-white dark:bg-[#171717]">
            <SimpleTemplateEditor
              template={selectedTemplate}
              onCancel={handleTemplateEditorCancel}
              onSave={handleTemplateEditorSave}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareModal} onClose={() => setShowShareModal(false)}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#171717]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share note</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Anyone with this link can view this note. Editing is disabled.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[#404040] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (shareUrl) safeCopyToClipboard(shareUrl)
                }}
              >
                Copy
              </Button>
              <Button
                onClick={() => {
                  if (shareUrl) window.open(shareUrl, '_blank')
                }}
              >
                Open
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setShowShareModal(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom status bar removed to let the editor use the full area */}
    </div>
  )
}
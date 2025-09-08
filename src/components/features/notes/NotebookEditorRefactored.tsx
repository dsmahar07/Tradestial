'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Note } from '@/app/notes/page'
import type { TradeJournalingTemplate } from '@/lib/templates'
import type { TemplateInstance } from '@/types/templates'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

// Hooks
import { useToast } from '@/components/ui/notification-toast'

// Components
import { EditorHeader } from './editor/EditorHeader'
import { EditorContent } from '@tiptap/react'
import { TiptapToolbar } from './editor/TiptapToolbar'
import { ShareModal } from './editor/ShareModal'
import { SimpleTemplateEditor } from './SimpleTemplateEditor'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { Button } from '@/components/ui/button'
import { Edit3, Calendar, ChevronDown } from 'lucide-react'
import JournalHeaderStats from '@/components/ui/journal-header-stats'
import JournalTradesTable from '@/components/ui/journal-trades-table'

// Utilities
import { cn } from '@/lib/utils'
import { safeCopyToClipboard } from '@/utils/editor/clipboard-utils'
import { encodeNoteToToken } from '@/lib/note-share'
import { DataStore } from '@/services/data-store.service'

const lowlight = createLowlight(common)

interface NotebookEditorProps {
  note: Note | null
  onUpdateNote?: (id: string, content: string, title?: string, color?: string, tags?: string[], sharing?: { isShared: boolean; shareToken?: string; isAnonymous: boolean; sharedAt?: string }) => void
  onDeleteNote?: (id: string, noteTitle: string) => void
  useDatePicker?: boolean
  onDateChange?: (selectedDate: Date) => void
  useRangePicker?: boolean
  onRangeChange?: (startDate: Date, endDate: Date) => void
  rangeFrom?: Date
  rangeTo?: Date
  hideNetPnl?: boolean
  headerStats?: React.ReactNode
  netPnlValue?: number
  netPnlIsProfit?: boolean
  onCreateNote?: () => void
  onCreateNoteFromTemplate?: (template: TradeJournalingTemplate, templateInstance: TemplateInstance, generatedContent: string) => void
  onQuickApplyTemplate?: (template: TradeJournalingTemplate, content: string) => void
  onDeleteTemplate?: (template: TradeJournalingTemplate) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  templates?: TradeJournalingTemplate[]
}

export function NotebookEditorRefactored({ 
  note, 
  onUpdateNote, 
  onDeleteNote, 
  useDatePicker = false, 
  onDateChange, 
  useRangePicker = false, 
  onRangeChange, 
  rangeFrom, 
  rangeTo, 
  hideNetPnl = false, 
  headerStats, 
  netPnlValue, 
  netPnlIsProfit, 
  onCreateNote, 
  onCreateNoteFromTemplate, 
  onQuickApplyTemplate, 
  onDeleteTemplate, 
  templates, 
  isFullscreen, 
  onToggleFullscreen 
}: NotebookEditorProps) {
  const { success, error, info } = useToast()
  
  // Use the extracted state hook
  const {
    isEditingTitle,
    setIsEditingTitle,
    tempTitle,
    setTempTitle,
    content,
    setContent,
    isEditing,
    setIsEditing,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lastSaved,
    setLastSaved,
    editorRef,
    isSettingUpEdit,
    previousNoteId,
    showEmojiPicker,
    setShowEmojiPicker,
    showDatePicker,
    setShowDatePicker,
    showRangePicker,
    setShowRangePicker,
    showImagePicker,
    setShowImagePicker,
    imagePickerPosition,
    setImagePickerPosition,
    imageSearchQuery,
    setImageSearchQuery,
    mentionStartPos,
    setMentionStartPos,
    showShareModal,
    setShowShareModal,
    shareUrl,
    setShareUrl,
    isAnonymousShare,
    setIsAnonymousShare,
    showTemplateEditor,
    setShowTemplateEditor,
    showTemplatePicker,
    setShowTemplatePicker,
    calendarDate,
    setCalendarDate,
    dateRange,
    setDateRange,
    resetState
  } = useEditorState(note)

  const [selectedTemplate, setSelectedTemplate] = React.useState<TradeJournalingTemplate | null>(null)
  const [statsOpen, setStatsOpen] = React.useState(false)

  // Use the extracted handlers hook
  const {
    formatText,
    insertContent,
    setHighlight,
    toggleQuote,
    handleLinkInsert,
    handleImageUpload,
    handleEditorInput,
    handleEditorBlur,
    handleEditorClick
  } = useEditorHandlers({
    note,
    content,
    isEditing,
    isSettingUpEdit,
    editorRef,
    setContent,
    setIsEditing,
    onUpdateNote
  })

  // Initialize content immediately when note is available
  useEffect(() => {
    if (note) {
      if (previousNoteId.current !== note.id) {
        const incoming = note.content || ''
        setContent(incoming)
        // Enter edit mode and prepare the contentEditable with current content
        setIsEditing(true)
        isSettingUpEdit.current = true
        previousNoteId.current = note.id
      }
    } else {
      setContent('')
      setIsEditing(true) // keep editor ready
      isSettingUpEdit.current = true
      previousNoteId.current = null
    }
  }, [note])

  // Auto-save functionality with optimized debouncing
  useEffect(() => {
    if (note && !isSettingUpEdit.current && content && content !== note.content && isEditing && content.trim() !== '' && content !== '<p><br></p>') {
      const timeoutId = setTimeout(() => {
        onUpdateNote?.(note.id, content)
        setLastSaved(new Date())
      }, 1000) // Reduced from 2000ms to 1000ms for better responsiveness
      return () => clearTimeout(timeoutId)
    }
  }, [content, note?.id, isEditing]) // Removed onUpdateNote and note from deps to prevent unnecessary re-runs

  // Setup editor content when entering edit mode
  useLayoutEffect(() => {
    if (isEditing && isSettingUpEdit.current && editorRef.current) {
      const currentContent = content || note?.content || ''
      editorRef.current.innerHTML = sanitizeHtml(convertMarkdownToHTML(currentContent))
      // Focus the editor so blur doesn't immediately toggle preview
      editorRef.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
      isSettingUpEdit.current = false
    }
  }, [isEditing, content, note?.content])

  // Title handlers
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

  // Date handlers
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

  const handleRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (range.from && range.to && onRangeChange) {
      onRangeChange(range.from, range.to)
      setDateRange(range)
      setShowRangePicker(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCalendarDate(newDate)
  }

  const getMonthYearDisplay = () => {
    return calendarDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({
        date: prevDate.getDate(),
        fullDate: prevDate,
        isCurrentMonth: false
      })
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day)
      days.push({
        date: day,
        fullDate,
        isCurrentMonth: true
      })
    }
    
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

  // Share functionality
  const handleShare = async () => {
    if (!note) return
    
    try {
      const tradingData = computeTradingDataForShare(note)
      const shareToken = await encodeNoteToToken({
        ...note,
        tradingData,
        sharing: {
          isShared: true,
          shareToken: '',
          isAnonymous: isAnonymousShare,
          sharedAt: new Date().toISOString()
        }
      })
      
      const url = `${window.location.origin}/shared/${shareToken}`
      setShareUrl(url)
      setShowShareModal(true)
      
      if (onUpdateNote) {
        onUpdateNote(note.id, note.content, note.title, note.color, note.tags, {
          isShared: true,
          shareToken,
          isAnonymous: isAnonymousShare,
          sharedAt: new Date().toISOString()
        })
      }
    } catch (err) {
      error('Share Failed', 'Unable to generate share link', 5000)
    }
  }

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
  }, [useRangePicker, dateRange, rangeFrom, rangeTo])

  const handleCopyShareLink = async () => {
    const copied = await safeCopyToClipboard(shareUrl)
    if (copied) {
      success('Link Copied', 'Share link copied to clipboard', 3000)
    } else {
      error('Copy Failed', 'Unable to copy link to clipboard', 3000)
    }
  }

  const handleDownload = () => {
    if (!note) return
    
    const element = document.createElement('a')
    const file = new Blob([`# ${note.title}\n\n${note.content}`], { type: 'text/markdown' })
    element.href = URL.createObjectURL(file)
    element.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleDelete = () => {
    if (note && onDeleteNote) {
      onDeleteNote(note.id, note.title)
    }
  }

  // Template handlers
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

  // Image mention handlers
  const handleImageSelect = useCallback((image: MediaItem) => {
    if (!editorRef.current || !note) return
    
    // Implementation for image mention insertion
    // ... (similar to original but simplified)
    
    setShowImagePicker(false)
    setImageSearchQuery('')
    setMentionStartPos(null)
  }, [note])

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@' && !showImagePicker) {
      e.preventDefault()
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setImagePickerPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX
        })
        setMentionStartPos(range.startOffset)
        setShowImagePicker(true)
        setImageSearchQuery('')
      }
      return
    }

    if (e.key === 'Escape' && showImagePicker) {
      setShowImagePicker(false)
      setImageSearchQuery('')
      setMentionStartPos(null)
      return
    }

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

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    // Handled by EditorContent component
  }

  if (!note) {
    return (
      <div className="flex-1 bg-white dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a note to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 min-w-0 bg-white dark:bg-[#0f0f0f] flex flex-col">
      <EditorHeader
        note={note}
        isEditingTitle={isEditingTitle}
        tempTitle={tempTitle}
        showDatePicker={showDatePicker}
        showRangePicker={showRangePicker}
        useDatePicker={useDatePicker}
        useRangePicker={useRangePicker}
        onTitleEdit={handleTitleEdit}
        onTitleSave={handleTitleSave}
        onTitleCancel={handleTitleCancel}
        onTitleChange={setTempTitle}
        onTitleKeyDown={handleTitleKeyDown}
        onShare={handleShare}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onDatePickerToggle={() => setShowDatePicker(!showDatePicker)}
        onRangePickerToggle={() => setShowRangePicker(!showRangePicker)}
      >
        {/* Date Picker */}
        {showDatePicker && useDatePicker && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowDatePicker(false)}
            />
            <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#404040] rounded-lg shadow-xl p-4 min-w-[320px] animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Select Date</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                      {getMonthYearDisplay()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    >
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
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

        {/* Range Picker */}
        {showRangePicker && useRangePicker && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowRangePicker(false)}
            />
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
      </EditorHeader>

      {/* Stats Section */}
      {!hideNetPnl && (
        <div className="px-6 py-2 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1a1a1a]">
          <button
            type="button"
            onClick={() => setStatsOpen((v) => !v)}
            className="inline-flex items-center gap-2 group cursor-pointer select-none"
            aria-expanded={statsOpen}
            title={statsOpen ? 'Hide stats' : 'Show stats'}
          >
            <span>Net P&L</span>
            {typeof netPnlValue === 'number' ? (
              <span
                className={cn(
                  "font-semibold",
                  netPnlIsProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {netPnlIsProfit ? '+' : ''}{netPnlValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            ) : null}
            <svg
              className={`w-4 h-4 transition-transform ${statsOpen ? 'rotate-180' : 'rotate-0'} text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200`}
              viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Collapsible Stats + Table (headerStats) */}
      {headerStats && statsOpen && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1a1a1a]">
          {headerStats}
        </div>
      )}

      {/* Toolbar - always visible */}
      <EditorToolbar
        isEditing={isEditing}
        onFormatText={formatText}
        onImageUpload={handleImageUpload}
        onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
        onLinkInsert={handleLinkInsert}
        onHighlight={setHighlight}
        onQuoteToggle={toggleQuote}
        onFontSizeChange={setFontSize}
        onFontFamilyChange={setFontFamily}
        fontSize={fontSize}
        fontFamily={fontFamily}
      />

      {/* Main Content */}
      <EditorContent
        ref={editorRef}
        content={note?.content || content || ''}
        isEditing={isEditing}
        fontSize={fontSize}
        fontFamily={fontFamily}
        onContentChange={setContent}
        onEditorClick={handleEditorClick}
        onEditorBlur={handleEditorBlur}
        onEditorPaste={handleEditorPaste}
        onEditorKeyDown={handleEditorKeyDown}
        onEditorInput={handleEditorInput}
      />

      {/* Modals and Pickers */}
      {showEmojiPicker && (
        <div className="absolute z-50">
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              insertContent(emoji)
              setShowEmojiPicker(false)
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {showImagePicker && (
        <ImageMentionPicker
          position={imagePickerPosition}
          searchQuery={imageSearchQuery}
          onSearchChange={setImageSearchQuery}
          onSelect={handleImageSelect}
          onClose={() => {
            setShowImagePicker(false)
            setImageSearchQuery('')
            setMentionStartPos(null)
          }}
        />
      )}

      {showTemplateEditor && selectedTemplate && (
        <SimpleTemplateEditor
          template={selectedTemplate}
          onSave={handleTemplateEditorSave}
          onCancel={handleTemplateEditorCancel}
        />
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        isAnonymous={isAnonymousShare}
        onAnonymousChange={setIsAnonymousShare}
        onCopyLink={handleCopyShareLink}
        tradingData={note.tradingData}
      />
    </div>
  )
}

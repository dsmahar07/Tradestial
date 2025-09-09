'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import CharacterCount from '@tiptap/extension-character-count'
import Focus from '@tiptap/extension-focus'
import Gapcursor from '@tiptap/extension-gapcursor'
import HardBreak from '@tiptap/extension-hard-break'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Dropcursor from '@tiptap/extension-dropcursor'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { FloatingMenu } from '@tiptap/extension-floating-menu'
import { common, createLowlight } from 'lowlight'

// Hooks
import { useToast } from '@/components/ui/notification-toast'

// Components
import { EditorHeader } from './editor/EditorHeader'
import { EditorContent } from '@tiptap/react'
import { TiptapToolbar } from './editor/TiptapToolbar'
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

interface NoteEditorProps {
  note: Note | null
  onUpdateNote?: (id: string, content: string, title?: string, color?: string, tags?: string[], sharing?: { isShared: boolean; shareToken?: string; isAnonymous: boolean; sharedAt?: string }) => void
  onDeleteNote?: (id: string, noteTitle: string) => void
  useDatePicker?: boolean
  onDateChange?: (selectedDate: Date) => void
  useRangePicker?: boolean
  onRangeChange?: (startDate: Date, endDate: Date) => void
  rangeFrom?: Date
  rangeTo?: Date
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
  hideTimestamps?: boolean
  hideHeader?: boolean
  hideNetPnlSection?: boolean
}

export function NoteEditorComponent({ 
  note, 
  onUpdateNote, 
  onDeleteNote, 
  useDatePicker = false, 
  onDateChange, 
  useRangePicker = false, 
  onRangeChange, 
  rangeFrom, 
  rangeTo, 
  headerStats, 
  netPnlValue, 
  netPnlIsProfit, 
  onCreateNote, 
  onCreateNoteFromTemplate, 
  onQuickApplyTemplate, 
  onDeleteTemplate, 
  templates, 
  isFullscreen, 
  onToggleFullscreen,
  hideTimestamps = false,
  hideHeader = false,
  hideNetPnlSection = false
}: NoteEditorProps) {
  const { success, error, info } = useToast()
  
  // State management
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TradeJournalingTemplate | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const previousNoteId = useRef<string | null>(null)

  // Initialize TipTap editor
  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration issues
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        codeBlock: false,
        hardBreak: false, // We'll use the dedicated HardBreak extension
      }),
      // Text styling and formatting
      Highlight.configure({ multicolor: true }),
      Typography,
      Underline,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Subscript,
      Superscript,
      
      // Editor behavior enhancements
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Gapcursor,
      Dropcursor,
      HardBreak,
      
      // Content elements
      HorizontalRule,
      Placeholder.configure({
        placeholder: 'Start typing...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg shadow-md max-w-full h-auto',
        },
      }),
      
      // Tables
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      
      // Lists
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      
      // Text alignment
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      
      // Code blocks
      CodeBlockLowlight.configure({
        lowlight,
      }),
      
      // Character count
      CharacterCount.configure({
        limit: 10000,
      }),
    ],
    content: note?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (note && html !== note.content) {
        handleContentUpdate(html)
      }
    },
  })

  // Update editor content when note changes
  useEffect(() => {
    if (note && editor) {
      if (previousNoteId.current !== note.id) {
        editor.commands.setContent(note.content || '')
        previousNoteId.current = note.id
      }
    }
  }, [note, editor])

  // Auto-save functionality
  const handleContentUpdate = useCallback((content: string) => {
    if (note && content && content !== note.content && content.trim() !== '' && content !== '<p></p>') {
      const timeoutId = setTimeout(() => {
        onUpdateNote?.(note.id, content)
        setLastSaved(new Date())
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [note, onUpdateNote])

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

  const handleTagsUpdate = useCallback((tags: string[]) => {
    if (note && onUpdateNote) {
      // Immediately update the note with new tags to ensure real-time visibility
      onUpdateNote(note.id, note.content, note.title, note.color, tags)
      setLastSaved(new Date())
    }
  }, [note, onUpdateNote])

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

  // Calendar helpers
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

  if (!note) {
    return (
      <div className="h-full bg-white dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a note to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-[#0f0f0f] flex flex-col overflow-hidden">
      {!hideHeader && (
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
        onDownload={handleDownload}
        onDelete={handleDelete}
        onDatePickerToggle={() => setShowDatePicker(!showDatePicker)}
        onRangePickerToggle={() => setShowRangePicker(!showRangePicker)}
        onTagsUpdate={handleTagsUpdate}
        hideTimestamps={hideTimestamps}
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
      )}

      {/* Stats Section */}
      {!hideNetPnlSection && (
        <div className="px-6 py-2 bg-white dark:bg-[#1a1a1a]">
          <button
            type="button"
            onClick={() => setStatsOpen((v) => !v)}
            className="inline-flex items-center gap-2 group cursor-pointer select-none"
            aria-expanded={statsOpen}
            title={statsOpen ? 'Hide stats' : 'Show stats'}
          >
            <span className={cn(
              "font-bold",
              typeof netPnlValue === 'number' 
                ? (netPnlIsProfit ? "text-[#10B981]" : "text-red-600 dark:text-red-400")
                : "text-gray-900 dark:text-white"
            )}>Net P&L</span>
            {typeof netPnlValue === 'number' ? (
              <span
                className={cn(
                  "font-semibold",
                  netPnlIsProfit ? "text-[#10B981]" : "text-red-600 dark:text-red-400"
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
        <div className="px-6 py-4 bg-white dark:bg-[#1a1a1a]">
          {headerStats}
        </div>
      )}

      {/* TipTap Toolbar */}
      <TiptapToolbar editor={editor} />

      {/* TipTap Editor Content */}
      <div className="flex-1 relative overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
        
        {/* Character Count Display */}
        {editor && (
          <div className="fixed bottom-4 right-6 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border z-10">
            {editor.storage.characterCount.characters()}/{editor.extensionManager.extensions.find(ext => ext.name === 'characterCount')?.options.limit || 10000} characters
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && selectedTemplate && (
        <SimpleTemplateEditor
          template={selectedTemplate}
          onSave={handleTemplateEditorSave}
          onCancel={handleTemplateEditorCancel}
        />
      )}

    </div>
  )
}

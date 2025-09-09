'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Download,
  MoreHorizontal,
  Edit3,
  Copy,
  FileText,
  Trash2,
  Save,
  MoreVertical,
  FileDown,
  Calendar,
  ChevronDown,
  X,
  Plus,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as FancyButton from '@/components/ui/fancy-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Note } from '@/app/notes/page'

interface EditorHeaderProps {
  note: Note
  isEditingTitle: boolean
  tempTitle: string
  showDatePicker: boolean
  showRangePicker: boolean
  useDatePicker: boolean
  useRangePicker: boolean
  onTitleEdit: () => void
  onTitleSave: () => void
  onTitleCancel: () => void
  onTitleChange: (value: string) => void
  onTitleKeyDown: (e: React.KeyboardEvent) => void
  onDownload: () => void
  onDelete: () => void
  onDatePickerToggle: () => void
  onRangePickerToggle: () => void
  onTagsUpdate?: (tags: string[]) => void
  children?: React.ReactNode // For date/range picker components
  hideTimestamps?: boolean // Hide created/updated timestamps
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  note,
  isEditingTitle,
  tempTitle,
  showDatePicker,
  showRangePicker,
  useDatePicker,
  useRangePicker,
  onTitleEdit,
  onTitleSave,
  onTitleCancel,
  onTitleChange,
  onTitleKeyDown,
  onDownload,
  onDelete,
  onDatePickerToggle,
  onRangePickerToggle,
  onTagsUpdate,
  children,
  hideTimestamps = false
}) => {
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState<string[]>(note.tags || [])

  // Formatter for Created/Updated timestamps (e.g., "Aug 31, 2025 12:14PM")
  const formatDateTime = useCallback((iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const str = d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    // Remove the space before AM/PM to match desired style
    return str.replace(' AM', 'AM').replace(' PM', 'PM')
  }, [])

  // Keep local tags in sync with the selected note
  useEffect(() => {
    setTags(note.tags || [])
  }, [note.id, note.tags])

  const addTag = (tagName: string) => {
    const t = tagName.trim()
    if (!t || tags.includes(t)) return
    const updatedTags = [...tags, t]
    setTags(updatedTags) // optimistic UI update
    onTagsUpdate?.(updatedTags)
  }

  const removeTag = (tagName: string) => {
    const updatedTags = tags.filter(tag => tag !== tagName)
    setTags(updatedTags) // optimistic UI update
    onTagsUpdate?.(updatedTags)
  }

  const handleSubmit = () => {
    if (newTag.trim()) {
      addTag(newTag.trim())
    }
    setNewTag('')
    setIsAddingTag(false)
  }

  const handleCancel = () => {
    setNewTag('')
    setIsAddingTag(false)
  }
  return (
    <div className="px-6 py-4 bg-white dark:bg-[#0f0f0f]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 relative">
          {isEditingTitle ? (
            <div className="relative">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={onTitleSave}
                onKeyDown={onTitleKeyDown}
                className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 px-2 py-1 min-w-0 flex-1 rounded"
                autoFocus
              />
              {/* Created/Updated timestamps (visible during edit) */}
              {!hideTimestamps && (
                <div className="px-2 mt-2 text-sm text-gray-500 dark:text-gray-300 select-none font-medium">
                  <span>Created: {formatDateTime(note.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <span>Last updated: {formatDateTime(note.updatedAt)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <h1 
                className={cn(
                  "text-xl font-semibold text-gray-900 dark:text-white cursor-pointer px-2 py-1 rounded flex items-center space-x-2 select-none transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]",
                  useDatePicker || useRangePicker
                    ? "hover:bg-gray-50/80 dark:hover:bg-gray-800/60 hover:shadow-sm"
                    : "hover:bg-gray-50/80 dark:hover:bg-gray-800/60 hover:shadow-sm"
                )}
                onClick={onTitleEdit}
                title={
                  useDatePicker 
                    ? "Click to select date" 
                    : useRangePicker
                    ? "Click to select date range"
                    : "Click to edit title"
                }
              >
                <span>{note.title}</span>
              </h1>

              {/* Created/Updated timestamps */}
              {!hideTimestamps && (
                <div className="px-2 mt-2 text-sm text-gray-500 dark:text-gray-300 select-none font-medium">
                  <span>Created: {formatDateTime(note.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <span>Last updated: {formatDateTime(note.updatedAt)}</span>
                </div>
              )}
              
              {/* Date/Range Picker Insertion Point */}
              {children}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Existing Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {tags.map((tag, index) => {
                // Same color palette as sidebar tags
                const tagColors = [
                  { bg: '#FB3748', hover: '#e12d3f' }, // Red
                  { bg: '#1FC16B', hover: '#1ba85c' }, // Green
                  { bg: '#F6B51E', hover: '#e0a31b' }, // Orange/Yellow
                  { bg: '#7D52F4', hover: '#6b45e0' }, // Purple
                  { bg: '#FB4BA3', hover: '#e73d92' }, // Pink
                  { bg: '#3559E9', hover: '#2947d1' }  // Blue
                ]
                const colorIndex = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % tagColors.length
                const selectedColor = tagColors[colorIndex]

                return (
                  <div
                    key={`${tag}-${index}`}
                    className="relative inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white border-none shadow-sm overflow-hidden group transition-colors before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-white/5 before:pointer-events-none"
                    style={{ backgroundColor: selectedColor.bg }}
                  >
                    <span className="relative z-10">{tag}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removeTag(tag)
                      }}
                      className="relative z-10 ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add Tag Button or Input */}
          {isAddingTag ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit()
                  } else if (e.key === 'Escape') {
                    handleCancel()
                  }
                }}
                placeholder="Tag name"
                className="px-2 py-1 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 w-24"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                className="px-1 py-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                title="Add"
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="px-1 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="inline-flex items-center px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              title="Add tag"
            >
              <Tag className="w-3 h-3 mr-1" />
              Add tag
            </button>
          )}

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onDownload}>
                <FileDown className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  const text = `${note.title}\n\n${note.content}`
                  navigator.clipboard.writeText(text)
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Content
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </div>
  )
}

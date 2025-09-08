'use client'

import React from 'react'
import {
  Share2,
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
  X
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
  onShare: () => void
  onDownload: () => void
  onDelete: () => void
  onDatePickerToggle: () => void
  onRangePickerToggle: () => void
  children?: React.ReactNode // For date/range picker components
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
  onShare,
  onDownload,
  onDelete,
  onDatePickerToggle,
  onRangePickerToggle,
  children
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#0f0f0f]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 relative">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onTitleSave}
              onKeyDown={onTitleKeyDown}
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
                    : useRangePicker
                    ? "hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
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
                {(useDatePicker || useRangePicker) && (
                  <Calendar className="h-4 w-4 opacity-50" />
                )}
              </h1>
              
              {/* Date/Range Picker Insertion Point */}
              {children}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="h-8 px-3 gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>

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

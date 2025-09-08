'use client'

import React from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Image,
  Smile,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Hash,
  CheckSquare,
  Undo,
  Redo,
  Palette,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  isEditing: boolean
  onFormatText: (command: string, value?: string) => void
  onImageUpload: () => void
  onEmojiClick: () => void
  onLinkInsert: () => void
  onHighlight: (color: string) => void
  onQuoteToggle: () => void
  onFontSizeChange: (size: string) => void
  onFontFamilyChange: (family: string) => void
  fontSize: string
  fontFamily: string
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isEditing,
  onFormatText,
  onImageUpload,
  onEmojiClick,
  onLinkInsert,
  onHighlight,
  onQuoteToggle,
  onFontSizeChange,
  onFontFamilyChange,
  fontSize,
  fontFamily
}) => {
  if (!isEditing) return null

  return (
    <div 
      className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a]"
      role="toolbar"
      data-toolbar="true"
    >
      {/* Undo/Redo */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('undo')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('redo')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Formatting */}
      <div className="flex items-center gap-1 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('bold')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('italic')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('underline')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('strikeThrough')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      {/* Highlight Color */}
      <div className="flex items-center px-2 border-l border-gray-300 dark:border-gray-600">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              data-toolbar-button="true"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onHighlight('yellow')}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-300 rounded" />
                Yellow
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHighlight('lime')}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-lime-300 rounded" />
                Green
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHighlight('cyan')}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-300 rounded" />
                Blue
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHighlight('pink')}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-300 rounded" />
                Pink
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lists and Quotes */}
      <div className="flex items-center gap-1 px-2 border-l border-gray-300 dark:border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('insertUnorderedList')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('insertOrderedList')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onQuoteToggle}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 px-2 border-l border-gray-300 dark:border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('justifyLeft')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('justifyCenter')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormatText('justifyRight')}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Insert Items */}
      <div className="flex items-center gap-1 px-2 border-l border-gray-300 dark:border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLinkInsert}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onImageUpload}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEmojiClick}
          className="h-8 w-8 p-0"
          data-toolbar-button="true"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </div>

      {/* Font Options */}
      <div className="flex items-center gap-2 px-2 border-l border-gray-300 dark:border-gray-600">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              data-toolbar-button="true"
            >
              <Type className="h-4 w-4 mr-1" />
              {fontFamily}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onFontFamilyChange('Inter')}>Inter</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontFamilyChange('Georgia')}>Georgia</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontFamilyChange('Courier New')}>Courier New</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontFamilyChange('Comic Sans MS')}>Comic Sans</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              data-toolbar-button="true"
            >
              {fontSize}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onFontSizeChange('12px')}>12px</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontSizeChange('14px')}>14px</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontSizeChange('15px')}>15px</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontSizeChange('16px')}>16px</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontSizeChange('18px')}>18px</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontSizeChange('20px')}>20px</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

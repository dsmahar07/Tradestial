'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Underline, Link as LinkIcon, List, ListOrdered, Undo, Redo, Heading1, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TradeNoteEditorProps {
  tradeId: string
  symbol: string
}

export function TradeNoteEditor({ tradeId, symbol }: TradeNoteEditorProps) {
  const [, setContent] = useState<string>('')
  const editorRef = useRef<HTMLDivElement>(null)

  // Load existing content
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(`trade-note:${tradeId}`)
    if (saved && editorRef.current) {
      editorRef.current.innerHTML = saved
      setContent(saved)
    }
  }, [tradeId])

  const handleEditorChange = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    setContent(html)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`trade-note:${tradeId}`, html)
    }
  }

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleEditorChange()
  }

  const insertLink = () => {
    const url = typeof window !== 'undefined' ? window.prompt('Enter URL') : undefined
    if (url) exec('createLink', url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Trade notes</h3>
          <p className="text-sm text-gray-500">{symbol}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Bold" onClick={() => exec('bold')}><Bold className="w-4 h-4"/></button>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Italic" onClick={() => exec('italic')}><Italic className="w-4 h-4"/></button>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Underline" onClick={() => exec('underline')}><Underline className="w-4 h-4"/></button>
        <span className="mx-1 w-px h-5 bg-gray-200 dark:bg-gray-700"/>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Bulleted list" onClick={() => exec('insertUnorderedList')}><List className="w-4 h-4"/></button>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered className="w-4 h-4"/></button>
        <span className="mx-1 w-px h-5 bg-gray-200 dark:bg-gray-700"/>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="H1" onClick={() => exec('formatBlock', 'h1')}><Heading1 className="w-4 h-4"/></button>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="H2" onClick={() => exec('formatBlock', 'h2')}><Heading2 className="w-4 h-4"/></button>
        <span className="mx-1 w-px h-5 bg-gray-200 dark:bg-gray-700"/>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Link" onClick={insertLink}><LinkIcon className="w-4 h-4"/></button>
        <span className="mx-1 w-px h-5 bg-gray-200 dark:bg-gray-700"/>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Undo" onClick={() => exec('undo')}><Undo className="w-4 h-4"/></button>
        <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Redo" onClick={() => exec('redo')}><Redo className="w-4 h-4"/></button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleEditorChange}
        className={cn(
          'flex-1 min-h-0 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#171717] p-4',
          'text-gray-900 dark:text-gray-100',
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'prose-a:text-blue-600 dark:prose-a:text-blue-400'
        )}
        style={{ lineHeight: 1.6 }}
      />
    </div>
  )
}

export default TradeNoteEditor



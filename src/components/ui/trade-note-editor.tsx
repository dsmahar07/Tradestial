'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Bold, Italic, Underline, Link as LinkIcon, List, ListOrdered, Undo, Redo, Heading1, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TradeNoteEditorProps {
  tradeId: string
  symbol: string
}

export function TradeNoteEditor({ tradeId, symbol }: TradeNoteEditorProps) {
  const [, setContent] = useState<string>('')
  const editorRef = useRef<HTMLDivElement>(null)

  // Minimal sanitizer: strip scripts/styles, on* attrs, and unsafe href/src
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
        Array.from(el.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase()
          const val = (attr.value || '').trim()
          if (name.startsWith('on')) el.removeAttribute(attr.name)
          if ((name === 'href' || name === 'src') && val) {
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

  // Load existing content
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(`trade-note:${tradeId}`)
    if (saved && editorRef.current) {
      const safe = sanitizeHtml(saved)
      editorRef.current.innerHTML = safe
      setContent(safe)
    }
  }, [tradeId, sanitizeHtml])

  const handleEditorChange = () => {
    if (!editorRef.current) return
    const safe = sanitizeHtml(editorRef.current.innerHTML)
    if (editorRef.current.innerHTML !== safe) {
      editorRef.current.innerHTML = safe
    }
    setContent(safe)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`trade-note:${tradeId}`, safe)
    }
  }

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleEditorChange()
  }

  const insertLink = () => {
    const url = typeof window !== 'undefined' ? window.prompt('Enter URL') : undefined
    if (url) {
      const u = url.trim()
      const lower = u.toLowerCase()
      if (lower.startsWith('http://') || lower.startsWith('https://')) {
        exec('createLink', u)
      }
    }
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



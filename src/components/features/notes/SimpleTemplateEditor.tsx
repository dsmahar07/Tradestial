'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TradeJournalingTemplate } from '@/types/templates'
import { 
  Save, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Hash
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimpleTemplateEditorProps {
  template: TradeJournalingTemplate
  onSave: (content: string) => void
  onCancel?: () => void
}

// Generate initial template content based on template fields
const generateInitialContent = (template: TradeJournalingTemplate): string => {
  const sections = template.fields.map(field => {
    switch (field.type) {
      case 'date':
        return `<h3>${field.label}</h3><p>📅 ${new Date().toLocaleDateString('en-US')}</p>`
      case 'currency':
        return `<h3>${field.label}</h3><p>💰 $0.00</p>`
      case 'number':
        return `<h3>${field.label}</h3><p>📊 0</p>`
      case 'select':
        const options = field.options ? ` (${field.options.slice(0, 2).join(', ')}, ...)` : ''
        return `<h3>${field.label}</h3><p>📋 Select option${options}</p>`
      case 'textarea':
        return `<h3>${field.label}</h3><p><em>Enter your thoughts here...</em></p>`
      default:
        return `<h3>${field.label}</h3><p>Enter ${field.label.toLowerCase()}...</p>`
    }
  }).join('<br>')

  return `
    <h1>${template.name}</h1>
    <p><em>${template.description}</em></p>
    <hr>
    ${sections}
    <br>
    <h3>Additional Notes</h3>
    <p>Add any additional observations or insights here...</p>
  `
}

export function SimpleTemplateEditor({ template, onSave, onCancel }: SimpleTemplateEditorProps) {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Lightweight HTML sanitizer to remove scripts, event handlers, and unsafe URLs
  const sanitizeHtml = useCallback((dirty: string): string => {
    if (!dirty) return ''
    try {
      const doc = new DOMParser().parseFromString(dirty, 'text/html')
      const all = doc.body.querySelectorAll('*')
      all.forEach((el) => {
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

  useEffect(() => {
    const initialContent = generateInitialContent(template)
    const safe = sanitizeHtml(initialContent)
    setContent(safe)
    if (editorRef.current) {
      editorRef.current.innerHTML = safe
    }
  }, [template, sanitizeHtml])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const editorContent = editorRef.current?.innerHTML || content
      onSave(sanitizeHtml(editorContent || ''))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditorChange = () => {
    if (editorRef.current) {
      const safe = sanitizeHtml(editorRef.current.innerHTML)
      if (editorRef.current.innerHTML !== safe) {
        editorRef.current.innerHTML = safe
      }
      setContent(safe)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleEditorChange()
  }

  const formatHeading = (level: number) => {
    execCommand('formatBlock', `h${level}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: template.color + '20', color: template.color }}
            >
              {template.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Template: {template.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize your template content with the rich text editor
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="text-gray-600 dark:text-gray-400"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-1 flex-wrap gap-2">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('bold')}
              className="p-2 h-8 w-8"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('italic')}
              className="p-2 h-8 w-8"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('underline')}
              className="p-2 h-8 w-8"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatHeading(1)}
              className="px-2 h-8 text-xs font-bold"
              title="Heading 1"
            >
              H1
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatHeading(2)}
              className="px-2 h-8 text-xs font-bold"
              title="Heading 2"
            >
              H2
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => formatHeading(3)}
              className="px-2 h-8 text-xs font-bold"
              title="Heading 3"
            >
              H3
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('justifyLeft')}
              className="p-2 h-8 w-8"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('justifyCenter')}
              className="p-2 h-8 w-8"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('justifyRight')}
              className="p-2 h-8 w-8"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('insertUnorderedList')}
              className="p-2 h-8 w-8"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => execCommand('insertOrderedList')}
              className="p-2 h-8 w-8"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="p-6">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorChange}
          className={cn(
            "min-h-[400px] max-h-[600px] overflow-y-auto",
            "p-4 border border-gray-200 dark:border-gray-700 rounded-lg",
            "bg-white dark:bg-gray-900",
            "text-gray-900 dark:text-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "prose prose-sm dark:prose-invert max-w-none",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:dark:text-white",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-white",
            "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white",
            "[&_p]:mb-3 [&_p]:text-gray-700 [&_p]:dark:text-gray-300",
            "[&_ul]:mb-3 [&_ol]:mb-3",
            "[&_hr]:my-6 [&_hr]:border-gray-300 [&_hr]:dark:border-gray-600"
          )}
          style={{ lineHeight: '1.6' }}
        />
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>💡 <strong>Tip:</strong> This template will be saved and can be used to create new notes with pre-filled content. 
          Use headings, formatting, and structure to create a template that works best for your trading journal needs.</p>
        </div>
      </div>
    </motion.div>
  )
}
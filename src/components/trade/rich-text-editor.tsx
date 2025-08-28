'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { placeholders } from '@/config/validation-messages'
import {
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
  CheckSquare,
  Smile,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  placeholder?: string
  value?: string
  onChange?: (content: string) => void
}

export function RichTextEditor({ placeholder = placeholders.text.notes, value = '', onChange }: RichTextEditorProps) {
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [fontSize, setFontSize] = useState('15px')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Load content when value changes
  useEffect(() => {
    const noteContent = value || ''
    setContent(noteContent)
    setIsEditing(false)
  }, [value])

  // Manage editor innerHTML directly to prevent content loss
  useEffect(() => {
    if (editorRef.current && content && !isEditing) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content
      }
    } else if (editorRef.current && !content && !isEditing) {
      editorRef.current.innerHTML = ''
    }
  }, [content, isEditing])

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (content && content !== value && isEditing && content.trim() !== '' && content !== '<p><br></p>') {
      const timeoutId = setTimeout(() => {
        onChange?.(content)
      }, 2000)

      return () => clearTimeout(timeoutId)
    }
  }, [content, value, onChange, isEditing])

  const handleEditorClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      if (editorRef.current) {
        if (!content || content.trim() === '') {
          editorRef.current.innerHTML = ''
        }
        editorRef.current.focus()
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
    try {
      const target = e.currentTarget
      if (target) {
        let newContent = target.innerHTML || ''
        newContent = newContent.replace(/[\u200B-\u200D\uFEFF]/g, '')
        
        if (newContent !== content && isEditing) {
          setContent(newContent)
        }
      }
    } catch (error) {
      console.error('Error in handleEditorInput:', error)
    }
  }, [content, isEditing])

  const handleEditorBlur = useCallback((e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !editorRef.current?.contains(relatedTarget)) {
      setTimeout(() => setIsEditing(false), 100)
    }
  }, [])

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()

    try {
      const htmlPaste = e.clipboardData.getData('text/html')
      const plainPaste = e.clipboardData.getData('text/plain')
      
      const selection = window.getSelection()

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()

        if (htmlPaste) {
          document.execCommand('insertHTML', false, htmlPaste)
        } else if (plainPaste) {
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu
          
          if (emojiRegex.test(plainPaste)) {
            const convertedContent = plainPaste.replace(emojiRegex, (emoji) => {
              return getAppleEmojiHTML(emoji)
            })
            document.execCommand('insertHTML', false, convertedContent)
          } else {
            const textNode = document.createTextNode(plainPaste)
            range.insertNode(textNode)
            range.setStartAfter(textNode)
            range.collapse(true)
            
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }

        setTimeout(() => {
          if (editorRef.current) {
            const newContent = editorRef.current.innerHTML
            setContent(newContent)
            setIsEditing(true)
          }
        }, 0)
      }
    } catch (error) {
      console.error('Error handling paste:', error)
    }
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
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
    if (!editorRef.current) return

    try {
      editorRef.current.focus()

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      document.execCommand(command, false, value)

      setTimeout(() => {
        if (editorRef.current) {
          const newContent = editorRef.current.innerHTML
          setContent(newContent)
          setIsEditing(true)
        }
      }, 10)

    } catch (error) {
      console.error(`Error executing command ${command}:`, error)
    }
  }, [])

  const getAppleEmojiHTML = useCallback((emoji: string) => {
    const getEmojiCodepoints = (emoji: string): string[] => {
      const codepoints = []
      for (let i = 0; i < emoji.length; ) {
        const codepoint = emoji.codePointAt(i)
        if (codepoint) {
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
    if (codepoints.length === 0) return emoji
    
    const primaryCodepoint = codepoints[0].padStart(4, '0')
    return `<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${primaryCodepoint}.png" alt="${emoji}" class="inline-block w-5 h-5 align-text-bottom" style="display: inline-block; width: 20px; height: 20px; vertical-align: text-bottom; margin: 0 1px;" onerror="this.onerror=null; this.src='https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${primaryCodepoint}.png';" />`
  }, [])

  const insertContent = useCallback((content: string) => {
    if (!editorRef.current) return

    try {
      editorRef.current.focus()
      setIsEditing(true)

      const isEmoji = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/u.test(content.trim())
      
      if (isEmoji && content.length <= 2) {
        const emojiHTML = getAppleEmojiHTML(content)
        document.execCommand('insertHTML', false, emojiHTML)
      } else {
        document.execCommand('insertHTML', false, content)
      }

      setTimeout(() => {
        if (editorRef.current) {
          const newContent = editorRef.current.innerHTML
          setContent(newContent)
        }
      }, 0)

    } catch (error) {
      console.error('Error inserting content:', error)
    }
  }, [getAppleEmojiHTML])

  const handleImageUpload = useCallback(() => {
    if (!editorRef.current) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          const imageHtml = `<div><img src="${imageUrl}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" alt="Uploaded image" /></div><p><br></p>`
          insertContent(imageHtml)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [insertContent])

  const handleLinkInsert = useCallback(() => {
    const url = prompt('Enter URL:')
    if (url) {
      const selection = window.getSelection()
      const selectedText = selection?.toString() || url
      const linkHtml = `<a href="${url}" style="color: #3b82f6; text-decoration: underline;" target="_blank">${selectedText}</a>`
      insertContent(linkHtml)
    }
  }, [insertContent])

  return (
    <div className="flex-1 bg-white dark:bg-[#171717] flex flex-col">
      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#171717]">
        <div className="flex items-center space-x-4">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('undo')}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('redo')}
            title="Redo"
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
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('underline')}
            title="Underline (Ctrl+U)"
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
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('justifyCenter')}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('justifyRight')}
            title="Align Right"
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
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('insertOrderedList')}
            title="Numbered List"
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
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={(emoji) => {
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
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('formatBlock', 'blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]"
            onClick={() => formatText('formatBlock', 'pre')}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-[#171717] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:dark:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            className={cn(
              "min-h-full outline-none leading-relaxed transition-colors",
              "text-gray-900 dark:text-white",
              "focus:ring-0 focus:outline-none",
              "prose prose-gray dark:prose-invert max-w-none",
              "overflow-auto break-words whitespace-pre-wrap",
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
          {(!content || content === '<p><br></p>' || content === '<p>Start typing...</p>' || content.trim() === '') && !isEditing && (
            <div className="absolute inset-0 pointer-events-none flex items-start justify-start">
              <p className="text-gray-400 dark:text-gray-500 text-base">
                {placeholder}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
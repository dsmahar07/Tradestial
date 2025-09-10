import { logger } from '@/lib/logger'

import { useCallback, useEffect } from 'react'
import { Note } from '@/app/notes/page'
import { convertHTMLToMarkdown, convertMarkdownToHTML } from '@/utils/editor/markdown-converter'
import { sanitizeHtml } from '@/utils/editor/html-sanitizer'
import { getAppleEmojiHTML, isEmoji } from '@/utils/editor/emoji-utils'

interface UseEditorHandlersProps {
  note: Note | null
  content: string
  isEditing: boolean
  isSettingUpEdit: React.MutableRefObject<boolean>
  editorRef: React.RefObject<HTMLDivElement>
  setContent: (content: string) => void
  setIsEditing: (value: boolean) => void
  onUpdateNote?: (id: string, content: string, title?: string) => void
}

export const useEditorHandlers = ({
  note,
  content,
  isEditing,
  isSettingUpEdit,
  editorRef,
  setContent,
  setIsEditing,
  onUpdateNote
}: UseEditorHandlersProps) => {
  
  // Format text command handler
  const formatText = useCallback((command: string, value?: string) => {
    if (!editorRef.current || !note) return

    try {
      // Ensure editor is focused and in editing mode
      if (!isEditing) {
        setIsEditing(true)
        // Wait for editor to be ready
        setTimeout(() => formatText(command, value), 50)
        return
      }

      editorRef.current.focus()

      // Save current selection
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      // Execute the command
      document.execCommand(command, false, value)

      // Get the updated content and convert back to markdown for storage
      setTimeout(() => {
        if (editorRef.current) {
          const htmlContent = editorRef.current.innerHTML
          const markdownContent = convertHTMLToMarkdown(htmlContent)
          setContent(markdownContent)
          setIsEditing(true)
        }
      }, 10)

    } catch (error) {
      logger.error(`Error executing command ${command}:`, error)
    }
  }, [note, isEditing, editorRef, setContent, setIsEditing])

  // Insert content handler
  const insertContent = useCallback((content: string) => {
    if (!editorRef.current || !note) return

    try {
      // Ensure editor is focused and in editing mode
      editorRef.current.focus()
      setIsEditing(true)

      // Check if content is a single emoji
      if (isEmoji(content) && content.length <= 2) {
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
          const htmlContent = editorRef.current.innerHTML
          const markdownContent = convertHTMLToMarkdown(htmlContent)
          setContent(markdownContent)
        }
      }, 0)

    } catch (error) {
      logger.error('Error inserting content:', error)
    }
  }, [note, editorRef, setContent, setIsEditing])

  // Set highlight color
  const setHighlight = useCallback((color: string) => {
    if (!editorRef.current || !note) return

    try {
      // Ensure editor is in edit mode and focused
      if (!isEditing) {
        setIsEditing(true)
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus()
            document.execCommand('hiliteColor', false, color)
            
            setTimeout(() => {
              if (editorRef.current) {
                const htmlContent = editorRef.current.innerHTML
                const markdownContent = convertHTMLToMarkdown(htmlContent)
                setContent(markdownContent)
              }
            }, 10)
          }
        }, 10)
      } else {
        editorRef.current.focus()
        document.execCommand('hiliteColor', false, color)
        
        setTimeout(() => {
          if (editorRef.current) {
            const htmlContent = editorRef.current.innerHTML
            const markdownContent = convertHTMLToMarkdown(htmlContent)
            setContent(markdownContent)
          }
        }, 10)
      }
    } catch (error) {
      logger.error('Error setting highlight:', error)
    }
  }, [note, isEditing, editorRef, setContent, setIsEditing])

  // Toggle quote formatting
  const toggleQuote = useCallback(() => {
    if (!editorRef.current || !note) return

    try {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      
      // Find if we're inside a blockquote
      let blockquote = container.nodeType === Node.ELEMENT_NODE ? 
        container as Element : container.parentElement
      
      while (blockquote && blockquote !== editorRef.current) {
        if (blockquote.tagName === 'BLOCKQUOTE') break
        blockquote = blockquote.parentElement
      }

      if (blockquote && blockquote.tagName === 'BLOCKQUOTE') {
        // Remove blockquote - replace with paragraph
        document.execCommand('formatBlock', false, 'p')
      } else {
        // Add blockquote
        document.execCommand('formatBlock', false, 'blockquote')
      }

      setTimeout(() => {
        if (editorRef.current) {
          const htmlContent = editorRef.current.innerHTML
          const markdownContent = convertHTMLToMarkdown(htmlContent)
          setContent(markdownContent)
          setIsEditing(true)
        }
      }, 10)
    } catch (error) {
      logger.error('Error toggling quote:', error)
    }
  }, [note, editorRef, setContent, setIsEditing])

  // Handle link insertion
  const handleLinkInsert = useCallback(() => {
    if (!editorRef.current || !note) return

    // Ensure editor is in edit mode
    if (!isEditing) {
      setIsEditing(true)
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus()
          const url = prompt('Enter URL:')
          if (url && url.trim()) {
            const u = url.trim()
            const lower = u.toLowerCase()
            if (lower.startsWith('http://') || lower.startsWith('https://')) {
              const selection = window.getSelection()
              const selectedText = selection?.toString() || u
              const linkHtml = `<a href="${u}" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;" target="_blank">${selectedText}</a>`
              insertContent(linkHtml)
            }
          }
        }
      }, 10)
    } else {
      const url = prompt('Enter URL:')
      if (url && url.trim()) {
        const u = url.trim()
        const lower = u.toLowerCase()
        if (lower.startsWith('http://') || lower.startsWith('https://')) {
          const selection = window.getSelection()
          const selectedText = selection?.toString() || u
          const linkHtml = `<a href="${u}" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;" target="_blank">${selectedText}</a>`
          insertContent(linkHtml)
        }
      }
    }
  }, [insertContent, note, isEditing, setIsEditing, editorRef])

  // Handle image upload
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          const imageHtml = `<p>&nbsp;</p><p>&nbsp;</p><div style="margin:16px 0;"><img src="${imageUrl}" style="width:500px;max-width:none;height:auto;border-radius:8px;display:block;" alt="Uploaded image" /></div><p>&nbsp;</p><p>&nbsp;</p>`
          insertContent(imageHtml)
        }
        reader.readAsDataURL(file)
      }
    }

    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  }, [insertContent])

  // Handle editor input
  const handleEditorInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!note) return
    // Skip input handling during the initial setup to avoid empty saves
    if (isSettingUpEdit.current) return

    try {
      const target = e.currentTarget
      if (target) {
        // Convert HTML back to markdown for storage while preserving WYSIWYG experience
        const htmlContent = target.innerHTML || ''
        const markdownContent = convertHTMLToMarkdown(htmlContent)

        // Only update if content actually changed and we're in editing mode
        if (markdownContent !== content && isEditing) {
          setContent(markdownContent)
        }
      }
    } catch (error) {
      logger.error('Error in handleEditorInput:', error)
    }
  }, [content, note, isEditing, isSettingUpEdit, setContent])

  // Handle editor blur
  const handleEditorBlur = useCallback((e: React.FocusEvent) => {
    // Only save and exit editing if focus is leaving the editor entirely
    const relatedTarget = e.relatedTarget as HTMLElement
    
    // Check if focus is moving to toolbar buttons, dropdowns, or other editor controls
    const isToolbarElement = relatedTarget && (
      relatedTarget.closest('[role="toolbar"]') ||
      relatedTarget.closest('button') ||
      relatedTarget.closest('[data-toolbar]') ||
      relatedTarget.closest('.toolbar') ||
      relatedTarget.closest('[data-radix-popper-content-wrapper]') ||
      relatedTarget.closest('[data-radix-dropdown-menu-content]') ||
      relatedTarget.closest('[role="menu"]') ||
      relatedTarget.closest('[role="menuitem"]') ||
      relatedTarget.closest('.dropdown-menu') ||
      relatedTarget.hasAttribute('data-toolbar-button') ||
      relatedTarget.tagName === 'BUTTON'
    )
    
    // Also check if we're interacting with AI enhancement elements
    const isAIElement = relatedTarget && (
      relatedTarget.closest('[data-ai-enhancement]') ||
      relatedTarget.closest('.ai-enhancement-dropdown') ||
      relatedTarget.id?.includes('ai-') ||
      relatedTarget.className?.includes('ai-')
    )
    
    // Don't exit edit mode if clicking on toolbar, AI elements, or if no related target
    const shouldStayInEditMode = !relatedTarget || isToolbarElement || isAIElement ||
      editorRef.current?.contains(relatedTarget)
    
    if (!shouldStayInEditMode) {
      // Convert final HTML content to markdown before saving
      if (editorRef.current && note) {
        const htmlContent = editorRef.current.innerHTML || ''
        const markdownContent = convertHTMLToMarkdown(htmlContent)
        
        // Prevent accidental empty overwrite unless user truly cleared it
        if (markdownContent.trim() === '' && content.trim() !== '') {
          // Restore previous content and skip saving empty
          editorRef.current.innerHTML = sanitizeHtml(convertMarkdownToHTML(content))
        } else if (markdownContent !== content) {
          setContent(markdownContent)
          onUpdateNote?.(note.id, markdownContent)
        }
      }
      setTimeout(() => setIsEditing(false), 150)
    }
  }, [content, note, onUpdateNote, editorRef, setContent, setIsEditing])

  // Handle editor click
  const handleEditorClick = useCallback(() => {
    if (!isEditing) {
      // Mark setup phase to avoid input/autosave race conditions
      isSettingUpEdit.current = true
      setIsEditing(true)
    }
  }, [isEditing, isSettingUpEdit, setIsEditing])

  return {
    formatText,
    insertContent,
    setHighlight,
    toggleQuote,
    handleLinkInsert,
    handleImageUpload,
    handleEditorInput,
    handleEditorBlur,
    handleEditorClick
  }
}
